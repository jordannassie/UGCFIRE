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
  Folder as FolderIcon, FolderOpen, FolderPlus, ArrowLeft,
  StickyNote, Pin, PinOff, Pencil, BookOpen,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FireCreatorProfile {
  displayName: string   // e.g. "UGC Fire Team"
  title: string         // e.g. "Fire Creator"
  bio?: string
  avatarUrl?: string
}

const DEFAULT_FC_PROFILE: FireCreatorProfile = {
  displayName: 'UGC Fire Team',
  title: 'Fire Creator',
  bio: 'Your UGC Fire creator helping produce and deliver your monthly content.',
}

function fcInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

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
  sender_name?: string        // "UGC Fire Team" | client company/display name
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
  initialClientId?: string        // admin: pre-select a specific client on mount
  fireCreatorProfile?: FireCreatorProfile
  demoMode?: boolean
  initialView?: string
  initialPanel?: string
  initialMode?: string
}

interface DemoFolder {
  id: string
  name: string
  description: string
  status: string
}

type NoteStatus = 'open' | 'in_progress' | 'done' | 'archived'

interface StudioNote {
  id: string
  title: string
  body: string
  folderId: string
  status: NoteStatus
  pinned: boolean
  createdBy: string
  createdAt: string
}

const NOTE_STATUS_META: Record<NoteStatus, { label: string; color: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-500/20 text-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500/20 text-orange-300' },
  done:        { label: 'Done',        color: 'bg-green-500/20 text-green-300' },
  archived:    { label: 'Archived',    color: 'bg-gray-500/20 text-gray-400' },
}

const NOTE_STATUSES: NoteStatus[] = ['open', 'in_progress', 'done', 'archived']

