'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, Upload, Trash2, FileText, Image, File } from 'lucide-react'
import api from '@/lib/api'

interface Document {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: string
}

interface Props {
  demandId?: string
  clientId?: string
  readOnly?: boolean
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={14} className="text-blue-400" />
  if (mimeType === 'application/pdf') return <FileText size={14} className="text-red-400" />
  return <File size={14} className="text-navy-400" />
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentSection({ demandId, clientId, readOnly = false }: Props) {
  const [docs, setDocs]       = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    const params = new URLSearchParams()
    if (demandId) params.set('demandId', demandId)
    if (clientId) params.set('clientId', clientId)
    try {
      const { data } = await api.get(`/documents?${params}`)
      setDocs(Array.isArray(data) ? data : [])
    } catch {
      setDocs([])
    }
  }

  useEffect(() => { loadDocs() }, [demandId, clientId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      if (demandId) form.append('demandId', demandId)
      if (clientId) form.append('clientId', clientId)
      await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await loadDocs()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar arquivo.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(docId: string) {
    try {
      await api.delete(`/documents/${docId}`)
      setDocs((prev) => prev.filter((d) => d.id !== docId))
    } catch {
      setError('Erro ao excluir documento.')
    }
  }

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-800 px-5 py-4">
        <h4 className="flex items-center gap-2 font-semibold text-white">
          <Paperclip size={15} className="text-navy-400" />
          Documentos ({docs.length})
        </h4>
        {!readOnly && (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-1.5 text-xs text-navy-300 hover:text-white disabled:opacity-50 transition-colors"
            >
              <Upload size={12} />
              {uploading ? 'Enviando...' : 'Anexar'}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="px-5 pt-3 text-xs text-red-400">{error}</p>
      )}

      {docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Paperclip size={28} className="text-navy-700" />
          <p className="text-xs text-navy-500">Nenhum documento anexado.</p>
          {!readOnly && (
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-gold-500 hover:text-gold-400 transition-colors"
            >
              Anexar arquivo
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-navy-800">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <a
                href={`http://localhost:3000${doc.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {fileIcon(doc.mimeType)}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{doc.fileName}</p>
                  <p className="text-xs text-navy-600">{formatSize(doc.fileSize)}</p>
                </div>
              </a>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="shrink-0 text-navy-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
