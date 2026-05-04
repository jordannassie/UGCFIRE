'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import {
  Sparkles, Upload, X, Download, RefreshCw, Loader2, Check, AlertCircle,
  Globe, ChevronDown, Wand2, Archive, BookOpen, Plus, Image as ImageIcon,
} from 'lucide-react'
import { VIBES, PRODUCT_CATEGORIES, DEFAULT_ASSETS } from '@/lib/brandDna'
import { generateHiggsfieldBrief } from '@/lib/prompts'
import type { BrandDNA, GeneratedAsset, BrandColors } from '@/lib/brandDna'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadSlot {
  file: File | null
  preview: string | null
  b64: string | null
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

const DEFAULT_COLORS: BrandColors = { primary: '#FF3B1A', accent: '#1a3fff', dark: '#080808', light: '#f5f0eb' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function UploadZone({
  label, hint, slot, onChange, accept = 'image/*',
}: {
  label: string; hint: string; slot: UploadSlot
  onChange: (slot: UploadSlot) => void; accept?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const preview = URL.createObjectURL(file)
    const b64 = await fileToBase64(file)
    onChange({ file, preview, b64 })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    if (slot.preview) URL.revokeObjectURL(slot.preview)
    onChange({ file: null, preview: null, b64: null })
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className="relative border border-dashed border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-[#FF3B1A]/40 transition-colors group"
      style={{ minHeight: 96 }}
      onClick={() => !slot.file && inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {slot.preview ? (
        <>
          <img src={slot.preview} alt={label} className="w-full h-full object-cover" style={{ maxHeight: 140 }} />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button onClick={clear} className="bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full">
              <X size={14} />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
            <p className="text-white/80 text-[10px] truncate">{slot.file?.name}</p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 p-4 h-full min-h-[96px]">
          <Upload size={18} className="text-white/20 group-hover:text-[#FF3B1A]/60 transition" />
          <p className="text-white/40 text-xs font-medium text-center">{label}</p>
          <p className="text-white/20 text-[10px] text-center leading-tight">{hint}</p>
        </div>
      )}
      <input
        ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

function AssetCard({
  asset, onDownload, onRegenerate, isGenerating,
}: {
  asset: AssetState
  onDownload: (asset: AssetState) => void
  onRegenerate: (assetId: string) => void
  isGenerating: boolean
}) {
  const aspectClass = asset.aspectRatio === '9:16' ? 'aspect-[9/16]'
    : asset.aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square'

  return (
    <div className="group relative bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden flex flex-col">
      <div className={`relative w-full ${aspectClass} bg-[#111] overflow-hidden`}>
        {asset.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageIcon size={20} className="text-white/10" />
            <span className="text-white/15 text-[10px]">{asset.spec}</span>
          </div>
        )}

        {asset.status === 'generating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0d0d]">
            <div className="relative">
              <Loader2 size={24} className="text-[#FF3B1A] animate-spin" />
            </div>
            <span className="text-white/30 text-[10px]">Generating…</span>
            <div className="w-16 h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF3B1A] rounded-full animate-pulse w-2/3" />
            </div>
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
                title="Download"
              >
                <Download size={14} />
              </button>
              {!isGenerating && (
                <button
                  onClick={() => onRegenerate(asset.id)}
                  className="bg-white/10 hover:bg-[#FF3B1A]/30 text-white p-2 rounded-lg transition"
                  title="Regenerate"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </>
        )}

        {asset.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400/70 text-[10px] text-center leading-tight">{asset.error ?? 'Failed'}</p>
            {!isGenerating && (
              <button
                onClick={() => onRegenerate(asset.id)}
                className="mt-1 text-[10px] text-[#FF3B1A] hover:underline flex items-center gap-1"
              >
                <RefreshCw size={10} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-white/70 text-[11px] font-medium truncate">{asset.label}</p>
        </div>
        <span className="flex-shrink-0 text-[9px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wide">
          {asset.spec}
        </span>
      </div>

      {asset.status === 'done' && (
        <div className="px-2.5 pb-2 -mt-1 flex gap-1">
          <button
            onClick={() => onDownload(asset)}
            className="flex-1 text-[10px] text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-1 flex items-center justify-center gap-1 transition"
          >
            <Download size={10} /> PNG
          </button>
          {!isGenerating && (
            <button
              onClick={() => onRegenerate(asset.id)}
              className="flex-shrink-0 text-[10px] text-white/40 hover:text-[#FF3B1A] bg-white/5 hover:bg-[#FF3B1A]/10 rounded-lg py-1 px-2 flex items-center justify-center transition"
              title="Regenerate"
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
  // Form state
  const [brandName, setBrandName]               = useState('')
  const [productName, setProductName]           = useState('')
  const [productCategory, setProductCategory]   = useState('')
  const [tagline, setTagline]                   = useState('')
  const [vibe, setVibe]                         = useState('Luxury')
  const [colors, setColors]                     = useState<BrandColors>(DEFAULT_COLORS)
  const [productDescription, setProductDescription] = useState('')
  const [targetPerson, setTargetPerson]         = useState('')
  const [setting, setSetting]                   = useState('')

  // Uploads
  const [characterSlot, setCharacterSlot]   = useState<UploadSlot>({ file: null, preview: null, b64: null })
  const [productSlot, setProductSlot]       = useState<UploadSlot>({ file: null, preview: null, b64: null })
  const [moodboardSlot, setMoodboardSlot]   = useState<UploadSlot>({ file: null, preview: null, b64: null })

  // Scraper
  const [scrapeUrl, setScrapeUrl]   = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')

  // Generation
  const [assets, setAssets]           = useState<AssetState[]>(freshAssets)
  const [isGenerating, setIsGenerating] = useState(false)
  const [doneCount, setDoneCount]     = useState(0)

  // Saved brands
  const [savedBrands, setSavedBrands] = useState<string[]>([])
  const [isSaving, setIsSaving]       = useState(false)

  // Load saved brands on mount
  useEffect(() => {
    fetch('/api/save-brand')
      .then(r => r.json())
      .then(d => setSavedBrands(d.brands ?? []))
      .catch(() => {})
  }, [])

  function buildDna(): BrandDNA {
    return {
      brandName, productName, productCategory, tagline, vibe, colors,
      productDescription, targetPerson, setting,
      generatedAssets: assets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // ── Scrape ──────────────────────────────────────────────────────────────────
  async function handleScrape() {
    if (!scrapeUrl.trim()) return
    setIsScraping(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/scrape-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.brandName) setBrandName(data.brandName)
      if (data.tagline)   setTagline(data.tagline)
      if (data.productNames?.[0]) setProductName(data.productNames[0])
      if (data.productDescriptions?.[0]) setProductDescription(data.productDescriptions[0])

      // Auto-fill colors if found
      if (data.colors?.length >= 4) {
        setColors({
          primary: data.colors[0] ?? DEFAULT_COLORS.primary,
          accent:  data.colors[1] ?? DEFAULT_COLORS.accent,
          dark:    data.colors[2] ?? DEFAULT_COLORS.dark,
          light:   data.colors[3] ?? DEFAULT_COLORS.light,
        })
      } else if (data.colors?.length) {
        setColors(prev => ({ ...prev, primary: data.colors[0] }))
      }
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Scrape failed')
    } finally {
      setIsScraping(false)
    }
  }

  // ── Generate single asset ───────────────────────────────────────────────────
  const generateAsset = useCallback(async (assetId: string, dna: BrandDNA) => {
    const assetDef = DEFAULT_ASSETS.find(a => a.id === assetId)
    if (!assetDef) return

    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'generating' } : a))

    try {
      const referenceImages: Record<string, string> = {}
      if (characterSlot.b64) referenceImages.character = characterSlot.b64
      if (productSlot.b64)   referenceImages.product   = productSlot.b64
      if (moodboardSlot.b64) referenceImages.moodboard = moodboardSlot.b64

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          aspectRatio: assetDef.aspectRatio,
          dna,
          referenceImages: Object.keys(referenceImages).length ? referenceImages : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'done', b64: data.b64 } : a))
      setDoneCount(n => n + 1)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Generation failed'
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'error', error } : a))
    }
  }, [characterSlot.b64, productSlot.b64, moodboardSlot.b64])

  // ── Generate all ─────────────────────────────────────────────────────────────
  async function handleGenerateAll() {
    if (!brandName.trim()) return
    setIsGenerating(true)
    setDoneCount(0)
    setAssets(freshAssets)

    const dna = buildDna()
    const promises = DEFAULT_ASSETS.map(a => generateAsset(a.id, dna))
    await Promise.allSettled(promises)

    setIsGenerating(false)
  }

  // ── Regenerate single ───────────────────────────────────────────────────────
  async function handleRegenerate(assetId: string) {
    if (isGenerating) return
    setIsGenerating(true)
    await generateAsset(assetId, buildDna())
    setIsGenerating(false)
  }

  // ── Download single ─────────────────────────────────────────────────────────
  function handleDownload(asset: AssetState) {
    if (!asset.b64) return
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${asset.b64}`
    a.download = asset.fileName
    a.click()
  }

  // ── Download ZIP ────────────────────────────────────────────────────────────
  async function handleDownloadZip() {
    const done = assets.filter(a => a.status === 'done' && a.b64)
    if (!done.length) return

    const zip = new JSZip()
    done.forEach(a => zip.file(a.fileName, a.b64!, { base64: true }))
    zip.file('higgsfield-brief.txt', generateHiggsfieldBrief(
      brandName || 'Brand',
      done.map(a => ({ id: a.id, label: a.label, fileName: a.fileName }))
    ))

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(brandName || 'campaign').replace(/\s+/g, '-').toLowerCase()}-campaign.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Save brand ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!brandName.trim()) return
    setIsSaving(true)
    try {
      const dna = buildDna()
      const doneAssets = assets.filter(a => a.status === 'done' && a.b64)
        .map(a => ({ id: a.id, b64: a.b64!, fileName: a.fileName }))

      const uploadedImages: Record<string, string> = {}
      if (characterSlot.b64) uploadedImages.character = characterSlot.b64
      if (productSlot.b64)   uploadedImages.product   = productSlot.b64
      if (moodboardSlot.b64) uploadedImages.moodboard = moodboardSlot.b64

      await fetch('/api/save-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dna, assets: doneAssets, uploadedImages }),
      })

      const list = await fetch('/api/save-brand').then(r => r.json())
      setSavedBrands(list.brands ?? [])
    } finally {
      setIsSaving(false)
    }
  }

  // ── Load saved brand ────────────────────────────────────────────────────────
  async function handleLoadBrand(name: string) {
    const res = await fetch(`/api/save-brand?brand=${encodeURIComponent(name)}`)
    if (!res.ok) return
    const dna: BrandDNA = await res.json()
    setBrandName(dna.brandName)
    setProductName(dna.productName ?? '')
    setProductCategory(dna.productCategory ?? '')
    setTagline(dna.tagline ?? '')
    setVibe(dna.vibe ?? 'Luxury')
    setColors(dna.colors ?? DEFAULT_COLORS)
    setProductDescription(dna.productDescription ?? '')
    setTargetPerson(dna.targetPerson ?? '')
    setSetting(dna.setting ?? '')
    if (dna.generatedAssets?.length) {
      setAssets(dna.generatedAssets.map(a => ({ ...a, status: a.b64 ? 'done' as const : 'idle' as const })))
    } else {
      setAssets(freshAssets)
    }
  }

  const doneCount2 = assets.filter(a => a.status === 'done').length
  const errorCount = assets.filter(a => a.status === 'error').length
  const totalDone  = doneCount2 + errorCount
  const progress   = Math.round((totalDone / 9) * 100)

  const ic = 'w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF3B1A]/50 focus:bg-white/8 transition'
  const label = 'text-white/50 text-xs font-medium uppercase tracking-wider mb-1.5 block'

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-[#FF3B1A]" />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em', fontSize: '1.75rem' }}>
              AI Campaign Creator
            </span>
          </h1>
          <p className="text-white/30 text-sm mt-0.5">Brand URL → uploads → 9 assets → Higgsfield brief</p>
        </div>
        <div className="flex items-center gap-2">
          {doneCount2 > 0 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-sm transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
              Save Brand
            </button>
          )}
          {doneCount2 > 0 && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] text-sm font-medium transition border border-[#FF3B1A]/20"
            >
              <Archive size={14} />
              Download All ({doneCount2})
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: Saved brands ─────────────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">Saved Brands</p>
            {savedBrands.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen size={20} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/20 text-xs">No brands yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {savedBrands.map(b => (
                  <button
                    key={b}
                    onClick={() => handleLoadBrand(b.replace(/_/g, ' '))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      brandName === b.replace(/_/g, ' ')
                        ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate block">{b.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Form ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* URL Scraper */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-[#FF3B1A]" />
              <p className="text-white/70 text-sm font-semibold">Path A — URL Scraper</p>
              <span className="text-white/20 text-xs">optional</span>
            </div>
            <div className="flex gap-2">
              <input
                className={ic + ' flex-1'}
                placeholder="https://brand.com"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
              />
              <button
                onClick={handleScrape}
                disabled={isScraping || !scrapeUrl.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] rounded-lg text-sm font-medium transition disabled:opacity-40 border border-[#FF3B1A]/20 flex-shrink-0"
              >
                {isScraping ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {isScraping ? 'Scraping…' : 'Scrape'}
              </button>
            </div>
            {scrapeError && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {scrapeError}
              </p>
            )}
          </div>

          {/* Brand form */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Wand2 size={14} className="text-[#FF3B1A]" />
              <p className="text-white/70 text-sm font-semibold">Path B — Brand Details</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Brand Name *</label>
                <input className={ic} placeholder="Nike, Glossier, ZARA…" value={brandName} onChange={e => setBrandName(e.target.value)} />
              </div>
              <div>
                <label className={label}>Product Name</label>
                <input className={ic} placeholder="Air Max 97, Lip Gloss…" value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div>
                <label className={label}>Category</label>
                <div className="relative">
                  <select className={ic + ' appearance-none pr-8'} value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                    <option value="">Select category…</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={label}>Brand Vibe</label>
                <div className="relative">
                  <select className={ic + ' appearance-none pr-8'} value={vibe} onChange={e => setVibe(e.target.value)}>
                    {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div className="col-span-2">
                <label className={label}>Tagline</label>
                <input className={ic} placeholder="Just Do It, Because You're Worth It…" value={tagline} onChange={e => setTagline(e.target.value)} />
              </div>
            </div>

            {/* Color pickers */}
            <div className="mt-4">
              <label className={label}>Brand Colors</label>
              <div className="grid grid-cols-4 gap-2">
                {([ ['primary', 'Primary'], ['accent', 'Accent'], ['dark', 'Dark'], ['light', 'Light']] as const).map(
                  ([key, lbl]) => (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-full h-9 rounded-lg border border-white/10 overflow-hidden cursor-pointer relative"
                        style={{ backgroundColor: colors[key] }}
                      >
                        <input
                          type="color"
                          value={colors[key]}
                          onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="text-white/30 text-[10px]">{lbl}</span>
                      <span className="text-white/20 text-[9px] font-mono">{colors[key]}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className={label}>Product Description</label>
              <textarea
                className={ic + ' resize-none'}
                rows={3}
                placeholder="Describe your product, its key features, materials, what makes it unique…"
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={label}>Target Person / Model</label>
                <input className={ic} placeholder="25-year-old athletic woman" value={targetPerson} onChange={e => setTargetPerson(e.target.value)} />
              </div>
              <div>
                <label className={label}>Setting / Environment</label>
                <input className={ic} placeholder="rooftop in Tokyo at sunset" value={setting} onChange={e => setSetting(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Image uploads */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Upload size={14} className="text-[#FF3B1A]" />
              <p className="text-white/70 text-sm font-semibold">Path C — Reference Images</p>
              <span className="text-white/20 text-xs">all optional</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-2">Person / Model</p>
                <UploadZone
                  label="Drop person photo"
                  hint="Used in every scene. JPG/PNG/WEBP"
                  slot={characterSlot}
                  onChange={setCharacterSlot}
                />
              </div>
              <div>
                <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-2">Product Photo</p>
                <UploadZone
                  label="Drop product photo"
                  hint="Consistent product across all assets"
                  slot={productSlot}
                  onChange={setProductSlot}
                />
              </div>
              <div>
                <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-2">Moodboard / Style</p>
                <UploadZone
                  label="Drop moodboard"
                  hint="Visual style reference. JPG/PNG/PDF"
                  slot={moodboardSlot}
                  onChange={setMoodboardSlot}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
            {(characterSlot.b64 || productSlot.b64 || moodboardSlot.b64) && (
              <p className="mt-3 text-[#FF3B1A]/60 text-xs flex items-center gap-1.5">
                <Check size={11} />
                {[characterSlot.b64 && 'person', productSlot.b64 && 'product', moodboardSlot.b64 && 'moodboard']
                  .filter(Boolean).join(', ')} will be used as reference{' '}
                in all generations via image-edit mode
              </p>
            )}
          </div>

          {/* Generate button */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/50 text-xs mb-1">
                  Estimated cost: <span className="text-white/70">~$0.12 × 9 = ~$1.08</span>
                  {(characterSlot.b64 || productSlot.b64 || moodboardSlot.b64) && (
                    <span className="text-[#FF3B1A]/60"> (edit mode, may vary)</span>
                  )}
                </p>
                {isGenerating && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden" style={{ maxWidth: 200 }}>
                      <div
                        className="h-full bg-[#FF3B1A] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-white/40 text-xs">{totalDone}/9</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleGenerateAll}
                disabled={isGenerating || !brandName.trim()}
                className="flex items-center gap-2.5 px-6 py-3 bg-[#FF3B1A] hover:bg-[#ff5538] text-white font-semibold rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.08em' }}
              >
                {isGenerating
                  ? <><Loader2 size={16} className="animate-spin" /> Generating {doneCount}/9…</>
                  : <><Sparkles size={16} /> Generate All 9 Assets</>
                }
              </button>
            </div>
            {!brandName.trim() && (
              <p className="text-white/25 text-xs">Enter a brand name to start generating</p>
            )}
          </div>
        </div>

        {/* ── Right: Asset grid ──────────────────────────────────────────────── */}
        <div className="w-[400px] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Generated Assets</p>
            <div className="flex items-center gap-2 text-xs text-white/30">
              {doneCount2 > 0 && <span className="text-green-400">{doneCount2} done</span>}
              {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
              {assets.some(a => a.status === 'generating') && (
                <span className="text-[#FF3B1A] flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> generating…
                </span>
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
                isGenerating={isGenerating}
              />
            ))}
          </div>

          {doneCount2 > 0 && (
            <div className="mt-4 space-y-2">
              <button
                onClick={handleDownloadZip}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] rounded-xl text-sm font-medium transition border border-[#FF3B1A]/20"
              >
                <Archive size={14} /> Download ZIP + Higgsfield Brief
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/8 text-white/50 hover:text-white rounded-xl text-sm transition disabled:opacity-40"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                Save to Brand Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
