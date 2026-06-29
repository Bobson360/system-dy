import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Workflow } from '@prisma/client';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  private async getLawyer(userId: string) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Perfil de advogado não encontrado');
    return profile;
  }

  async create(userId: string, dto: CreateWorkflowDto) {
    const lawyer = await this.getLawyer(userId);
    return this.prisma.workflow.create({
      data: {
        lawyerId: lawyer.id,
        name: dto.name,
        description: dto.description,
        nodes: dto.nodes ?? [],
        edges: dto.edges ?? [],
        schedule: dto.schedule,
      },
    });
  }

  async findAll(userId: string) {
    const lawyer = await this.getLawyer(userId);
    return this.prisma.workflow.findMany({
      where: { lawyerId: lawyer.id },
      include: { _count: { select: { executions: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const lawyer = await this.getLawyer(userId);
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, lawyerId: lawyer.id },
      include: { executions: { orderBy: { startedAt: 'desc' }, take: 10 } },
    });
    if (!workflow) throw new NotFoundException();
    return workflow;
  }

  async update(userId: string, id: string, dto: UpdateWorkflowDto) {
    const lawyer = await this.getLawyer(userId);
    const existing = await this.prisma.workflow.findFirst({ where: { id, lawyerId: lawyer.id } });
    if (!existing) throw new NotFoundException();

    return this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.nodes !== undefined && { nodes: dto.nodes }),
        ...(dto.edges !== undefined && { edges: dto.edges }),
        ...(dto.schedule !== undefined && { schedule: dto.schedule }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const lawyer = await this.getLawyer(userId);
    const existing = await this.prisma.workflow.findFirst({ where: { id, lawyerId: lawyer.id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.workflow.delete({ where: { id } });
    return { deleted: true };
  }

  async execute(userId: string, id: string, input: Record<string, any> = {}) {
    const lawyer = await this.getLawyer(userId);
    const workflow = await this.prisma.workflow.findFirst({ where: { id, lawyerId: lawyer.id } });
    if (!workflow) throw new NotFoundException();
    return this.runGraph(workflow, input);
  }

  async getExecutions(userId: string, workflowId: string) {
    const lawyer = await this.getLawyer(userId);
    const workflow = await this.prisma.workflow.findFirst({ where: { id: workflowId, lawyerId: lawyer.id } });
    if (!workflow) throw new NotFoundException();
    return this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  // ── Endpoints públicos ──────────────────────────────────────────────────────

  async getPublicForm(workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, name: true, nodes: true, status: true },
    });
    if (!workflow) throw new NotFoundException();

    const nodes = (workflow.nodes as any[]) ?? [];
    const formNode = nodes.find((n) => n.data?.nodeType === 'INPUT_FORM');
    const config = formNode?.data?.config ?? {};

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      formTitle: config.formTitle ?? workflow.name,
      formDescription: config.formDescription ?? null,
      fields: (config.fields ?? []) as any[],
      accessLevel: config.accessLevel ?? 'LINK',
      isActive: workflow.status === 'ACTIVE',
    };
  }

  async submitForm(workflowId: string, formData: Record<string, any>) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundException();
    return this.runGraph(workflow, { formData, submittedAt: new Date().toISOString() });
  }

  // ── Engine de execução ─────────────────────────────────────────────────────

  private async runGraph(workflow: Workflow, input: Record<string, any>) {
    const execution = await this.prisma.workflowExecution.create({
      data: { workflowId: workflow.id, status: 'RUNNING', input, logs: [] },
    });

    try {
      const nodes = (workflow.nodes as any[]) ?? [];
      const edges = (workflow.edges as any[]) ?? [];
      const logs: any[] = [];

      const adj: Record<string, string[]> = {};
      for (const edge of edges) {
        if (!adj[edge.source]) adj[edge.source] = [];
        adj[edge.source].push(edge.target);
      }

      const startNode =
        nodes.find((n) => String(n.data?.nodeType ?? '').startsWith('TRIGGER')) ??
        nodes.find((n) => n.data?.nodeType === 'INPUT_FORM');

      if (!startNode) throw new Error('Nenhum nó de início encontrado no fluxo');

      const visited = new Set<string>();
      const queue = [startNode.id as string];
      let context: Record<string, any> = { ...input };

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const result = await this.executeNode(node, context);
        logs.push({
          nodeId,
          nodeType: node.data?.nodeType,
          label: node.data?.label,
          result,
          timestamp: new Date().toISOString(),
        });
        context = { ...context, ...result };

        for (const nextId of adj[nodeId] ?? []) {
          queue.push(nextId);
        }
      }

      return this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'COMPLETED', output: context, logs, finishedAt: new Date() },
      });
    } catch (e: any) {
      return this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', error: e.message, finishedAt: new Date() },
      });
    }
  }

  private async executeNode(node: any, context: Record<string, any>): Promise<Record<string, any>> {
    const nodeType: string = node.data?.nodeType ?? '';
    const config: any = node.data?.config ?? {};

    switch (nodeType) {
      case 'TRIGGER_MANUAL':
        return { triggered: true, triggeredAt: new Date().toISOString() };
      case 'TRIGGER_SCHEDULE':
        return { triggered: true, schedule: config.schedule };
      case 'TRIGGER_DEMAND_CREATED':
        return { triggered: true, demandId: context.demandId, category: config.category };
      case 'TRIGGER_DEMAND_STATUS':
        return { triggered: true, fromStatus: config.fromStatus, targetStatus: config.status };

      case 'INPUT_FORM':
        return { formReceived: true, ...context.formData };
      case 'INPUT_DEMAND_DATA': {
        const fields: string[] = config.fields ?? ['title', 'body', 'category'];
        const result: Record<string, any> = {};
        for (const f of fields) result[f] = context[f] ?? `[${f}]`;
        return result;
      }

      case 'CONDITION': {
        const fieldValue = context[config.field];
        const op = config.operator ?? 'equals';
        let conditionResult = false;
        if (op === 'equals')       conditionResult = String(fieldValue) === String(config.value);
        else if (op === 'not_equals')   conditionResult = String(fieldValue) !== String(config.value);
        else if (op === 'contains')     conditionResult = String(fieldValue).includes(String(config.value));
        else if (op === 'not_contains') conditionResult = !String(fieldValue).includes(String(config.value));
        else if (op === 'gt')           conditionResult = Number(fieldValue) > Number(config.value);
        else if (op === 'lt')           conditionResult = Number(fieldValue) < Number(config.value);
        else if (op === 'is_empty')     conditionResult = !fieldValue || fieldValue === '';
        else if (op === 'is_not_empty') conditionResult = !!fieldValue && fieldValue !== '';
        return { conditionResult };
      }

      case 'AI_ANALYZE':
        return {
          aiSummary: '[Mock] A demanda envolve questão de direito civil com boa probabilidade de êxito.',
          aiRisks: ['Risco de prescrição em 3 anos', 'Possível insolvência do réu'],
          aiActions: ['Notificação extrajudicial imediata', 'Ação monitória'],
          aiConfidence: 0.87,
          aiFocusAreas: config.focusAreas ?? [],
        };
      case 'AI_SUMMARIZE':
        return {
          summary: '[Mock] Resumo: caso de cobrança com alta probabilidade de êxito.',
          format: config.format ?? 'paragraph',
        };

      case 'ACTION_NOTIFY':
        return {
          notified: true,
          recipients: config.recipients ?? ['LAWYER'],
          channel: config.channel ?? 'in_app',
          message: config.message ?? 'Fluxo executado com sucesso.',
        };
      case 'ACTION_UPDATE_STATUS':
        return {
          statusUpdated: true,
          newStatus: config.status ?? 'ANALYZING',
          reason: config.reason,
        };
      case 'ACTION_ASSIGN_REVIEWER':
        return { reviewerAssigned: true, mode: config.mode ?? 'auto' };

      case 'ACCESS_CONTROL':
        return { accessConfigured: true, roles: config.roles ?? [], resultVisibility: config.resultVisibility };

      default:
        return {};
    }
  }
}
