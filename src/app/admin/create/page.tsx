'use client'
import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import { Sparkles, Upload, X, Download, RefreshCw, Loader2, AlertCircle, Archive } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefImage {
  file: File
  preview: string
  b64: string
}

interface GenImage {
  index: number
  status: 'generating' | 'done' | 'error'
  b64?: string
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function parseCount(prompt: string): number {
  const patterns = [
    /\b(\d+)\s+(?:image|photo|poster|version|asset|variation|design|concept|visual|render|shot|frame|card)s?\b/i,
    /\b(?:generate|create|make|produce|give\s+me|show\s+me)\s+(\d+)\b/i,
    /\b(\d+)\s+(?:of\s+)?(?:them|those|these|result|output)s?\b/i,
  ]
  for (const re of patterns) {
    const m = prompt.match(re)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n >= 1 && n <= 50) return n
    }
  }
  return 9
}

function gridCols(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4)  return 'grid-cols-2'
  if (count <= 9)  return 'grid-cols-3'
  return 'grid-cols-4'
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  img, onDownload, onRetry, disabled,
}: {
  img: GenImage
  onDownload: (img: GenImage) => void
  onRetry: (index: number) => void
  disabled: boolean
}) {
  return (
    <div className="group relative bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
      <div className="aspect-square relative bg-[#111]">

        {img.status === 'generating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="text-[#FF3B1A] animate-spin" />
            <span className="text-white/25 text-[10px]">#{img.index + 1}</span>
          </div>
        )}

        {img.status === 'done' && img.b64 && (
          <>
            <img
              src={`data:image/png;base64,${img.b64}`}
              alt={`Image ${img.index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onDownload(img)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
                title="Download"
              >
                <Download size={14} />
              </button>
              {!disabled && (
                <button
                  onClick={() => onRetry(img.index)}
                  className="bg-white/10 hover:bg-[#FF3B1A]/30 text-white p-2 rounded-lg transition"
                  title="Regenerate"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </>
        )}

        {img.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-red-400/60 text-[10px] text-center leading-tight line-clamp-3">
              {img.error ?? 'Failed'}
            </p>
            {!disabled && (
              <button
                onClick={() => onRetry(img.index)}
                className="text-[10px] text-[#FF3B1A] hover:underline flex items-center gap-1 mt-1"
              >
                <RefreshCw size={10} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Index label + download strip */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <span className="text-white/30 text-[11px] tabular-nums">#{img.index + 1}</span>
        {img.status === 'done' && (
          <button
            onClick={() => onDownload(img)}
            className="text-[10px] text-white/30 hover:text-white flex items-center gap-1 transition"
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
  const [prompt, setPrompt]         = useState('')
  const [refImages, setRefImages]   = useState<RefImage[]>([])
  const [images, setImages]         = useState<GenImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Uploads ───────────────────────────────────────────────────────────────────
  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const next: RefImage[] = await Promise.all(
      arr.map(async file => ({
        file,
        preview: URL.createObjectURL(file),
        b64: await fileToBase64(file),
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

  // ── Generate one image ────────────────────────────────────────────────────────
  const generateOne = useCallback(async (
    index: number,
    userPrompt: string,
    refs: RefImage[],
  ) => {
    setImages(prev => prev.map(img =>
      img.index === index ? { ...img, status: 'generating' } : img
    ))

    try {
      const body: Record<string, unknown> = { index, userPrompt }
      if (refs.length) body.referenceImages = refs.map(r => r.b64)

      const res  = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      setImages(prev => prev.map(img =>
        img.index === index ? { ...img, status: 'done', b64: data.b64 } : img
      ))
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Generation failed'
      setImages(prev => prev.map(img =>
        img.index === index ? { ...img, status: 'error', error } : img
      ))
    }
  }, [])

  // ── Generate all ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return
    const count = parseCount(prompt)
    const slots: GenImage[] = Array.from({ length: count }, (_, i) => ({
      index: i,
      status: 'generating',
    }))
    setImages(slots)
    setIsGenerating(true)
    await Promise.allSettled(slots.map(s => generateOne(s.index, prompt, refImages)))
    setIsGenerating(false)
  }

  // ── Retry one ─────────────────────────────────────────────────────────────────
  async function handleRetry(index: number) {
    if (isGenerating) return
    setIsGenerating(true)
    await generateOne(index, prompt, refImages)
    setIsGenerating(false)
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  function handleDownload(img: GenImage) {
    if (!img.b64) return
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${img.b64}`
    a.download = `image-${String(img.index + 1).padStart(2, '0')}.png`
    a.click()
  }

  async function handleDownloadZip() {
    const done = images.filter(img => img.status === 'done' && img.b64)
    if (!done.length) return
    const zip = new JSZip()
    done.forEach(img => {
      zip.file(`image-${String(img.index + 1).padStart(2, '0')}.png`, img.b64!, { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'campaign-images.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doneCount  = images.filter(i => i.status === 'done').length
  const totalDone  = images.filter(i => i.status === 'done' || i.status === 'error').length
  const progress   = images.length ? Math.round((totalDone / images.length) * 100) : 0
  const detectedN  = prompt.trim() ? parseCount(prompt) : 9

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
          Upload references → write your brief → generate any number of images
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: inputs ─────────────────────────────────────────────────────── */}
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
                  <p className="text-white/25 text-xs mt-0.5">Person, product, moodboard — any number of images</p>
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
              rows={10}
              placeholder={`Write your campaign brief. Mention how many images you want.\n\nExamples:\n• "Generate 12 images of a luxury sneaker campaign featuring a female athlete at night, cinematic lighting, dark editorial vibe"\n• "Create 5 posters for a skincare brand, minimal white aesthetic"\n• "Make 20 product shots of perfume bottles on marble"\n\nIf you don't specify a number, 9 images will be generated.`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            {prompt.trim() && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-1 rounded-lg border border-white/8">
                <span className="text-white/25 text-[10px]">will generate</span>
                <span className="text-[#FF3B1A] text-[11px] font-semibold tabular-nums">{detectedN}</span>
                <span className="text-white/25 text-[10px]">image{detectedN !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Generate */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#FF3B1A] hover:bg-[#ff5538] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.08em' }}
            >
              {isGenerating
                ? <><Loader2 size={18} className="animate-spin" /> Generating {totalDone} / {images.length}…</>
                : <><Sparkles size={18} /> Generate {detectedN} Image{detectedN !== 1 ? 's' : ''}</>
              }
            </button>

            {isGenerating && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF3B1A] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-white/30 text-xs tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: dynamic image grid ────────────────────────────────────────── */}
        <div className="w-[440px] flex-shrink-0">

          {/* Download All — always at top */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">
              {images.length ? `${doneCount} / ${images.length} ready` : 'Images'}
            </p>
            {doneCount > 0 && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] text-xs font-medium rounded-lg border border-[#FF3B1A]/20 transition"
              >
                <Archive size={12} /> Download All ({doneCount})
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Sparkles size={18} className="text-white/15" />
              </div>
              <p className="text-white/20 text-sm">Generated images appear here</p>
              <p className="text-white/12 text-xs">Write a brief and click Generate</p>
            </div>
          ) : (
            <div className={`grid ${gridCols(images.length)} gap-2`}>
              {images.map(img => (
                <ImageCard
                  key={img.index}
                  img={img}
                  onDownload={handleDownload}
                  onRetry={handleRetry}
                  disabled={isGenerating}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
