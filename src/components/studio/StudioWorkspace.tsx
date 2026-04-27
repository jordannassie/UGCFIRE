'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import {
  isDemoMode as checkDemoMode,
  DEMO_CONTENT_ITEMS, DEMO_ALL_CONTENT, DEMO_COMPANIES,
  DEMO_COMMENTS, DEMO_CLIENT_UPLOADS,
} from '@/lib/demoData'
import {
  Search, Upload, Download, LayoutGrid, List, X, Check,
  Image as ImageIcon, Video, PenTool, LayoutTemplate, File,
  CheckCircle2, Clock, Loader, CheckCheck, Archive, AlertCircle,
  MessageSquare, RotateCcw, Star, Send, ChevronRight,
  Paperclip, Eye, SlidersHorizontal, MessageCircle, Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'client' | 'admin'
type Status = 'in_production' | 'ready_for_review' | 'revision_requested' | 'approved' | 'delivered' | 'archived'
type MediaType = 'photo' | 'video' | 'graphic' | 'carousel' | 'other'

export interface ContentItem {
  id: string
  company_id: string
  company_name?: string
  upload_batch_id?: string | null
  title: string
  description?: string | null
  media_type: MediaType
  content_type?: string | null
  status: Status
  week_label?: string | null
  file_url?: string | null
  thumbnail_url?: string | null
  file_name?: string | null
  file_size?: number | null
  can_showcase: boolean
  uploaded_by?: string
  uploaded_at: string
  approved_at?: string | null
  delivered_at?: string | null
  deleted_at?: string | null
  created_at?: string
}

export interface ContentComment {
  id: string
  content_item_id: string | null
  company_id?: string
  sender_user_id?: string | null
  sender_role: 'client' | 'admin'
  message: string
  is_internal: boolean
  created_at: string
}

export interface ClientUpload {
  id: string
  company_id: string
  file_url: string
  file_name: string
  file_type?: string | null
  upload_category: string
  title: string
  notes?: string | null
  status: string
  created_at: string
}

interface Company {
  id: string
  name: string
  billing_status?: string
}

export interface StudioWorkspaceProps {
  role: Role
  companyId?: string
  demoMode?: boolean
  initialView?: string
  initialPanel?: string
  initialMode?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  in_production:      { label: 'In Production',     color: 'bg-yellow-500/20 text-yellow-300' },
  ready_for_review:   { label: 'Needs Review',       color: 'bg-blue-500/20 text-blue-300' },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-500/20 text-orange-300' },
  approved:           { label: 'Approved',            color: 'bg-green-500/20 text-green-300' },
  delivered:          { label: 'Delivered',           color: 'bg-emerald-500/20 text-emerald-300' },
  archived:           { label: 'Archived',            color: 'bg-gray-500/20 text-gray-400' },
}

const STATUS_OPTIONS: Status[] = [
  'in_production', 'ready_for_review', 'revision_requested', 'approved', 'delivered', 'archived',
]

const MEDIA_ICONS: Record<string, React.ElementType> = {
  photo: ImageIcon, video: Video, graphic: PenTool, carousel: LayoutTemplate, other: File,
}

const UPLOAD_CATEGORIES = [
  'Brand Asset', 'Product Photo', 'Raw Video', 'Reference Photo',
  'Reference Video', 'Testimonial', 'Founder Clip', 'Ad Example', 'Other',
]

const CONTENT_TYPES = [
  'UGC Video', 'Product Demo', 'Lifestyle Photo', 'Ad Creative',
  'Founder Clip', 'Testimonial', 'Carousel', 'Graphic', 'Raw Asset', 'Other',
]

// Map URL view param -> status filter
const VIEW_TO_STATUS: Record<string, string> = {
  needs_review:  'ready_for_review',
  approved:      'approved',
  delivered:     'delivered',
  revisions:     'revision_requested',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtRelative(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Tiny shared components ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status]
  if (!m) return null
  return <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${m.color}`}>{m.label}</span>
}

function MediaTypeIcon({ type, size = 12 }: { type: string; size?: number }) {
  const Icon = MEDIA_ICONS[type] ?? File
  return <Icon size={size} />
}

function MediaPreview({ url, type, className = '' }: { url?: string | null; type: MediaType; className?: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] text-white/20 ${className}`}>
        <MediaTypeIcon type={type} size={20} />
      </div>
    )
  }
  if (type === 'video') {
    return <video src={url} className={`object-contain bg-[#0a0a0a] ${className}`} muted preload="metadata" />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`object-contain bg-[#0a0a0a] ${className}`} />
}

