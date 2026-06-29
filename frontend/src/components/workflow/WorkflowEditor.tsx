'use client'

import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Node, Edge, Connection,
  useNodesState, useEdgesState, addEdge,
  Controls, Background, MiniMap,
  ReactFlowProvider, ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import WorkflowNodeComponent from './WorkflowNode'
import NodePalette from './NodePalette'
import NodeProperties from './NodeProperties'

const nodeTypes = { workflowNode: WorkflowNodeComponent }

let nodeCounter = 0
function genId() {
  return `node_${++nodeCounter}_${Date.now()}`
}

const NODE_LABELS: Record<string, string> = {
  TRIGGER_MANUAL:         'Início Manual',
  TRIGGER_SCHEDULE:       'Agendamento',
  TRIGGER_DEMAND_CREATED: 'Nova Demanda',
  TRIGGER_DEMAND_STATUS:  'Mudança de Status',
  INPUT_FORM:             'Formulário',
  INPUT_DEMAND_DATA:      'Dados da Demanda',
  CONDITION:              'Condição',
  AI_ANALYZE:             'Analisar com IA',
  AI_SUMMARIZE:           'Resumir com IA',
  ACTION_NOTIFY:          'Notificar',
  ACTION_UPDATE_STATUS:   'Atualizar Status',
  ACTION_ASSIGN_REVIEWER: 'Atribuir Revisor',
  ACCESS_CONTROL:         'Controle de Acesso',
}

interface WorkflowEditorProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onChange?: (nodes: Node[], edges: Edge[]) => void
}

function Flow({ initialNodes = [], initialEdges = [], onChange }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const notify = useCallback((n: Node[], e: Edge[]) => {
    onChange?.(n, e)
  }, [onChange])

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const next = addEdge({ ...params, animated: true, style: { stroke: '#a78bfa' } }, eds)
      notify(nodes, next)
      return next
    })
  }, [nodes, notify, setEdges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const nodeType = event.dataTransfer.getData('application/reactflow-nodetype')
    if (!nodeType || !rfInstance || !reactFlowWrapper.current) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = rfInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    const newNode: Node = {
      id: genId(),
      type: 'workflowNode',
      position,
      data: {
        nodeType,
        label: NODE_LABELS[nodeType] ?? nodeType,
        config: {},
      },
    }

    setNodes((nds) => {
      const next = [...nds, newNode]
      notify(next, edges)
      return next
    })
  }, [rfInstance, edges, notify, setNodes])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onNodeDataChange = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => {
      const next = nds.map((n) => n.id === nodeId ? { ...n, data } : n)
      notify(next, edges)
      return next
    })
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data } : prev)
  }, [edges, notify, setNodes])

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
  }, [onNodesChange])

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes)
  }, [onEdgesChange])

  return (
    <div className="flex h-full w-full">
      <NodePalette />

      <div ref={reactFlowWrapper} className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-navy-950"
          defaultEdgeOptions={{ animated: true, style: { stroke: '#a78bfa', strokeWidth: 2 } }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1e2a3a"
          />
          <Controls
            className="!bg-navy-800 !border-navy-700 [&>button]:!bg-navy-800 [&>button]:!border-navy-700 [&>button]:!text-white [&>button:hover]:!bg-navy-700"
          />
          <MiniMap
            className="!bg-navy-900 !border-navy-700"
            nodeColor="#3b4f63"
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-navy-700">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="15" y="3" width="6" height="6" rx="1" />
                <rect x="9" y="15" width="6" height="6" rx="1" />
                <line x1="9" y1="6" x2="15" y2="6" />
                <line x1="12" y1="9" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm text-navy-600">Arraste componentes da esquerda para começar</p>
          </div>
        )}
      </div>

      {selectedNode && (
        <NodeProperties
          node={selectedNode}
          onChange={onNodeDataChange}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  )
}