const DEMO_NOTES: StudioNote[] = [
  {
    id: 'n1',
    title: 'Use logo for merch designs',
    body: 'In Brand Assets folder: use the logo and create T-shirt designs and hats too. Keep the icon treatment minimal — let the logo breathe.',
    folderId: 'brand-assets',
    status: 'open',
    pinned: true,
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'n2',
    title: 'Content style direction',
    body: 'Keep videos clean, real, and lifestyle-focused. Avoid anything that feels too fake or overproduced. Natural lighting preferred. No AI-looking people.',
    folderId: 'client-uploads',
    status: 'open',
    pinned: true,
    createdBy: 'Client',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'n3',
    title: 'Next delivery priority',
    body: 'For the next batch, prioritize product demo videos, founder-style hooks, and social ad photo creatives. Use photoshoot images from Client Uploads folder.',
    folderId: 'week2-delivery',
    status: 'in_progress',
    pinned: false,
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'n4',
    title: 'Brand colors',
    body: 'Always use orange and black brand colors. Avoid heavy filters or pastel overlays — the brand is bold and direct.',
    folderId: '',
    status: 'open',
    pinned: false,
    createdBy: 'Client',
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
]

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
  const [uploadStatus, setUploadStatus] = useState<Status>('ready_for_review')
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
            <div>
              <label className="text-white/40 text-xs mb-1 block">Initial Status</label>
              <select value={uploadStatus} onChange={e => setUploadStatus(e.target.value as Status)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
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
  comments, role, fcProfile, onSend, onClose,
}: {
  comments: ContentComment[]
  role: Role
  fcProfile: FireCreatorProfile
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
        {comments.map(c => {
          const isFC = c.sender_role === 'admin'
          const isMine = c.sender_role === role
          const label = isFC
            ? (c.sender_name ?? fcProfile.displayName)
            : (c.sender_name ?? 'Client')
          const initials = isFC
            ? (c.sender_name ? fcInitials(c.sender_name) : fcInitials(fcProfile.displayName))
            : (c.sender_name ? c.sender_name.slice(0, 2).toUpperCase() : 'CL')
          return (
            <div key={c.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
              {isFC && fcProfile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fcProfile.avatarUrl} alt={label} className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isFC ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
                  {initials}
                </div>
              )}
              <div className={`max-w-[75%] space-y-0.5 ${isMine ? 'items-end flex flex-col' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-white/60">{label}</span>
                  {isFC && <span className="text-[8px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-1.5 py-0.5 rounded-full font-bold">{fcProfile.title}</span>}
                  {c.is_internal && <span className="text-[8px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full">internal</span>}
                </div>
                <div className={`px-3 py-2 rounded-xl text-xs ${
                  c.is_internal ? 'bg-yellow-500/8 border border-yellow-500/20 text-yellow-200' :
                  isMine ? 'bg-[#FF3B1A]/15 border border-[#FF3B1A]/20 text-white' :
                  'bg-white/5 border border-white/8 text-white/80'
                }`}>
                  <p>{c.message}</p>
                  <p className="text-[9px] mt-1 opacity-40">{fmtRelative(c.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })}
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

type DrawerTab = 'details' | 'comments' | 'notes' | 'versions'

function DetailDrawer({
  item, role, fcProfile, comments, onClose, onStatusChange, onToast,
}: {
  item: ContentItem
  role: Role
  fcProfile: FireCreatorProfile
  comments: ContentComment[]
  onClose: () => void
  onStatusChange: (id: string, status: Status) => void
  onToast: (msg: string) => void
}) {
  const [tab, setTab]                     = useState<DrawerTab>('details')
  const [localComments, setLocalComments] = useState<ContentComment[]>(comments)
  const [msg, setMsg]                     = useState('')
  const [internal, setInternal]           = useState(false)
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [revisionNote, setRevisionNote]   = useState('')
  const [status, setStatus]               = useState<Status>(item.status)
  const [noteText, setNoteText]           = useState('')
  const [notes, setNotes]                 = useState<{ id: string; text: string; created_at: string }[]>([])
  const bottomRef                         = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalComments(comments) }, [comments])
  useEffect(() => { setStatus(item.status); setTab('details') }, [item.id, item.status])
  useEffect(() => { if (tab === 'comments') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [localComments, tab])

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: 'details',  label: 'Details' },
    { id: 'comments', label: `Comments${localComments.filter(c => !c.is_internal).length > 0 ? ` (${localComments.filter(c => !c.is_internal).length})` : ''}` },
    ...(role === 'admin' ? [
      { id: 'notes' as DrawerTab,    label: 'Notes' },
      { id: 'versions' as DrawerTab, label: 'Versions' },
    ] : []),
  ]

  function addComment(message: string, isInternal: boolean) {
    if (!message.trim()) return
    setLocalComments(p => [...p, {
      id: `c-${Date.now()}`,
      content_item_id: item.id,
      sender_role: role,
      sender_name: role === 'admin' ? fcProfile.displayName : undefined,
      message: message.trim(),
      is_internal: isInternal,
      created_at: new Date().toISOString(),
    }])
  }

  function submitComment() { addComment(msg, internal); setMsg('') }

  function approve() {
    onStatusChange(item.id, 'approved')
    setStatus('approved')
    onToast('Content approved.')
  }

  function submitRevision() {
    if (!revisionNote.trim()) return
    addComment(revisionNote, false)
    onStatusChange(item.id, 'revision_requested')
    setStatus('revision_requested')
    setRevisionNote('')
    setShowRevisionInput(false)
    onToast('Revision request submitted.')
  }

  function addNote() {
    if (!noteText.trim()) return
    setNotes(p => [...p, { id: `n-${Date.now()}`, text: noteText.trim(), created_at: new Date().toISOString() }])
    setNoteText('')
    onToast('Internal note saved.')
  }

  const isVideo = item.media_type === 'video'
  const hasFile = !!item.file_url
  const publicComments = localComments.filter(c => !c.is_internal)
  const internalComments = localComments.filter(c => c.is_internal)

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d0d] border-l border-white/8 flex flex-col z-40 shadow-2xl">

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-white/8">
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
        <button onClick={onClose} className="text-white/40 hover:text-white transition p-1 shrink-0 mt-0.5"><X size={17} /></button>
      </div>

      {/* ── Media preview (always visible, above tabs) ── */}
      <div
        className="bg-[#080808] flex items-center justify-center shrink-0 w-full"
        style={{ height: 'min(42vh, 240px)' }}
      >
        {hasFile ? (
          isVideo
            ? <video src={item.file_url!} className="w-full h-full object-contain" controls />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={item.file_url!} alt={item.title} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/20">
            <MediaTypeIcon type={item.media_type} size={36} />
            <span className="text-xs">In production</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/8 border-t border-t-white/8 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition border-b-2 ${
              tab === t.id
                ? 'text-white border-[#FF3B1A]'
                : 'text-white/35 border-transparent hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Details tab ── */}
        {tab === 'details' && (
          <>
            {/* Metadata grid */}
            <div className="px-5 py-3 border-b border-white/8 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              {([
                ['Content Type', item.content_type],
                ['Week',         item.week_label?.split(' - ')[0]],
                ['Uploaded',     item.uploaded_at ? fmtDate(item.uploaded_at) : null],
                ['Approved',     item.approved_at ? fmtDate(item.approved_at) : null],
                ['Delivered',    item.delivered_at ? fmtDate(item.delivered_at) : null],
                ['Showcase',     item.can_showcase ? 'Yes' : 'No'],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <p className="text-white/30 text-[10px]">{label}</p>
                  <p className="text-white/80">{value}</p>
                </div>
              ))}
            </div>

            {/* Admin: status controls */}
            {role === 'admin' && (
              <div className="px-5 py-3 border-b border-white/8 space-y-3">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Change Status</p>
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
                <div className="flex flex-wrap gap-1.5">
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

            {/* Client: approve / revision / download */}
            {role === 'client' && (
              <div className="px-5 py-3 space-y-2">
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
          </>
        )}

        {/* ── Comments tab ── */}
        {tab === 'comments' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {publicComments.length === 0 && (
                <p className="text-white/20 text-xs pt-4 text-center">No comments yet.</p>
              )}
              {publicComments.map(c => {
                const isFC = c.sender_role === 'admin'
                const isMine = c.sender_role === role
                const label = isFC
                  ? (c.sender_name ?? fcProfile.displayName)
                  : (c.sender_name ?? 'Client')
                const initials = isFC
                  ? (c.sender_name ? fcInitials(c.sender_name) : fcInitials(fcProfile.displayName))
                  : (c.sender_name ? c.sender_name.slice(0, 2).toUpperCase() : 'CL')
                return (
                  <div key={c.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                    {isFC && fcProfile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fcProfile.avatarUrl} alt={label} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isFC ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
                        {initials}
                      </div>
                    )}
                    <div className={`max-w-[78%] space-y-0.5 ${isMine ? 'items-end flex flex-col' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold text-white/55">{label}</span>
                        {isFC && <span className="text-[7px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-1 py-0.5 rounded-full font-bold">{fcProfile.title}</span>}
                      </div>
                      <div className={`px-3 py-2 rounded-xl text-xs ${
                        isMine
                          ? 'bg-[#FF3B1A]/10 border border-[#FF3B1A]/15 text-white/90'
                          : 'bg-white/5 border border-white/8 text-white/80'
                      }`}>
                        <p>{c.message}</p>
                        <p className="text-[9px] mt-1 opacity-40">{fmtRelative(c.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-white/8 flex gap-2 shrink-0">
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
        )}

        {/* ── Notes tab (admin only) ── */}
        {tab === 'notes' && role === 'admin' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-yellow-500/50 text-[10px] font-medium">Internal notes are never visible to the client.</p>
              {internalComments.length === 0 && notes.length === 0 && (
                <p className="text-white/20 text-xs pt-2 text-center">No internal notes yet.</p>
              )}
              {internalComments.map(c => (
                <div key={c.id} className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-yellow-200 text-xs">{c.message}</p>
                  <p className="text-yellow-500/40 text-[9px] mt-1">{fmtRelative(c.created_at)}</p>
                </div>
              ))}
              {notes.map(n => (
                <div key={n.id} className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-yellow-200 text-xs">{n.text}</p>
                  <p className="text-yellow-500/40 text-[9px] mt-1">{fmtRelative(n.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/8 space-y-2 shrink-0">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add an internal note..."
                className="w-full bg-white/5 border border-yellow-500/20 rounded-lg px-3 py-2 text-yellow-100 text-xs placeholder:text-yellow-500/30 focus:outline-none focus:border-yellow-500/40 resize-none h-20"
              />
              <button onClick={addNote} disabled={!noteText.trim()} className="w-full bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-40">
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* ── Versions tab (admin only) ── */}
        {tab === 'versions' && role === 'admin' && (
          <div className="p-5 space-y-4">
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Version History</p>
            {/* Current version */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-semibold">Version 1 (current)</span>
                <span className="text-[10px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-1.5 py-0.5 rounded-full">Current</span>
              </div>
              <p className="text-white/40 text-[11px]">Uploaded {item.uploaded_at ? fmtDate(item.uploaded_at) : '—'}</p>
              {hasFile && (
                <button onClick={() => onToast('Preparing download...')} className="flex items-center gap-1 text-white/50 hover:text-white text-[11px] transition">
                  <Download size={11} /> Download this version
                </button>
              )}
            </div>

            {/* Upload new version */}
            <div className="border border-dashed border-white/10 rounded-xl p-4 text-center space-y-2">
              <Upload size={18} className="text-white/20 mx-auto" />
              <p className="text-white/35 text-xs">Upload a new version</p>
              <button onClick={() => onToast('Version upload coming soon.')} className="text-[#FF3B1A] text-xs hover:underline">
                Select file
              </button>
            </div>
          </div>
        )}

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

// ─── Folder data ─────────────────────────────────────────────────────────────

const DEMO_FOLDERS: DemoFolder[] = [
  { id: 'brand-assets',    name: 'Brand Assets',     description: 'Logos, fonts, colors, product references',                     status: 'approved' },
  { id: 'client-uploads',  name: 'Client Uploads',   description: 'Photoshoots, raw product images, founder clips, testimonials', status: 'ready_for_review' },
  { id: 'week1-delivery',  name: 'Week 1 Delivery',  description: 'Finished UGC videos and social assets',                        status: 'delivered' },
  { id: 'week2-delivery',  name: 'Week 2 Delivery',  description: 'Content currently in production or review',                    status: 'in_production' },
  { id: 'approved',        name: 'Approved Content', description: 'Final approved assets ready to download',                      status: 'approved' },
  { id: 'revisions',       name: 'Revisions',        description: 'Assets needing edits or feedback',                             status: 'revision_requested' },
]

function itemFolderId(item: ContentItem): string {
  if (item.status === 'revision_requested') return 'revisions'
  if (item.status === 'approved' || item.status === 'delivered') return 'approved'
  if (item.media_type === 'graphic') return 'brand-assets'
  if (item.week_label?.toLowerCase().includes('week 1')) return 'week1-delivery'
  return 'week2-delivery'
}

// ─── Folder card ──────────────────────────────────────────────────────────────

function FolderCard({
  folder, items, totalComments, onClick,
}: {
  folder: DemoFolder
  items: ContentItem[]
  totalComments: number
  onClick: () => void
}) {
  const previews = items.filter(i => i.file_url).slice(0, 3)

  return (
    <div
      onClick={onClick}
      className="group bg-[#111] border border-white/8 rounded-xl overflow-hidden cursor-pointer hover:border-white/18 transition-all duration-150"
    >
      {/* Thumbnail strip */}
      <div className="h-28 bg-[#0a0a0a] flex overflow-hidden">
        {previews.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <FolderOpen size={32} className="text-white/10" />
          </div>
        ) : previews.length === 1 ? (
          <MediaPreview url={previews[0].file_url} type={previews[0].media_type} className="w-full h-full" />
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <MediaPreview url={previews[0].file_url} type={previews[0].media_type} className="w-full h-full" />
            </div>
            <div className="w-px bg-black shrink-0" />
            <div className="flex-1 flex flex-col overflow-hidden">
              {previews.slice(1).map((p, i) => (
                <div key={i} className={`flex-1 overflow-hidden ${i > 0 ? 'border-t border-black' : ''}`}>
                  <MediaPreview url={p.file_url} type={p.media_type} className="w-full h-full" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen size={14} className="text-[#FF3B1A]/70 shrink-0" />
          <p className="text-white text-sm font-semibold truncate">{folder.name}</p>
        </div>
        <p className="text-white/35 text-[11px] leading-snug mb-2.5 line-clamp-2">{folder.description}</p>
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <StatusBadge status={folder.status} />
          <div className="flex items-center gap-2.5 text-white/25 text-[10px]">
            {items.length > 0 && <span>{items.length} file{items.length !== 1 ? 's' : ''}</span>}
            {totalComments > 0 && (
              <span className="flex items-center gap-0.5"><MessageSquare size={9} />{totalComments}</span>
            )}
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
    <div className="w-52 shrink-0 border-r border-white/8 pr-4 space-y-0.5 overflow-y-auto">
      <p className="text-white/25 text-[9px] font-semibold uppercase tracking-widest px-2 mb-3">Client Studios</p>
      <button
        onClick={() => onSelect('all')}
        className={`w-full text-left px-2.5 py-2.5 rounded-lg transition ${selected === 'all' ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20' : 'text-white/45 hover:text-white hover:bg-white/5'}`}
      >
        <p className="text-[12px] font-semibold">All Client Studios</p>
        <p className="text-white/30 text-[10px] mt-0.5">{allContent.length} items total</p>
      </button>
      {companies.map(co => {
        const s = stats(co.id)
        const isSelected = selected === co.id
        return (
          <button
            key={co.id}
            onClick={() => onSelect(co.id)}
            className={`w-full text-left px-2.5 py-2.5 rounded-lg transition ${isSelected ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20' : 'text-white/45 hover:text-white hover:bg-white/5'}`}
          >
            <p className="text-[12px] font-semibold truncate">{co.name} Studio</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-white/25 text-[10px]">{s.total} items</span>
              {s.review > 0 && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">{s.review} review</span>}
              {s.revisions > 0 && <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full">{s.revisions} rev</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main StudioWorkspace ─────────────────────────────────────────────────────

export default function StudioWorkspace({
  role, companyId: initialCompanyId, initialClientId,
  fireCreatorProfile: fcProfileProp,
  demoMode, initialView, initialPanel, initialMode,
}: StudioWorkspaceProps) {
  const fcProfile: FireCreatorProfile = fcProfileProp ?? DEFAULT_FC_PROFILE
  const demo = demoMode ?? checkDemoMode()

  // Data
  const [items, setItems]               = useState<ContentItem[]>([])
  const [clientUploads, setClientUploads] = useState<ClientUpload[]>([])
  const [comments, setComments]         = useState<ContentComment[]>([])
  const [companies, setCompanies]       = useState<Company[]>([])
  const [companyId, setCompanyId]       = useState<string | null>(initialCompanyId ?? null)

  // Filters
  const [selectedCompany, setSelectedCompany] = useState<string>(initialClientId ?? 'all')  // admin only
  const [statusFilter, setStatusFilter] = useState<string>(VIEW_TO_STATUS[initialView ?? ''] ?? 'all')
  const [mediaFilter, setMediaFilter]   = useState<string>('all')
  const [weekFilter, setWeekFilter]     = useState<string>('all')
  const [search, setSearch]             = useState('')
  const [showClientUploads, setShowClientUploads] = useState(initialView === 'client_uploads')

  // UI
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [activeItem, setActiveItem]     = useState<ContentItem | null>(null)
  const [layout, setLayout]             = useState<'grid' | 'list'>('grid')
  const [chatOpen, setChatOpen]         = useState(initialPanel === 'chat' || initialPanel === 'messages')
  const [clientUploadOpen, setClientUploadOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(initialMode === 'bulk_upload')
  const [toast, setToast]               = useState('')
  const [studioView, setStudioView]     = useState<'folders' | 'files' | 'notes'>('folders')
  const [activeFolder, setActiveFolder] = useState<DemoFolder | null>(null)
  const [notes, setNotes]               = useState<StudioNote[]>(DEMO_NOTES)
  const [addingNote, setAddingNote]     = useState(false)
  const [noteForm, setNoteForm]         = useState<{ title: string; body: string; folderId: string; status: NoteStatus; pinned: boolean }>({
    title: '', body: '', folderId: '', status: 'open', pinned: false,
  })

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
    const senderName = role === 'admin' ? fcProfile.displayName : undefined
    const newC: ContentComment = {
      id: `c-${Date.now()}`,
      content_item_id: contentItemId,
      sender_role: role,
      sender_name: senderName,
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
        sender_name: senderName,
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
          fcProfile={fcProfile}
          onSend={(msg, internal) => sendComment(msg, internal, null)}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Detail drawer */}
      {activeItem && (
        <DetailDrawer
          item={activeItem}
          role={role}
          fcProfile={fcProfile}
          comments={itemComments(activeItem.id)}
          onClose={() => setActiveItem(null)}
          onStatusChange={updateStatus}
          onToast={showToast}
        />
      )}

      {/* ── Main layout ── */}
      <div className={`transition-all duration-200 ${mainPadding}`}>

        {/* Admin top control row */}
        {role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-white/8 mb-4">
            {/* Client selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/40 text-xs shrink-0">Viewing Client Studio</span>
              <select
                value={selectedCompany}
                onChange={e => { setSelectedCompany(e.target.value); setSelected(new Set()) }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A] min-w-[180px]"
              >
                <option value="all">All Client Studios</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedCompany !== 'all' && (
                <span className="text-[#FF3B1A] text-[11px] font-semibold bg-[#FF3B1A]/10 px-2.5 py-1 rounded-full border border-[#FF3B1A]/20 whitespace-nowrap">
                  Viewing: {companies.find(c => c.id === selectedCompany)?.name} Studio
                </span>
              )}
            </div>

            <div className="flex-1" />

            {/* Admin quick actions */}
            <button onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition">
              <Plus size={11} /> New Batch
            </button>
            <button onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition">
              <Upload size={11} /> Bulk Upload
            </button>
            {selected.size > 0 && (
              <>
                <button
                  onClick={() => { showToast(`Sent ${selected.size} item${selected.size > 1 ? 's' : ''} to client.`); setSelected(new Set()) }}
                  className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs px-2.5 py-1.5 rounded-lg transition"
                >
                  <Send size={11} /> Send Selected
                </button>
                <button
                  onClick={() => { showToast(`${selected.size} item${selected.size > 1 ? 's' : ''} marked delivered.`); setSelected(new Set()) }}
                  className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition"
                >
                  <CheckCheck size={11} /> Mark Delivered
                </button>
              </>
            )}
          </div>
        )}

        {/* Center content */}
        <div className="min-w-0 space-y-4">

          {/* ── Studio tabs: Folders / All Files / Notes ── */}
          <div className="flex items-center gap-0 border-b border-white/8">
            <button
              onClick={() => { setStudioView('folders'); setActiveFolder(null); setActiveItem(null) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${studioView === 'folders' ? 'text-white border-[#FF3B1A]' : 'text-white/40 border-transparent hover:text-white/70'}`}
            >
              <FolderIcon size={13} /> Folders
            </button>
            <button
              onClick={() => { setStudioView('files'); setActiveFolder(null) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${studioView === 'files' ? 'text-white border-[#FF3B1A]' : 'text-white/40 border-transparent hover:text-white/70'}`}
            >
              <LayoutGrid size={13} /> All Files
            </button>
            <button
              onClick={() => { setStudioView('notes'); setActiveFolder(null); setActiveItem(null) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${studioView === 'notes' ? 'text-white border-[#FF3B1A]' : 'text-white/40 border-transparent hover:text-white/70'}`}
            >
              <StickyNote size={13} /> Notes
              {notes.filter(n => n.status !== 'archived').length > 0 && (
                <span className="bg-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded-full">{notes.filter(n => n.status !== 'archived').length}</span>
              )}
            </button>
          </div>

          {/* ── Folders overview ── */}
          {studioView === 'folders' && !activeFolder && (() => {
            const currentItems = filteredItems
            const folderItems = (fid: string) =>
              fid === 'client-uploads'
                ? []
                : currentItems.filter(i => itemFolderId(i) === fid)
            const folderComments = (fid: string) =>
              currentItems.filter(i => itemFolderId(i) === fid).reduce((n, i) => n + itemComments(i.id).length, 0)

            return (
              <div className="space-y-4">
                {/* Top actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {role === 'admin' && (
                    <button onClick={() => showToast('Folder created.')} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg transition">
                      <FolderPlus size={13} /> New Folder
                    </button>
                  )}
                  <button
                    onClick={() => role === 'client' ? setClientUploadOpen(true) : setBulkUploadOpen(true)}
                    className="flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#e02e10] transition"
                  >
                    <Upload size={12} /> Upload Assets
                  </button>
                  {selected.size > 0 && (
                    <button onClick={() => { showToast(`Preparing ${selected.size} files for download...`); setSelected(new Set()) }} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white text-xs px-3 py-2 rounded-lg transition">
                      <Download size={12} /> Download Selected
                    </button>
                  )}
                </div>

                {/* Folder grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DEMO_FOLDERS.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      items={folderItems(folder.id)}
                      totalComments={folderComments(folder.id)}
                      onClick={() => { setActiveFolder(folder); setActiveItem(null) }}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── Inside a folder ── */}
          {studioView === 'folders' && activeFolder && (() => {
            const folderContents = activeFolder.id === 'client-uploads'
              ? []
              : filteredItems.filter(i => itemFolderId(i) === activeFolder.id)

            return (
              <div className="space-y-4">
                {/* Folder header */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setActiveFolder(null); setActiveItem(null); setSelected(new Set()) }}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition"
                  >
                    <ArrowLeft size={15} /> Folders
                  </button>
                  <span className="text-white/20">/</span>
                  <span className="text-white font-semibold text-sm">{activeFolder.name}</span>
                  <StatusBadge status={activeFolder.status} />
                  <div className="flex-1" />
                  <button onClick={() => role === 'client' ? setClientUploadOpen(true) : setBulkUploadOpen(true)}
                    className="flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#e02e10] transition">
                    <Upload size={12} /> Upload Assets
                  </button>
                  <button onClick={() => showToast('Preparing folder download...')}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/60 text-xs px-3 py-2 rounded-lg transition">
                    <Download size={12} /> Download Folder
                  </button>
                </div>

                <p className="text-white/35 text-xs">{activeFolder.description}</p>

                {/* Folder toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] w-36" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                  <select value={mediaFilter} onChange={e => setMediaFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
                    <option value="all">All Media</option>
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="graphic">Graphic</option>
                    <option value="carousel">Carousel</option>
                  </select>
                  <div className="flex-1" />
                  {selected.size > 0 && (
                    <>
                      <span className="text-white/40 text-xs">{selected.size} selected</span>
                      <button onClick={() => { showToast(`Preparing ${selected.size} files for download...`); setSelected(new Set()) }}
                        className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white text-xs px-2.5 py-1.5 rounded-lg transition">
                        <Download size={11} /> Download Selected
                      </button>
                      {role === 'client' && (
                        <button onClick={() => { folderContents.filter(i => selected.has(i.id)).forEach(i => updateStatus(i.id, 'approved')); showToast('Approved selected.'); setSelected(new Set()) }}
                          className="flex items-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 text-xs px-2.5 py-1.5 rounded-lg transition">
                          <CheckCircle2 size={11} /> Approve Selected
                        </button>
                      )}
                      {role === 'admin' && (
                        <>
                          <button onClick={() => { folderContents.filter(i => selected.has(i.id)).forEach(i => updateStatus(i.id, 'delivered')); showToast('Marked delivered.'); setSelected(new Set()) }}
                            className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition">
                            <CheckCheck size={11} /> Mark Delivered
                          </button>
                          <button onClick={() => { showToast('Moving files...'); setSelected(new Set()) }}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/60 text-xs px-2.5 py-1.5 rounded-lg transition">
                            <FolderIcon size={11} /> Move to Folder
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelected(new Set())} className="text-white/30 hover:text-white"><X size={13} /></button>
                    </>
                  )}
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button onClick={() => setLayout('grid')} className={`p-1.5 rounded transition ${layout === 'grid' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}><LayoutGrid size={13} /></button>
                    <button onClick={() => setLayout('list')} className={`p-1.5 rounded transition ${layout === 'list' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}><List size={13} /></button>
                  </div>
                </div>

                {/* File count */}
                <p className="text-white/25 text-xs">{folderContents.length} file{folderContents.length !== 1 ? 's' : ''} in {activeFolder.name}</p>

                {/* Empty state */}
                {folderContents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-white/25">
                    <FolderOpen size={32} className="mb-3 opacity-30" />
                    <p className="text-sm">No content in this folder yet.</p>
                    {role === 'admin' && (
                      <button onClick={() => setBulkUploadOpen(true)} className="mt-4 flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition">
                        <Upload size={12} /> Upload Assets
                      </button>
                    )}
                  </div>
                )}

                {/* File grid */}
                {layout === 'grid' && folderContents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {folderContents.map(item => (
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

                {/* File list */}
                {layout === 'list' && folderContents.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/8 text-white/25 text-[9px] uppercase tracking-wider">
                          <th className="text-left py-2 px-2 w-5"><input type="checkbox" className="accent-[#FF3B1A]" onChange={e => setSelected(e.target.checked ? new Set(folderContents.map(i => i.id)) : new Set())} /></th>
                          <th className="text-left py-2 px-2 w-14">Preview</th>
                          <th className="text-left py-2 px-2">Title</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Week</th>
                          <th className="text-left py-2 px-2 w-8">Msg</th>
                          <th className="w-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {folderContents.map(item => (
                          <tr key={item.id} onClick={() => { setActiveItem(item); setChatOpen(false) }}
                            className={`border-b border-white/5 cursor-pointer hover:bg-white/3 transition ${selected.has(item.id) ? 'bg-[#FF3B1A]/5' : ''}`}>
                            <td className="py-2.5 px-2" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="accent-[#FF3B1A]" />
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="w-12 h-8 bg-[#0a0a0a] rounded overflow-hidden"><MediaPreview url={item.file_url} type={item.media_type} className="w-full h-full" /></div>
                            </td>
                            <td className="py-2.5 px-2 max-w-[160px]"><p className="text-white font-medium truncate">{item.title}</p></td>
                            <td className="py-2.5 px-2"><span className="flex items-center gap-1 text-white/45 capitalize"><MediaTypeIcon type={item.media_type} size={11} /> {item.media_type}</span></td>
                            <td className="py-2.5 px-2"><StatusBadge status={item.status} /></td>
                            <td className="py-2.5 px-2 text-white/35">{item.week_label?.split(' - ')[0]}</td>
                            <td className="py-2.5 px-2 text-white/35">{commentCount(item.id) > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={10} />{commentCount(item.id)}</span>}</td>
                            <td className="py-2.5 px-2"><ChevronRight size={12} className="text-white/20" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── All Files view (existing grid) ── */}
          {studioView === 'files' && (
          <div className="space-y-4">
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

            {/* Assets / client uploads tab */}
            <button
              onClick={() => setShowClientUploads(p => !p)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg transition ${showClientUploads ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-white/5 text-white/50 hover:text-white'}`}
            >
              <Paperclip size={12} /> Assets
            </button>

            {/* Upload button — client only in toolbar; admin uses top control row */}
            {role === 'client' && (
              <button onClick={() => setClientUploadOpen(true)} className="flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#e02e10] transition">
                <Upload size={12} /> Upload Assets
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
                  {role === 'admin' && selectedCompany !== 'all' ? (
                    <>
                      <p className="text-sm">No content yet for this client.</p>
                      <p className="text-xs mt-1 text-white/15">Upload assets or create a new batch to get started.</p>
                      <button onClick={() => setBulkUploadOpen(true)} className="mt-4 flex items-center gap-1.5 bg-[#FF3B1A] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition">
                        <Upload size={12} /> Upload Batch
                      </button>
                    </>
                  ) : (
                    <p className="text-sm">No content matches these filters.</p>
                  )}
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
          )}

          {/* ── Notes view ── */}
          {studioView === 'notes' && (() => {
            const visibleNotes = notes.filter(n => n.status !== 'archived' || role === 'admin')
            const pinned   = visibleNotes.filter(n => n.pinned)
            const unpinned = visibleNotes.filter(n => !n.pinned)
            const ordered  = [...pinned, ...unpinned]

            function saveNote() {
              if (!noteForm.title.trim() && !noteForm.body.trim()) return
              setNotes(p => [{
                id: `n-${Date.now()}`,
                title: noteForm.title.trim() || 'Untitled note',
                body: noteForm.body.trim(),
                folderId: noteForm.folderId,
                status: noteForm.status,
                pinned: noteForm.pinned,
                createdBy: role === 'admin' ? 'Admin' : 'Client',
                createdAt: new Date().toISOString(),
              }, ...p])
              setNoteForm({ title: '', body: '', folderId: '', status: 'open', pinned: false })
              setAddingNote(false)
            }

            function cycleStatus(id: string) {
              setNotes(p => p.map(n => {
                if (n.id !== id) return n
                const cycle: NoteStatus[] = ['open', 'in_progress', 'done']
                const next = cycle[(cycle.indexOf(n.status) + 1) % cycle.length]
                return { ...n, status: next }
              }))
            }

            function togglePin(id: string) {
              setNotes(p => p.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
            }

            function archiveNote(id: string) {
              setNotes(p => p.map(n => n.id === id ? { ...n, status: 'archived' } : n))
            }

            return (
              <div className="space-y-5 max-w-2xl">
                {/* Header */}
                <div>
                  <h2 className="text-white font-bold text-lg">Studio Notes</h2>
                  <p className="text-white/40 text-sm mt-0.5">Shared instructions, ideas, and creative direction for this client studio.</p>
                </div>

                {/* Callout */}
                <div className="flex items-start gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <BookOpen size={14} className="text-white/35 mt-0.5 shrink-0" />
                  <p className="text-white/50 text-xs leading-relaxed">
                    Use <span className="text-white/75 font-medium">Notes</span> for general studio instructions and creative direction.{' '}
                    Use <span className="text-white/75 font-medium">Comments</span> (inside a file) for feedback on a specific asset.
                  </p>
                </div>

                {/* Add note button */}
                {!addingNote && (
                  <button
                    onClick={() => setAddingNote(true)}
                    className="flex items-center gap-2 bg-[#FF3B1A] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#e02e10] transition"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                )}

                {/* Add note form */}
                {addingNote && (
                  <div className="bg-[#111] border border-[#FF3B1A]/30 rounded-xl p-4 space-y-3">
                    <p className="text-white font-semibold text-sm">New Note</p>
                    <input
                      value={noteForm.title}
                      onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Note title..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A]"
                    />
                    <textarea
                      value={noteForm.body}
                      onChange={e => setNoteForm(p => ({ ...p, body: e.target.value }))}
                      placeholder="Write your note here..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/35 text-[10px] mb-1 block">Linked Folder</label>
                        <select value={noteForm.folderId} onChange={e => setNoteForm(p => ({ ...p, folderId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
                          <option value="">No folder</option>
                          {DEMO_FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-white/35 text-[10px] mb-1 block">Status</label>
                        <select value={noteForm.status} onChange={e => setNoteForm(p => ({ ...p, status: e.target.value as NoteStatus }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF3B1A]">
                          {NOTE_STATUSES.map(s => <option key={s} value={s}>{NOTE_STATUS_META[s].label}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={() => setNoteForm(p => ({ ...p, pinned: !p.pinned }))} className={`w-9 h-5 rounded-full relative transition ${noteForm.pinned ? 'bg-[#FF3B1A]' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${noteForm.pinned ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <span className="text-white/45 text-xs">Pin this note</span>
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveNote} className="flex-1 bg-[#FF3B1A] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#e02e10] transition">Save Note</button>
                      <button onClick={() => setAddingNote(false)} className="px-4 text-white/40 hover:text-white text-sm transition">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Notes list */}
                {ordered.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <StickyNote size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notes yet.</p>
                    <p className="text-xs mt-1 text-white/15">Add your first studio note above.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {ordered.map(note => {
                    const sm = NOTE_STATUS_META[note.status]
                    const linkedFolder = DEMO_FOLDERS.find(f => f.id === note.folderId)
                    return (
                      <div
                        key={note.id}
                        className={`bg-[#111] border rounded-xl p-4 space-y-2.5 transition ${
                          note.pinned ? 'border-[#FF3B1A]/25 ring-1 ring-[#FF3B1A]/10' : 'border-white/8'
                        }`}
                      >
                        {/* Note header */}
                        <div className="flex items-start gap-2">
                          {note.pinned && <Pin size={12} className="text-[#FF3B1A] mt-1 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm leading-snug">{note.title}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => togglePin(note.id)}
                              title={note.pinned ? 'Unpin' : 'Pin'}
                              className="text-white/25 hover:text-[#FF3B1A] transition p-1"
                            >
                              {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                            </button>
                            <button
                              onClick={() => cycleStatus(note.id)}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition hover:opacity-80 ${sm.color}`}
                            >
                              {sm.label}
                            </button>
                            {role === 'admin' && note.status !== 'archived' && (
                              <button onClick={() => archiveNote(note.id)} className="text-white/20 hover:text-white/50 transition p-1" title="Archive">
                                <Archive size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Note body */}
                        <p className="text-white/65 text-sm leading-relaxed">{note.body}</p>

                        {/* Note footer */}
                        <div className="flex items-center gap-3 text-white/25 text-[10px] flex-wrap pt-0.5">
                          <span>{note.createdBy}</span>
                          <span>·</span>
                          <span>{fmtRelative(note.createdAt)}</span>
                          {linkedFolder && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => { setStudioView('folders'); setActiveFolder(linkedFolder) }}
                                className="flex items-center gap-1 hover:text-[#FF3B1A] transition"
                              >
                                <FolderOpen size={9} /> {linkedFolder.name}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}