// ─── Client Upload Modal ──────────────────────────────────────────────────────

function ClientUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState(UPLOAD_CATEGORIES[0])
  const [notes, setNotes] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (list) setFiles(p => [...p, ...Array.from(list)])
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 1200))
    setUploading(false)
    onUploaded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-white font-semibold text-sm">Upload Assets</p>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={17} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition ${dragging ? 'border-[#FF3B1A]/60 bg-[#FF3B1A]/5' : 'border-white/10 hover:border-white/20'}`}
          >
            <Upload size={22} className="text-white/30 mx-auto mb-2" />
            <p className="text-white/50 text-sm">Drop files or click to browse</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-xs">
                  <Paperclip size={11} className="text-white/40" />
                  <span className="flex-1 text-white truncate">{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {UPLOAD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context for your team..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] resize-none h-16" />
            </div>
          </div>

          <button onClick={handleUpload} disabled={!files.length || uploading} className="w-full bg-[#FF3B1A] text-white font-bold py-2.5 rounded-lg text-sm hover:bg-[#e02e10] transition disabled:opacity-50">
            {uploading ? 'Uploading...' : `Upload ${files.length || ''} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bulk Upload Modal (Admin) ────────────────────────────────────────────────

function BulkUploadModal({ companies, onClose, onUploaded }: {
  companies: Company[]
  onClose: () => void
  onUploaded: (n: number) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [clientId, setClientId] = useState(companies[0]?.id ?? '')
  const [batchName, setBatchName] = useState('')
  const [weekLabel, setWeekLabel] = useState('Week 1 - May 2026')
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [showcase, setShowcase] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (list) setFiles(p => [...p, ...Array.from(list)])
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i)
      await new Promise(r => setTimeout(r, 100))
    }
    setUploading(false)
    onUploaded(files.length)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-white font-semibold text-sm">Bulk Upload Content</p>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={17} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragging ? 'border-[#FF3B1A]/60 bg-[#FF3B1A]/5' : 'border-white/10 hover:border-white/20'}`}
          >
            <Upload size={22} className="text-white/30 mx-auto mb-2" />
            <p className="text-white/50 text-sm">Drop files or click to browse</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded px-2.5 py-1.5 text-xs">
                  <MediaTypeIcon type={f.type.startsWith('video') ? 'video' : 'photo'} size={11} />
                  <span className="flex-1 text-white/80 truncate">{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF3B1A] rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-white/40 text-xs text-center">{progress}% uploaded</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Batch Name</label>
              <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Week 1 May 2026" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A]" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Week Label</label>
              <input value={weekLabel} onChange={e => setWeekLabel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Content Type</label>
              <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => setShowcase(p => !p)} className={`w-9 h-5 rounded-full relative transition ${showcase ? 'bg-[#FF3B1A]' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showcase ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className="text-white/50 text-sm">Can showcase</span>
            <span className="text-white/25 text-xs ml-auto">Default: ready for review</span>
          </label>

          <button onClick={handleUpload} disabled={!files.length || uploading} className="w-full bg-[#FF3B1A] text-white font-bold py-2.5 rounded-lg text-sm hover:bg-[#e02e10] transition disabled:opacity-50">
            {uploading ? `Uploading ${files.length} files...` : `Upload ${files.length || ''} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  comments, role, onSend, onClose,
}: {
  comments: ContentComment[]
  role: Role
  onSend: (msg: string, internal: boolean) => void
  onClose: () => void
}) {
  const [msg, setMsg] = useState('')
  const [internal, setInternal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  function send() {
    if (!msg.trim()) return
    onSend(msg.trim(), internal)
    setMsg('')
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[360px] bg-[#0d0d0d] border-l border-white/8 flex flex-col z-40 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-[#FF3B1A]" />
          <p className="text-white font-semibold text-sm">Workspace Chat</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={17} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 && (
          <div className="text-center pt-8 text-white/25">
            <MessageCircle size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No messages yet. Start the conversation.</p>
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} className={`flex gap-2 ${c.sender_role === role ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${c.sender_role === 'admin' ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
              {c.sender_role === 'admin' ? 'A' : 'C'}
            </div>
            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
              c.is_internal ? 'bg-yellow-500/8 border border-yellow-500/20 text-yellow-200' :
              c.sender_role === role ? 'bg-[#FF3B1A]/15 border border-[#FF3B1A]/20 text-white' :
              'bg-white/5 border border-white/8 text-white/80'
            }`}>
              <p>{c.message}</p>
              <p className="text-[9px] mt-1 opacity-40">{fmtRelative(c.created_at)}{c.is_internal ? ' · internal' : ''}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/8 space-y-2">
        {role === 'admin' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setInternal(p => !p)} className={`w-7 h-4 rounded-full relative transition ${internal ? 'bg-yellow-500/60' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${internal ? 'left-3.5' : 'left-0.5'}`} />
            </div>
            <span className="text-white/40 text-[10px]">Internal note</span>
          </label>
        )}
        <div className="flex gap-2">
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A]"
          />
          <button onClick={send} className="bg-[#FF3B1A] text-white px-3 py-2 rounded-lg hover:bg-[#e02e10] transition">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  item, role, comments, onClose, onStatusChange, onToast,
}: {
  item: ContentItem
  role: Role
  comments: ContentComment[]
  onClose: () => void
  onStatusChange: (id: string, status: Status) => void
  onToast: (msg: string) => void
}) {
  const [localComments, setLocalComments] = useState<ContentComment[]>(comments)
  const [msg, setMsg] = useState('')
  const [internal, setInternal] = useState(false)
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [status, setStatus] = useState<Status>(item.status)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalComments(comments) }, [comments])
  useEffect(() => { setStatus(item.status) }, [item.status])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [localComments])

  function sendComment(message: string, isInternal: boolean) {
    if (!message.trim()) return
    const newC: ContentComment = {
      id: `c-${Date.now()}`,
      content_item_id: item.id,
      sender_role: role,
      message: message.trim(),
      is_internal: isInternal,
      created_at: new Date().toISOString(),
    }
    setLocalComments(p => [...p, newC])
  }

  function submitComment() {
    sendComment(msg, internal)
    setMsg('')
  }

  function approve() {
    onStatusChange(item.id, 'approved')
    setStatus('approved')
    onToast('Content approved.')
  }

  function submitRevision() {
    if (!revisionNote.trim()) return
    sendComment(revisionNote, false)
    onStatusChange(item.id, 'revision_requested')
    setStatus('revision_requested')
    setRevisionNote('')
    setShowRevisionInput(false)
    onToast('Revision request submitted.')
  }

  const isVideo = item.media_type === 'video'
  const hasFile = !!item.file_url

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d0d] border-l border-white/8 flex flex-col z-40 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/8">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-white font-semibold text-sm leading-snug">{item.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={status} />
            <span className="text-white/30 text-[10px] capitalize">{item.media_type}</span>
            {item.company_name && role === 'admin' && (
              <span className="text-white/30 text-[10px]">· {item.company_name}</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition p-1 shrink-0"><X size={17} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="bg-[#080808] aspect-video flex items-center justify-center">
          {hasFile ? (
            isVideo
              ? <video src={item.file_url!} className="w-full h-full object-contain" controls />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={item.file_url!} alt={item.title} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/20">
              <MediaTypeIcon type={item.media_type} size={36} />
              <span className="text-xs">In production</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="px-5 py-3 border-b border-white/8 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {[
            ['Content Type', item.content_type],
            ['Week', item.week_label?.split(' - ')[0]],
            ['Uploaded', item.uploaded_at ? fmtDate(item.uploaded_at) : null],
            ['Approved', item.approved_at ? fmtDate(item.approved_at) : null],
            ['Delivered', item.delivered_at ? fmtDate(item.delivered_at) : null],
            ['Showcase', item.can_showcase ? 'Yes' : 'No'],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string}>
              <p className="text-white/30">{label}</p>
              <p className="text-white/80">{value}</p>
            </div>
          ))}
        </div>

        {/* Admin: status selector */}
        {role === 'admin' && (
          <div className="px-5 py-3 border-b border-white/8">
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide mb-2">Change Status</p>
            <div className="grid grid-cols-2 gap-1">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); onStatusChange(item.id, s); onToast(`Status: ${STATUS_META[s].label}`) }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
                    status === s ? STATUS_META[s].color : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>

            {/* Admin quick-send actions */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button onClick={() => { setStatus('ready_for_review'); onStatusChange(item.id, 'ready_for_review'); onToast('Sent to client for review.') }}
                className="flex items-center gap-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] px-2.5 py-1.5 rounded-lg transition">
                <Send size={11} /> Send to Client
              </button>
              <button onClick={() => { setStatus('delivered'); onStatusChange(item.id, 'delivered'); onToast('Marked delivered.') }}
                className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] px-2.5 py-1.5 rounded-lg transition">
                <CheckCheck size={11} /> Mark Delivered
              </button>
              {hasFile && (
                <button onClick={() => onToast('Preparing download...')}
                  className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 text-[11px] px-2.5 py-1.5 rounded-lg transition">
                  <Download size={11} /> Download
                </button>
              )}
            </div>
          </div>
        )}

        {/* Client: approve/revision/download actions */}
        {role === 'client' && (
          <div className="px-5 py-3 border-b border-white/8 space-y-2">
            {status === 'ready_for_review' && (
              <>
                <button onClick={approve} className="w-full bg-green-500/15 hover:bg-green-500/25 text-green-300 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                  <CheckCircle2 size={15} /> Approve Content
                </button>
                {!showRevisionInput ? (
                  <button onClick={() => setShowRevisionInput(true)} className="w-full bg-white/5 hover:bg-white/8 text-white/60 text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                    <RotateCcw size={14} /> Request Revision
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      placeholder="What needs to change?"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-orange-400/60 resize-none h-20"
                    />
                    <div className="flex gap-2">
                      <button onClick={submitRevision} className="flex-1 bg-orange-500/20 text-orange-300 text-xs py-2 rounded-lg hover:bg-orange-500/30 transition">Submit</button>
                      <button onClick={() => setShowRevisionInput(false)} className="text-white/40 text-xs px-3 hover:text-white transition">Cancel</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {hasFile && (
              <button onClick={() => onToast('Preparing download...')} className="w-full bg-white/5 hover:bg-white/8 text-white/60 text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition">
                <Download size={14} /> Download
              </button>
            )}
          </div>
        )}

        {/* Comments thread */}
        <div className="px-5 py-4">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide mb-3">Comments</p>
          <div className="space-y-3 mb-4">
            {localComments.length === 0 && <p className="text-white/20 text-xs">No comments yet.</p>}
            {localComments.filter(c => !c.is_internal || role === 'admin').map(c => (
              <div key={c.id} className={`flex gap-2 ${c.sender_role === role ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${c.sender_role === 'admin' ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
                  {c.sender_role === 'admin' ? 'A' : 'C'}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                  c.is_internal ? 'bg-yellow-500/8 border border-yellow-500/20 text-yellow-200' :
                  c.sender_role === role ? 'bg-[#FF3B1A]/10 border border-[#FF3B1A]/15 text-white/90' :
                  'bg-white/5 border border-white/8 text-white/80'
                }`}>
                  <p>{c.message}</p>
                  {c.is_internal && <p className="text-yellow-500/50 text-[9px] mt-0.5">internal note</p>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Add comment */}
          <div className="space-y-2">
            {role === 'admin' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setInternal(p => !p)} className={`w-7 h-4 rounded-full relative transition ${internal ? 'bg-yellow-500/60' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${internal ? 'left-3.5' : 'left-0.5'}`} />
                </div>
                <span className="text-white/35 text-[10px]">Internal note (hidden from client)</span>
              </label>
            )}
            <div className="flex gap-2">
              <input
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A]"
              />
              <button onClick={submitComment} className="bg-[#FF3B1A] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#e02e10] transition">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Content Card (grid) ─────────────────────────────────────────────────────

function ContentCard({
  item, selected, commentCount, onSelect, onOpen,
}: {
  item: ContentItem
  selected: boolean
  commentCount: number
  onSelect: () => void
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      className={`group relative bg-[#111] border rounded-xl overflow-hidden cursor-pointer transition-all duration-150 ${
        selected ? 'border-[#FF3B1A]/50 ring-1 ring-[#FF3B1A]/20' : 'border-white/8 hover:border-white/18'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border flex items-center justify-center transition ${
          selected ? 'bg-[#FF3B1A] border-[#FF3B1A]' : 'bg-black/50 border-white/25 opacity-0 group-hover:opacity-100'
        }`}
        onClick={e => { e.stopPropagation(); onSelect() }}
      >
        {selected && <Check size={11} className="text-white" />}
      </div>

      {/* Preview area */}
      <div className="h-32 bg-[#0a0a0a] relative overflow-hidden">
        <MediaPreview url={item.file_url} type={item.media_type} className="w-full h-full" />

        {/* Media badge */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white/50 text-[9px] px-1.5 py-0.5 rounded">
          <MediaTypeIcon type={item.media_type} size={9} />
          <span className="capitalize">{item.media_type}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-white text-[12px] font-medium truncate mb-1.5">{item.title}</p>
        <div className="flex items-center justify-between">
          <StatusBadge status={item.status} />
          <div className="flex items-center gap-2 text-white/25 text-[9px]">
            {commentCount > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={9} />{commentCount}</span>}
            <span>{item.week_label?.split(' ')[0] ?? fmtDate(item.uploaded_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Client Panel ───────────────────────────────────────────────────────

function AdminClientPanel({
  companies, allContent, selected, onSelect,
}: {
  companies: Company[]
  allContent: ContentItem[]
  selected: string
  onSelect: (id: string) => void
}) {
  function stats(id: string) {
    const items = allContent.filter(i => i.company_id === id)
    return {
      review:    items.filter(i => i.status === 'ready_for_review').length,
      revisions: items.filter(i => i.status === 'revision_requested').length,
      total:     items.length,
    }
  }

  return (
    <div className="w-48 shrink-0 border-r border-white/8 pr-4 space-y-0.5 overflow-y-auto">
      <p className="text-white/25 text-[9px] font-semibold uppercase tracking-widest px-2 mb-3">Clients</p>
      <button
        onClick={() => onSelect('all')}
        className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition ${selected === 'all' ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20' : 'text-white/45 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[12px] font-medium">All Clients</span>
        <span className="ml-1.5 text-white/25 text-[10px]">({allContent.length})</span>
      </button>
      {companies.map(co => {
        const s = stats(co.id)
        const isSelected = selected === co.id
        return (
          <button
            key={co.id}
            onClick={() => onSelect(co.id)}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition ${isSelected ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20' : 'text-white/45 hover:text-white hover:bg-white/5'}`}
          >
            <p className="text-[12px] font-medium truncate">{co.name}</p>
            {(s.review > 0 || s.revisions > 0) && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {s.review > 0 && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">{s.review} review</span>}
                {s.revisions > 0 && <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full">{s.revisions} rev</span>}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main StudioWorkspace ─────────────────────────────────────────────────────

export default function StudioWorkspace({
  role, companyId: initialCompanyId, demoMode, initialView, initialPanel, initialMode,
}: StudioWorkspaceProps) {
  const demo = demoMode ?? checkDemoMode()

  // Data
  const [items, setItems]               = useState<ContentItem[]>([])
  const [clientUploads, setClientUploads] = useState<ClientUpload[]>([])
  const [comments, setComments]         = useState<ContentComment[]>([])
  const [companies, setCompanies]       = useState<Company[]>([])
  const [companyId, setCompanyId]       = useState<string | null>(initialCompanyId ?? null)

  // Filters
  const [selectedCompany, setSelectedCompany] = useState<string>('all')  // admin only
  const [statusFilter, setStatusFilter] = useState<string>(VIEW_TO_STATUS[initialView ?? ''] ?? 'all')
  const [mediaFilter, setMediaFilter]   = useState<string>('all')
  const [weekFilter, setWeekFilter]     = useState<string>('all')
  const [search, setSearch]             = useState('')
  const [showClientUploads, setShowClientUploads] = useState(initialView === 'client_uploads')

  // UI
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [activeItem, setActiveItem]     = useState<ContentItem | null>(null)
  const [layout, setLayout]             = useState<'grid' | 'list'>(role === 'admin' ? 'list' : 'grid')
  const [chatOpen, setChatOpen]         = useState(initialPanel === 'chat' || initialPanel === 'messages')
  const [clientUploadOpen, setClientUploadOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(initialMode === 'bulk_upload')
  const [toast, setToast]               = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (demo) {
      if (role === 'admin') {
        setItems(DEMO_ALL_CONTENT as ContentItem[])
        setCompanies(DEMO_COMPANIES.map(c => ({ id: c.id, name: c.name, billing_status: c.billing_status })))
      } else {
        setItems(DEMO_CONTENT_ITEMS as ContentItem[])
      }
      setClientUploads(DEMO_CLIENT_UPLOADS as ClientUpload[])
      setComments(DEMO_COMMENTS as ContentComment[])
      return
    }

    async function load() {
      const supabase = createClient()

      if (role === 'client') {
        const co = await getMyCompany()
        if (!co) return
        setCompanyId(co.id)

        const [{ data: ci }, { data: cu }] = await Promise.all([
          supabase.from('content_items').select('*').eq('company_id', co.id).is('deleted_at', null).order('uploaded_at', { ascending: false }),
          supabase.from('client_uploads').select('*').eq('company_id', co.id).order('created_at', { ascending: false }),
        ])
        if (ci) setItems(ci as ContentItem[])
        if (cu) setClientUploads(cu as ClientUpload[])

        const { data: cm } = await supabase.from('content_comments').select('*').eq('company_id', co.id).eq('is_internal', false).order('created_at')
        if (cm) setComments(cm as ContentComment[])
      } else {
        const [{ data: cos }, { data: ci }, { data: cm }] = await Promise.all([
          supabase.from('companies').select('id, name, billing_status').order('name'),
          supabase.from('content_items').select('*, companies(name)').is('deleted_at', null).order('uploaded_at', { ascending: false }),
          supabase.from('content_comments').select('*').order('created_at'),
        ])
        if (cos) setCompanies(cos)
        if (ci) setItems(ci.map((r: ContentItem & { companies?: { name: string } }) => ({ ...r, company_name: r.companies?.name })) as ContentItem[])
        if (cm) setComments(cm as ContentComment[])
      }
    }

    load()
  }, [demo, role])

  // ── Realtime sync (real mode only) ────────────────────────────────────────

  useEffect(() => {
    if (demo) return
    const supabase = createClient()
    const channel = supabase
      .channel(`studio-${role}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'content_items' }, ({ new: updated }) => {
        setItems(p => p.map(i => i.id === (updated as ContentItem).id ? { ...i, ...(updated as ContentItem) } : i))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'content_items' }, ({ new: inserted }) => {
        setItems(p => [inserted as ContentItem, ...p])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'content_comments' }, ({ new: inserted }) => {
        setComments(p => [...p, inserted as ContentComment])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [demo, role])

  // ── Derived data ──────────────────────────────────────────────────────────

  const weeks = Array.from(new Set(items.map(i => i.week_label).filter(Boolean))) as string[]

  const filteredItems = items.filter(item => {
    if (item.deleted_at) return false
    if (role === 'admin' && selectedCompany !== 'all' && item.company_id !== selectedCompany) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (mediaFilter !== 'all' && item.media_type !== mediaFilter) return false
    if (weekFilter !== 'all' && item.week_label !== weekFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!item.title.toLowerCase().includes(q) && !(item.company_name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const generalChat = comments.filter(c => !c.content_item_id)
  function itemComments(id: string) { return comments.filter(c => c.content_item_id === id) }
  function commentCount(id: string) { return itemComments(id).length }

  // ── Actions ───────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function updateStatus(id: string, status: Status) {
    setItems(p => p.map(i => i.id === id ? { ...i, status, ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}), ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}) } : i))
    if (activeItem?.id === id) setActiveItem(p => p ? { ...p, status } : null)

    if (!demo) {
      const supabase = createClient()
      supabase.from('content_items').update({ status }).eq('id', id).then(() => {})
    }
  }

  function sendComment(msg: string, isInternal: boolean, contentItemId: string | null = null) {
    const newC: ContentComment = {
      id: `c-${Date.now()}`,
      content_item_id: contentItemId,
      sender_role: role,
      message: msg,
      is_internal: isInternal,
      created_at: new Date().toISOString(),
    }
    setComments(p => [...p, newC])

    if (!demo) {
      const supabase = createClient()
      supabase.from('content_comments').insert({
        content_item_id: contentItemId,
        company_id: companyId,
        sender_role: role,
        message: msg,
        is_internal: isInternal,
      }).then(() => {})
    }
  }

  const drawerOrChatOpen = !!activeItem || chatOpen
  const mainPadding = drawerOrChatOpen ? 'pr-[428px]' : ''

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] border border-white/15 text-white text-sm px-5 py-3 rounded-xl shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      {/* Backdrop for drawer/chat */}
      {(activeItem || chatOpen) && (
        <div className="fixed inset-0 z-30 bg-black/25" onClick={() => { setActiveItem(null); setChatOpen(false) }} />
      )}

      {/* Modals */}
      {clientUploadOpen && <ClientUploadModal onClose={() => setClientUploadOpen(false)} onUploaded={() => showToast('Assets uploaded successfully.')} />}
      {bulkUploadOpen && <BulkUploadModal companies={companies} onClose={() => setBulkUploadOpen(false)} onUploaded={n => showToast(`${n} file${n > 1 ? 's' : ''} uploaded and queued for review.`)} />}

      {/* Chat panel */}
      {chatOpen && !activeItem && (
        <ChatPanel
          comments={generalChat}
          role={role}
          onSend={(msg, internal) => sendComment(msg, internal, null)}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Detail drawer */}
      {activeItem && (
        <DetailDrawer
          item={activeItem}
          role={role}
          comments={itemComments(activeItem.id)}
          onClose={() => setActiveItem(null)}
          onStatusChange={updateStatus}
          onToast={showToast}
        />
      )}

      {/* ── Main layout ── */}
      <div className={`flex gap-5 transition-all duration-200 ${mainPadding}`}>

        {/* Admin left client panel */}
        {role === 'admin' && (
          <AdminClientPanel
            companies={companies}
            allContent={items}
            selected={selectedCompany}
            onSelect={setSelectedCompany}
          />
        )}

        {/* Center content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] w-40" />
            </div>

            {/* Status filter */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>

            {/* Media filter */}
            <select value={mediaFilter} onChange={e => setMediaFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
              <option value="all">All Media</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="graphic">Graphic</option>
              <option value="carousel">Carousel</option>
            </select>

            {/* Week filter */}
            {weeks.length > 0 && (
              <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
                <option value="all">All Weeks</option>
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            )}

            {/* Client upload shortcut */}
            {role === 'client' && (
              <button onClick={() => { setShowClientUploads(false); setStatusFilter('ready_for_review') }} className={`text-xs px-2.5 py-2 rounded-lg transition ${statusFilter === 'ready_for_review' && !showClientUploads ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                <span className="flex items-center gap-1"><Clock size={11} /> Needs Review {items.filter(i => i.status === 'ready_for_review').length > 0 && `(${items.filter(i => i.status === 'ready_for_review').length})`}</span>
              </button>
            )}

            <div className="flex-1" />

            {/* Layout toggle */}
            <div className="flex bg-white/5 rounded-lg p-0.5">
              <button onClick={() => setLayout('grid')} className={`p-1.5 rounded transition ${layout === 'grid' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}><LayoutGrid size={13} /></button>
              <button onClick={() => setLayout('list')} className={`p-1.5 rounded transition ${layout === 'list' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}><List size={13} /></button>
            </div>

            {/* Chat toggle */}
            <button
              onClick={() => { setActiveItem(null); setChatOpen(p => !p) }}
              className={`p-2 rounded-lg transition relative ${chatOpen ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-white/5 text-white/50 hover:text-white'}`}
            >
              <MessageCircle size={14} />
              {generalChat.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF3B1A] rounded-full" />}
            </button>

            {/* Client uploads tab */}
            <button
              onClick={() => setShowClientUploads(p => !p)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg transition ${showClientUploads ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-white/5 text-white/50 hover:text-white'}`}
            >
              <Paperclip size={12} /> Assets
            </button>

            {/* Admin: bulk upload */}
            {role === 'admin' && (
              <button onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/70 text-xs px-3 py-2 rounded-lg transition">
                <Plus size={12} /> New Batch
              </button>
            )}

            {/* Upload button */}
            {role === 'client' && (
              <button onClick={() => setClientUploadOpen(true)} className="flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#e02e10] transition">
                <Upload size={12} /> Upload Assets
              </button>
            )}
            {role === 'admin' && (
              <button onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#e02e10] transition">
                <Upload size={12} /> Bulk Upload
              </button>
            )}
          </div>

          {/* ── Bulk action bar ── */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl px-4 py-2.5">
              <span className="text-white/60 text-xs font-medium">{selected.size} selected</span>
              <div className="flex-1" />
              <button onClick={() => { showToast(`Preparing ${selected.size} file${selected.size > 1 ? 's' : ''} for download...`); setSelected(new Set()) }} className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white text-xs px-3 py-1.5 rounded-lg transition">
                <Download size={12} /> Download Selected
              </button>
              <button onClick={() => setSelected(new Set())} className="text-white/35 hover:text-white transition"><X size={14} /></button>
            </div>
          )}

          {/* ── Client Uploads view ── */}
          {showClientUploads ? (
            <div className="space-y-2">
              <p className="text-white/40 text-xs mb-3">Your uploaded references and brand assets visible to your team.</p>
              {clientUploads.length === 0 ? (
                <div className="text-center py-16 text-white/25">
                  <Paperclip size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No uploads yet.</p>
                </div>
              ) : (
                clientUploads.map(u => (
                  <div key={u.id} className="flex items-center gap-3 bg-[#111] border border-white/8 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 bg-[#0a0a0a] rounded-lg flex items-center justify-center shrink-0">
                      {u.file_type?.startsWith('video') ? <Video size={16} className="text-white/30" /> : <ImageIcon size={16} className="text-white/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.title}</p>
                      <p className="text-white/35 text-xs">{u.upload_category} · {u.file_name}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_META[u.status]?.color ?? 'bg-white/10 text-white/40'}`}>{u.status}</span>
                    <span className="text-white/25 text-xs shrink-0">{fmtDate(u.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* ── Content count ── */}
              <p className="text-white/25 text-xs">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' && ` · ${STATUS_META[statusFilter]?.label}`}
              </p>

              {/* ── Empty state ── */}
              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-white/25">
                  <SlidersHorizontal size={28} className="mb-3 opacity-40" />
                  <p className="text-sm">No content matches these filters.</p>
                </div>
              )}

              {/* ── Grid view ── */}
              {layout === 'grid' && filteredItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredItems.map(item => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      selected={selected.has(item.id)}
                      commentCount={commentCount(item.id)}
                      onSelect={() => toggleSelect(item.id)}
                      onOpen={() => { setActiveItem(item); setChatOpen(false) }}
                    />
                  ))}
                </div>
              )}

              {/* ── List / table view ── */}
              {layout === 'list' && filteredItems.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8 text-white/25 text-[9px] uppercase tracking-wider">
                        <th className="text-left py-2 px-2 w-5">
                          <input type="checkbox" className="accent-[#FF3B1A]" onChange={e => setSelected(e.target.checked ? new Set(filteredItems.map(i => i.id)) : new Set())} />
                        </th>
                        <th className="text-left py-2 px-2 w-14">Preview</th>
                        {role === 'admin' && <th className="text-left py-2 px-2">Client</th>}
                        <th className="text-left py-2 px-2">Title</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Week</th>
                        <th className="text-left py-2 px-2 w-8">Msg</th>
                        {role === 'admin' && <th className="text-left py-2 px-2 w-8">SC</th>}
                        <th className="text-left py-2 px-2">Updated</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => { setActiveItem(item); setChatOpen(false) }}
                          className={`border-b border-white/5 cursor-pointer transition hover:bg-white/3 ${selected.has(item.id) ? 'bg-[#FF3B1A]/5' : ''}`}
                        >
                          <td className="py-2.5 px-2" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="accent-[#FF3B1A]" />
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="w-12 h-8 bg-[#0a0a0a] rounded overflow-hidden">
                              <MediaPreview url={item.file_url} type={item.media_type} className="w-full h-full" />
                            </div>
                          </td>
                          {role === 'admin' && (
                            <td className="py-2.5 px-2 text-white/50 max-w-[90px]">
                              <span className="truncate block">{item.company_name ?? '—'}</span>
                            </td>
                          )}
                          <td className="py-2.5 px-2 max-w-[160px]">
                            <p className="text-white font-medium truncate">{item.title}</p>
                            {item.content_type && <p className="text-white/30 text-[10px]">{item.content_type}</p>}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="flex items-center gap-1 text-white/45 capitalize">
                              <MediaTypeIcon type={item.media_type} size={11} /> {item.media_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2"><StatusBadge status={item.status} /></td>
                          <td className="py-2.5 px-2 text-white/35">{item.week_label?.split(' - ')[0]}</td>
                          <td className="py-2.5 px-2 text-white/35">
                            {commentCount(item.id) > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={10} />{commentCount(item.id)}</span>}
                          </td>
                          {role === 'admin' && (
                            <td className="py-2.5 px-2">{item.can_showcase && <Star size={11} className="text-yellow-400/50" />}</td>
                          )}
                          <td className="py-2.5 px-2 text-white/25">{fmtRelative(item.uploaded_at)}</td>
                          <td className="py-2.5 px-2"><ChevronRight size={12} className="text-white/20" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
