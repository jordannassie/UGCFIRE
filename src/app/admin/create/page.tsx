'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
import { createBrowserClient } from '@supabase/ssr'
import {
  Sparkles, Upload, X, Download, RefreshCw,
  Loader2, AlertCircle, Archive, CheckCircle2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefImage {
  file: File
  preview: string
  b64: string
  storagePath?: string
}

interface Job {
  id: string
  asset_number: number
  asset_label: string
  size: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  image_url?: string
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compressImage(file: File, maxPx = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

function parseCount(prompt: string): number {
  const patterns = [
    /\b(\d+)\s+(?:image|photo|poster|version|asset|variation|design|concept|visual|render|shot|frame|card)s?\b/i,
    /\b(?:generate|create|make|produce|give\s+me|show\s+me)\s+(\d+)\b/i,
  ]
  for (const re of patterns) {
    const m = prompt.match(re)
    if (m) { const n = parseInt(m[1], 10); if (n >= 1 && n <= 50) return n }
  }
  return 9
}

function gridCols(count: number) {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4)  return 'grid-cols-2'
  if (count <= 9)  return 'grid-cols-3'
  return 'grid-cols-4'
}

function statusColor(status: Job['status']) {
  if (status === 'complete')   return 'text-green-400'
  if (status === 'error')      return 'text-red-400'
  if (status === 'processing') return 'text-[#FF3B1A]'
  return 'text-white/20'
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function JobCard({
  job, onDownload, onRetry, disabled,
}: {
  job: Job
  onDownload: (job: Job) => void
  onRetry: (job: Job) => void
  disabled: boolean
}) {
  return (
    <div className="group relative bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
      <div className="aspect-square relative bg-[#111]">

        {(job.status === 'pending' || job.status === 'processing') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="text-[#FF3B1A] animate-spin" />
            <span className="text-white/25 text-[10px] capitalize">{job.status}…</span>
          </div>
        )}

        {job.status === 'complete' && job.image_url && (
          <>
            <img
              src={job.image_url}
              alt={job.asset_label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onDownload(job)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
                title="Download"
              >
                <Download size={14} />
              </button>
              {!disabled && (
                <button
                  onClick={() => onRetry(job)}
                  className="bg-white/10 hover:bg-[#FF3B1A]/30 text-white p-2 rounded-lg transition"
                  title="Regenerate"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </>
        )}

        {job.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-red-400/60 text-[10px] text-center leading-tight line-clamp-3">
              {job.error ?? 'Generation failed'}
            </p>
            {!disabled && (
              <button
                onClick={() => onRetry(job)}
                className="text-[10px] text-[#FF3B1A] hover:underline flex items-center gap-1 mt-1"
              >
                <RefreshCw size={10} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[10px] ${statusColor(job.status)}`}>
            {job.status === 'complete' ? <CheckCircle2 size={10} className="inline" /> :
             job.status === 'error'    ? <AlertCircle size={10} className="inline text-red-400" /> :
             <Loader2 size={10} className="inline animate-spin" />}
          </span>
          <span className="text-white/30 text-[11px] tabular-nums truncate">
            #{job.asset_number}
          </span>
        </div>
        {job.status === 'complete' && job.image_url && (
          <button
            onClick={() => onDownload(job)}
            className="text-[10px] text-white/30 hover:text-white flex items-center gap-1 transition flex-shrink-0"
          >
            <Download size={10} /> PNG
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [prompt, setPrompt]           = useState('')
  const [refImages, setRefImages]     = useState<RefImage[]>([])
  const [jobs, setJobs]               = useState<Job[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId]     = useState<string | null>(null)
  const [uploadingRefs, setUploadingRefs] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef   = useRef<ReturnType<ReturnType<typeof createBrowserClient>['channel']> | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // ── Cleanup Realtime on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  // ── Reference image uploads ───────────────────────────────────────────────
  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const next: RefImage[] = await Promise.all(
      arr.map(async file => ({
        file,
        preview: URL.createObjectURL(file),
        b64: await compressImage(file),
      }))
    )
    setRefImages(prev => [...prev, ...next])
  }

  function removeImage(idx: number) {
    setRefImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Subscribe to Realtime for a session ──────────────────────────────────
  const subscribeToSession = useCallback((sid: string) => {
    channelRef.current?.unsubscribe()

    const channel = supabase
      .channel(`jobs:${sid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_jobs',
          filter: `session_id=eq.${sid}`,
        },
        (payload) => {
          const updated = payload.new as Job
          setJobs(prev => prev.map(j => j.id === updated.id ? { ...j, ...updated } : j))
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [supabase])

  // ── Upload reference images to Supabase Storage ───────────────────────────
  async function uploadRefImages(sid: string): Promise<string[]> {
    const paths: string[] = []
    for (let i = 0; i < refImages.length; i++) {
      const ref = refImages[i]
      const path = `refs/${sid}/ref-${i}.jpg`
      const buf = Buffer.from(ref.b64, 'base64')
      const { error } = await supabase.storage
        .from('campaign-assets')
        .upload(path, buf, { contentType: 'image/jpeg', upsert: true })
      if (!error) paths.push(path)
    }
    return paths
  }

  // ── Process a single job ─────────────────────────────────────────────────
  async function processJob(jobId: string) {
    try {
      const res = await fetch('/api/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) {
        let errMsg = `Server error (${res.status})`
        try { const d = await res.json(); errMsg = d.error || errMsg } catch { /* ignore */ }
        throw new Error(errMsg)
      }
    } catch (err) {
      console.error(`[create] processJob ${jobId} failed:`, err)
      // Update local state — Realtime should also fire but this is a fallback
      setJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
          : j
      ))
    }
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    setJobs([])

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Upload reference images if any
      let referencePaths: string[] = []
      if (refImages.length > 0) {
        setUploadingRefs(true)
        // We need a temp session ID for uploading before we have the real one
        const tempId = crypto.randomUUID()
        referencePaths = await uploadRefImages(tempId)
        setUploadingRefs(false)
      }

      // Create all jobs in Supabase
      const res = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId: user?.id,
          referencePaths,
        }),
      })

      let data: { sessionId: string; jobs: Job[] }
      try { data = await res.json() } catch {
        throw new Error(`Server error (${res.status})`)
      }
      if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`)

      const { sessionId: sid, jobs: newJobs } = data
      setSessionId(sid)
      setJobs(newJobs.map(j => ({ ...j, status: 'pending' as const })))

      // Subscribe to Realtime before firing jobs
      subscribeToSession(sid)

      // Fire all process-job calls in parallel — each is its own Vercel function invocation
      await Promise.allSettled(newJobs.map(j => processJob(j.id)))

    } catch (err) {
      console.error('[create] handleGenerate error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Retry a single job ────────────────────────────────────────────────────
  async function handleRetry(job: Job) {
    if (isGenerating) return
    setIsGenerating(true)
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'pending', error: undefined } : j))
    await processJob(job.id)
    setIsGenerating(false)
  }

  // ── Download single ───────────────────────────────────────────────────────
  async function handleDownload(job: Job) {
    if (!job.image_url) return
    const res  = await fetch(job.image_url)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `image-${String(job.asset_number).padStart(2, '0')}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Download ZIP ──────────────────────────────────────────────────────────
  async function handleDownloadZip() {
    const done = jobs.filter(j => j.status === 'complete' && j.image_url)
    if (!done.length) return
    const zip = new JSZip()
    await Promise.all(done.map(async j => {
      const res  = await fetch(j.image_url!)
      const buf  = await res.arrayBuffer()
      zip.file(`image-${String(j.asset_number).padStart(2, '0')}.png`, buf)
    }))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'campaign-images.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doneCount  = jobs.filter(j => j.status === 'complete').length
  const errorCount = jobs.filter(j => j.status === 'error').length
  const detectedN  = prompt.trim() ? parseCount(prompt) : 9
  const isActive   = jobs.some(j => j.status === 'pending' || j.status === 'processing')

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-white flex items-center gap-2"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.9rem', letterSpacing: '0.06em' }}
        >
          <Sparkles size={22} className="text-[#FF3B1A]" />
          AI Campaign Creator
        </h1>
        <p className="text-white/30 text-sm mt-0.5">
          Upload references → write your brief → images generate live via Supabase Realtime
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: Inputs ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Upload zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
            onClick={() => !refImages.length && fileInputRef.current?.click()}
            className={`bg-[#0a0a0a] border border-dashed rounded-xl transition-colors ${
              refImages.length
                ? 'border-white/10 p-4'
                : 'border-white/10 hover:border-[#FF3B1A]/30 cursor-pointer p-8'
            }`}
          >
            {refImages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <Upload size={20} className="text-white/30" />
                </div>
                <div>
                  <p className="text-white/50 text-sm font-medium">Drop reference images here</p>
                  <p className="text-white/25 text-xs mt-0.5">Person, product, moodboard — any number</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/50 hover:text-white text-xs rounded-lg transition"
                >
                  Browse files
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {refImages.map((img, i) => (
                  <div key={i} className="relative group/img w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#111]">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={e => { e.stopPropagation(); removeImage(i) }}
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="w-20 h-20 rounded-lg border border-dashed border-white/10 hover:border-[#FF3B1A]/30 flex items-center justify-center flex-shrink-0 transition"
                >
                  <Upload size={16} className="text-white/20" />
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
          />

          {/* Prompt */}
          <div className="relative">
            <textarea
              className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF3B1A]/40 focus:bg-[#0d0d0d] transition resize-none"
              rows={9}
              placeholder={`Write your campaign brief. Mention how many images you want.\n\nExamples:\n• "Generate 12 images of a luxury sneaker campaign, cinematic lighting"\n• "Create 5 posters for a skincare brand, minimal white aesthetic"\n• "Make 9 product shots of perfume bottles on marble"\n\nDefault: 9 images`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            {prompt.trim() && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-1 rounded-lg border border-white/8">
                <span className="text-white/25 text-[10px]">will generate</span>
                <span className="text-[#FF3B1A] text-[11px] font-semibold tabular-nums">{detectedN}</span>
                <span className="text-white/25 text-[10px]">image{detectedN !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#FF3B1A] hover:bg-[#ff5538] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.08em' }}
            >
              {uploadingRefs
                ? <><Loader2 size={18} className="animate-spin" /> Uploading References…</>
                : isActive
                  ? <><Loader2 size={18} className="animate-spin" /> Generating {doneCount}/{jobs.length}…</>
                  : isGenerating
                    ? <><Loader2 size={18} className="animate-spin" /> Starting…</>
                    : <><Sparkles size={18} /> Generate Campaign</>
              }
            </button>

            {jobs.length > 0 && (
              <div className="flex gap-2 text-xs text-white/30 justify-between items-center px-1">
                <div className="flex gap-3">
                  {doneCount > 0 && <span className="text-green-400">{doneCount} done</span>}
                  {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
                  {isActive && (
                    <span className="text-[#FF3B1A] flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      Live via Realtime
                    </span>
                  )}
                </div>
                {doneCount > 0 && !isActive && (
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition"
                  >
                    <Archive size={12} /> Download ZIP
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Image grid ───────────────────────────────────────────── */}
        {jobs.length > 0 && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                Generated Images
              </p>
              {sessionId && (
                <span className="text-white/15 text-[10px] font-mono truncate max-w-[140px]">
                  {sessionId.slice(0, 8)}…
                </span>
              )}
            </div>
            <div className={`grid ${gridCols(jobs.length)} gap-2`}>
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDownload={handleDownload}
                  onRetry={handleRetry}
                  disabled={isGenerating}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
