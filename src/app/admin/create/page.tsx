'use client'
import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import {
  Sparkles, Upload, X, Download, RefreshCw, Loader2, AlertCircle,
  Archive, Image as ImageIcon,
} from 'lucide-react'
import { DEFAULT_ASSETS } from '@/lib/brandDna'
import type { GeneratedAsset } from '@/lib/brandDna'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefImage {
  file: File
  preview: string
  b64: string
}

type AssetState = GeneratedAsset

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function freshAssets(): AssetState[] {
  return DEFAULT_ASSETS.map(a => ({ ...a, status: 'idle' as const }))
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset, onDownload, onRegenerate, disabled,
}: {
  asset: AssetState
  onDownload: (a: AssetState) => void
  onRegenerate: (id: string) => void
  disabled: boolean
}) {
  const aspectClass =
    asset.aspectRatio === '9:16' ? 'aspect-[9/16]'
    : asset.aspectRatio === '16:9' ? 'aspect-[16/9]'
    : 'aspect-square'

  return (
    <div className="group relative bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden flex flex-col">
      <div className={`relative w-full ${aspectClass} bg-[#111] overflow-hidden`}>

        {asset.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <ImageIcon size={18} className="text-white/10" />
            <span className="text-white/15 text-[10px]">{asset.spec}</span>
          </div>
        )}

        {asset.status === 'generating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0d0d]">
            <Loader2 size={22} className="text-[#FF3B1A] animate-spin" />
            <span className="text-white/30 text-[10px]">Generating…</span>
          </div>
        )}

        {asset.status === 'done' && asset.b64 && (
          <>
            <img
              src={`data:image/png;base64,${asset.b64}`}
              alt={asset.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onDownload(asset)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
              >
                <Download size={14} />
              </button>
              {!disabled && (
                <button
                  onClick={() => onRegenerate(asset.id)}
                  className="bg-white/10 hover:bg-[#FF3B1A]/30 text-white p-2 rounded-lg transition"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </>
        )}

        {asset.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-red-400/60 text-[10px] text-center leading-tight">{asset.error ?? 'Failed'}</p>
            {!disabled && (
              <button
                onClick={() => onRegenerate(asset.id)}
                className="text-[10px] text-[#FF3B1A] hover:underline flex items-center gap-1 mt-1"
              >
                <RefreshCw size={10} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <p className="text-white/60 text-[11px] font-medium truncate">{asset.label}</p>
        <span className="flex-shrink-0 text-[9px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wide">
          {asset.spec}
        </span>
      </div>

      {asset.status === 'done' && (
        <div className="px-2.5 pb-2 -mt-0.5 flex gap-1">
          <button
            onClick={() => onDownload(asset)}
            className="flex-1 text-[10px] text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-1 flex items-center justify-center gap-1 transition"
          >
            <Download size={10} /> PNG
          </button>
          {!disabled && (
            <button
              onClick={() => onRegenerate(asset.id)}
              className="text-[10px] text-white/40 hover:text-[#FF3B1A] bg-white/5 hover:bg-[#FF3B1A]/10 rounded-lg py-1 px-2 transition"
            >
              <RefreshCw size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [prompt, setPrompt]       = useState('')
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [assets, setAssets]       = useState<AssetState[]>(freshAssets)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef      = useRef<HTMLDivElement>(null)

  // ── Image upload ─────────────────────────────────────────────────────────────
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  // ── Generate single ───────────────────────────────────────────────────────────
  const generateOne = useCallback(async (assetId: string, userPrompt: string, images: RefImage[]) => {
    const assetDef = DEFAULT_ASSETS.find(a => a.id === assetId)
    if (!assetDef) return

    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'generating' } : a))

    try {
      const body: Record<string, unknown> = {
        assetId,
        aspectRatio: assetDef.aspectRatio,
        assetLabel: assetDef.label,
        userPrompt,
      }
      if (images.length) body.referenceImages = images.map(i => i.b64)

      const res  = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'done', b64: data.b64 } : a))
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Generation failed'
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'error', error } : a))
    }
  }, [])

  // ── Generate all ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    setAssets(freshAssets)
    await Promise.allSettled(DEFAULT_ASSETS.map(a => generateOne(a.id, prompt, refImages)))
    setIsGenerating(false)
  }

  // ── Regenerate one ────────────────────────────────────────────────────────────
  async function handleRegenerate(assetId: string) {
    if (isGenerating) return
    setIsGenerating(true)
    await generateOne(assetId, prompt, refImages)
    setIsGenerating(false)
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  function handleDownload(asset: AssetState) {
    if (!asset.b64) return
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${asset.b64}`
    a.download = asset.fileName
    a.click()
  }

  async function handleDownloadZip() {
    const done = assets.filter(a => a.status === 'done' && a.b64)
    if (!done.length) return
    const zip = new JSZip()
    done.forEach(a => zip.file(a.fileName, a.b64!, { base64: true }))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'campaign-assets.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doneCount  = assets.filter(a => a.status === 'done').length
  const totalDone  = assets.filter(a => a.status === 'done' || a.status === 'error').length
  const progress   = Math.round((totalDone / 9) * 100)

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold flex items-center gap-2"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.9rem', letterSpacing: '0.06em' }}>
            <Sparkles size={22} className="text-[#FF3B1A]" />
            AI Campaign Creator
          </h1>
          <p className="text-white/30 text-sm mt-0.5">Upload references → write your brief → generate 9 assets</p>
        </div>
        {doneCount > 0 && (
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] text-sm font-medium rounded-xl border border-[#FF3B1A]/20 transition"
          >
            <Archive size={14} /> Download All ({doneCount})
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: inputs ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Upload zone */}
          <div
            ref={dropRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !refImages.length && fileInputRef.current?.click()}
            className={`bg-[#0a0a0a] border border-dashed rounded-xl transition-colors ${
              refImages.length ? 'border-white/10 p-4' : 'border-white/10 hover:border-[#FF3B1A]/30 cursor-pointer p-8'
            }`}
          >
            {refImages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <Upload size={20} className="text-white/30" />
                </div>
                <div>
                  <p className="text-white/50 text-sm font-medium">Drop reference images here</p>
                  <p className="text-white/25 text-xs mt-0.5">Person photos, product shots, moodboards — any images</p>
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
          <textarea
            className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF3B1A]/40 focus:bg-[#0d0d0d] transition resize-none"
            rows={10}
            placeholder={`Describe your full campaign brief…\n\nExample:\nLuxury sneaker brand called STRYD. Product is the Vertex Pro runner in white/chrome colorway. Target audience: 25-35 year old athletes. Vibe: editorial, minimal, premium. Primary color #0a0a0a with silver accents. Feature a fit male model in an urban setting at night under streetlights. High contrast, cinematic feel.`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />

          {/* Generate button + progress */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#FF3B1A] hover:bg-[#ff5538] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.08em' }}
            >
              {isGenerating
                ? <><Loader2 size={18} className="animate-spin" /> Generating {totalDone} / 9…</>
                : <><Sparkles size={18} /> Generate All 9 Assets</>
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

        {/* ── Right: 3×3 asset grid ─────────────────────────────────────────── */}
        <div className="w-[400px] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Assets</p>
            <div className="flex items-center gap-2 text-xs">
              {doneCount > 0 && <span className="text-green-400">{doneCount} done</span>}
              {assets.some(a => a.status === 'error') && (
                <span className="text-red-400">{assets.filter(a => a.status === 'error').length} failed</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {assets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                disabled={isGenerating}
              />
            ))}
          </div>

          {doneCount > 0 && !isGenerating && (
            <button
              onClick={handleDownloadZip}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] rounded-xl text-sm font-medium transition border border-[#FF3B1A]/20"
            >
              <Archive size={14} /> Download ZIP
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
