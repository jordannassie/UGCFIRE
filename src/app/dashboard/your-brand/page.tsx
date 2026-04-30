'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import { isDemoMode, DEMO_COMPANY, DEMO_BRAND_BRIEF } from '@/lib/demoData'
import type { Company } from '@/lib/types'
import {
  calcBrandContext, parseExtendedNotes,
  type ExtendedBrandNotes, type MoodboardItem,
} from '@/lib/brandCompletion'
import {
  Check, CheckCircle, Sparkles, Upload, X, Link as LinkIcon,
  Image as ImageIcon, Video, FileText, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

const ic = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none placeholder:text-white/25'
const tc = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none placeholder:text-white/25'

const CONTENT_FORMATS = [
  'Founder-style talking head', 'Product demo', 'Lifestyle B-roll', 'Before / after',
  'Testimonial style', 'Unboxing', 'Problem / solution', 'Street interview style',
  'Day-in-the-life', 'Comparison style', 'First reaction', 'Friend/family reaction',
  'Sensory/ASMR', 'Social proof', 'Product hero',
]

const GOALS = [
  'Get more sales', 'Build awareness', 'Launch a product',
  'Create better ads', 'Get more leads', 'Promote an offer',
]

const MOODBOARD_LABELS = [
  'I like the style', 'I like the creator', 'I like the product shot',
  'I like the editing', 'I like the setting', 'I like the hook',
  'I do not like this', 'Competitor example',
]

function SectionCard({ title, subtitle, children, open = true }: {
  title: string; subtitle?: string; children: React.ReactNode; open?: boolean
}) {
  const [isOpen, setIsOpen] = useState(open)
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition"
      >
        <div>
          <p className="text-white font-semibold text-sm">{title}</p>
          {subtitle && <p className="text-white/35 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {isOpen ? <ChevronUp size={15} className="text-white/30 shrink-0" /> : <ChevronDown size={15} className="text-white/30 shrink-0" />}
      </button>
      {isOpen && <div className="px-5 pb-5 space-y-4 border-t border-white/6">{children}</div>}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function YourBrandPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'basic' | 'pro'>('basic')
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [context, setContext] = useState(calcBrandContext(null))

  // ── Basic form ────────────────────────────────────────────────────────────
  const [basic, setBasic] = useState({
    company_name: '',
    website: '',
    offer: '',
    target_customer: '',
    main_goal: '',
    logo_url: '',
    content_inspiration_links: '',
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Pro form ──────────────────────────────────────────────────────────────
  const [pro, setPro] = useState<ExtendedBrandNotes>({
    brand_voice: '', brand_colors: '', tagline: '',
    words_to_use: '', words_to_avoid: '', additional_brand_notes: '',
    main_product: '', main_offer: '', top_benefits: '', top_selling_points: '',
    price_range: '', product_links: '', product_photo_urls: [],
    bundles_promotions: '', reviews_testimonials: '',
    ideal_customer: '', pain_points: '', desires: '', buying_triggers: '',
    objections: '', use_situations: '',
    style_feel: '', creator_type: '', locations: '', visual_style: '',
    examples_like: '', examples_dislike: '', competitor_inspiration: '',
    claims_to_avoid: '', compliance_notes: '', do_dont_notes: '',
    content_formats: [],
    moodboard_items: [],
  })

  // ── Moodboard ─────────────────────────────────────────────────────────────
  const [moodUploading, setMoodUploading] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkNote, setNewLinkNote] = useState('')
  const moodInputRef = useRef<HTMLInputElement>(null)

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as unknown as Company)
        const b = DEMO_BRAND_BRIEF as unknown as Record<string, unknown>
        setBasic({
          company_name: String(b.company_name ?? ''),
          website: String(b.website ?? ''),
          offer: String(b.offer ?? ''),
          target_customer: String(b.target_customer ?? ''),
          main_goal: '',
          logo_url: '',
          content_inspiration_links: String(b.examples ?? ''),
        })
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const co = await getMyCompany()
      setCompany(co)
      if (!co) { setLoading(false); return }
      setCompanyId(co.id)

      const { data: brief } = await supabase
        .from('brand_briefs')
        .select('*')
        .eq('company_id', co.id)
        .single()

      if (brief) {
        const ext = parseExtendedNotes(brief.notes as string)
        setBasic({
          company_name: brief.company_name ?? '',
          website: brief.website ?? '',
          offer: brief.offer ?? '',
          target_customer: brief.target_customer ?? '',
          main_goal: ext.main_goal ?? '',
          logo_url: ext.logo_url ?? '',
          content_inspiration_links: ext.content_inspiration_links ?? (brief.examples ?? ''),
        })
        setPro({
          brand_voice: brief.brand_voice ?? ext.brand_voice ?? '',
          brand_colors: ext.brand_colors ?? '',
          tagline: ext.tagline ?? '',
          words_to_use: ext.words_to_use ?? '',
          words_to_avoid: ext.words_to_avoid ?? '',
          additional_brand_notes: ext.additional_brand_notes ?? '',
          main_product: ext.main_product ?? '',
          main_offer: ext.main_offer ?? (brief.offer ?? ''),
          top_benefits: ext.top_benefits ?? '',
          top_selling_points: ext.top_selling_points ?? '',
          price_range: ext.price_range ?? '',
          product_links: ext.product_links ?? '',
          product_photo_urls: ext.product_photo_urls ?? [],
          bundles_promotions: ext.bundles_promotions ?? '',
          reviews_testimonials: ext.reviews_testimonials ?? '',
          ideal_customer: ext.ideal_customer ?? (brief.target_customer ?? ''),
          pain_points: ext.pain_points ?? '',
          desires: ext.desires ?? '',
          buying_triggers: ext.buying_triggers ?? '',
          objections: ext.objections ?? '',
          use_situations: ext.use_situations ?? '',
          style_feel: ext.style_feel ?? '',
          creator_type: ext.creator_type ?? '',
          locations: ext.locations ?? '',
          visual_style: ext.visual_style ?? (brief.video_styles ?? ''),
          examples_like: ext.examples_like ?? '',
          examples_dislike: ext.examples_dislike ?? '',
          competitor_inspiration: ext.competitor_inspiration ?? '',
          claims_to_avoid: ext.claims_to_avoid ?? '',
          compliance_notes: ext.compliance_notes ?? '',
          do_dont_notes: ext.do_dont_notes ?? '',
          content_formats: ext.content_formats ?? [],
          moodboard_items: ext.moodboard_items ?? [],
        })
        setContext(calcBrandContext(brief as Record<string, unknown>))
      } else {
        setBasic(b => ({ ...b, company_name: co.name, website: co.website ?? '' }))
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Build notes JSON ──────────────────────────────────────────────────────
  const buildNotes = useCallback(() => {
    const notes: ExtendedBrandNotes & { _v: number } = {
      _v: 2,
      main_goal: basic.main_goal,
      logo_url: basic.logo_url,
      content_inspiration_links: basic.content_inspiration_links,
      ...pro,
    }
    return JSON.stringify(notes)
  }, [basic.main_goal, basic.logo_url, basic.content_inspiration_links, pro])

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!companyId && !isDemoMode()) return
    setSaving(true)
    try {
      if (isDemoMode()) { setSaved(true); setTimeout(() => setSaved(false), 2500); return }
      const supabase = createClient()
      const notesJson = buildNotes()
      await supabase.from('brand_briefs').upsert({
        company_id: companyId!,
        company_name: basic.company_name,
        website: basic.website || null,
        offer: basic.offer || null,
        target_customer: basic.target_customer || null,
        brand_voice: pro.brand_voice || null,
        video_styles: pro.visual_style || null,
        examples: basic.content_inspiration_links || null,
        notes: notesJson,
        assets_url: null,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

      // Refresh context
      const { data: brief } = await supabase.from('brand_briefs').select('*').eq('company_id', companyId!).single()
      if (brief) setContext(calcBrandContext(brief as Record<string, unknown>))

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function saveAndGenerate() {
    await handleSave()
    router.push('/dashboard/strategy-ai')
  }

  // ── Logo upload ───────────────────────────────────────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setLogoUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `brands/${userId}/logo.${ext}`
    const { error } = await supabase.storage.from('UGC Fire').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('UGC Fire').getPublicUrl(path)
      setBasic(b => ({ ...b, logo_url: data.publicUrl }))
    }
    setLogoUploading(false)
  }

  // ── Moodboard upload ──────────────────────────────────────────────────────
  async function handleMoodUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !userId) return
    setMoodUploading(true)
    const supabase = createClient()
    const newItems: MoodboardItem[] = []
    for (const file of files) {
      const path = `brands/${userId}/moodboard/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('UGC Fire').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('UGC Fire').getPublicUrl(path)
        const type = file.type.startsWith('video') ? 'video' : 'image'
        newItems.push({ id: `${Date.now()}_${Math.random()}`, type, url: data.publicUrl, filename: file.name, label: 'I like the style', note: '' })
      }
    }
    setPro(p => ({ ...p, moodboard_items: [...(p.moodboard_items ?? []), ...newItems] }))
    setMoodUploading(false)
    if (e.target) e.target.value = ''
  }

  function addMoodLink() {
    if (!newLinkUrl.trim()) return
    const item: MoodboardItem = { id: `${Date.now()}_${Math.random()}`, type: 'link', url: newLinkUrl.trim(), label: 'I like the style', note: newLinkNote.trim() }
    setPro(p => ({ ...p, moodboard_items: [...(p.moodboard_items ?? []), item] }))
    setNewLinkUrl('')
    setNewLinkNote('')
  }

  function updateMoodItem(id: string, patch: Partial<MoodboardItem>) {
    setPro(p => ({ ...p, moodboard_items: (p.moodboard_items ?? []).map(m => m.id === id ? { ...m, ...patch } : m) }))
  }

  function removeMoodItem(id: string) {
    setPro(p => ({ ...p, moodboard_items: (p.moodboard_items ?? []).filter(m => m.id !== id) }))
  }

  function toggleFormat(f: string) {
    setPro(p => ({
      ...p,
      content_formats: (p.content_formats ?? []).includes(f)
        ? (p.content_formats ?? []).filter(x => x !== f)
        : [...(p.content_formats ?? []), f],
    }))
  }

  // ── Confidence badge ──────────────────────────────────────────────────────
  const confColor = context.confidenceLabel === 'High' ? 'text-green-400' : context.confidenceLabel === 'Medium' ? 'text-yellow-400' : 'text-white/40'

  if (loading) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Your Brand</h1>
        <p className="text-white/40 text-sm mt-1">Set up your brand so Strategy AI can create better UGC commercial ideas.</p>
        <p className="text-white/30 text-xs mt-1">Start with Basic in 5 minutes. Add Pro details anytime for better commercial ideas.</p>
      </div>

      {/* Brand Context card */}
      <div className="bg-[#111] border border-white/10 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/40">Setup Level:</span>
            <span className="font-semibold text-white">{context.setupLevel}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">Brand Completion:</span>
            <span className="font-semibold text-white">{context.completionPercentage}%</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">Strategy Confidence:</span>
            <span className={`font-semibold ${confColor}`}>{context.confidenceLabel}</span>
          </div>
          <div className="h-1.5 bg-white/6 rounded-full overflow-hidden max-w-xs">
            <div className="h-full rounded-full bg-[#FF3B1A] transition-all" style={{ width: `${context.completionPercentage}%` }} />
          </div>
          <p className="text-white/30 text-xs">Strategy AI can run anytime. The more details you add, the better the ideas get.</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/25' : 'border border-white/12 text-white/60 hover:text-white hover:border-white/25'}`}
          >
            {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : 'Save Brand'}
          </button>
          <button
            type="button"
            onClick={saveAndGenerate}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white rounded-lg transition"
          >
            <Sparkles size={13} /> Generate Commercial Ideas
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 w-fit">
        {(['basic', 'pro'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-[#FF3B1A] text-white' : 'text-white/45 hover:text-white'}`}
          >
            {t === 'basic' ? 'Basic Setup' : 'Pro Setup'}
          </button>
        ))}
      </div>

      {/* ── BASIC TAB ────────────────────────────────────────────────────────── */}
      {tab === 'basic' && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold text-sm">Basic Setup</p>
            <p className="text-white/35 text-xs mt-0.5">Start in 5 minutes. Give Strategy AI enough context to create your first UGC commercial ideas.</p>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-xl p-5 space-y-4">

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Business Name</label>
                <input className={ic} value={basic.company_name} onChange={e => setBasic(b => ({ ...b, company_name: e.target.value }))} placeholder="Your brand or company name" />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Website</label>
                <input className={ic} value={basic.website} onChange={e => setBasic(b => ({ ...b, website: e.target.value }))} placeholder="https://yourbrand.com" />
              </div>
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">What do you sell?</label>
              <textarea className={tc} rows={3} value={basic.offer} onChange={e => setBasic(b => ({ ...b, offer: e.target.value }))} placeholder="Example: A bold flavored chip brand, skincare product, local restaurant, fitness program, hot sauce, clothing brand, or service." />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">Who is your customer?</label>
              <textarea className={tc} rows={3} value={basic.target_customer} onChange={e => setBasic(b => ({ ...b, target_customer: e.target.value }))} placeholder="Example: Busy moms, college students, snack lovers, skincare buyers, local homeowners, ecommerce shoppers." />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5">Main Goal</label>
              <select className={ic} value={basic.main_goal} onChange={e => setBasic(b => ({ ...b, main_goal: e.target.value }))}>
                <option value="">Select a goal…</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Logo / product photo upload */}
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Upload product or logo photo</label>
              {basic.logo_url ? (
                <div className="flex items-center gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={basic.logo_url} alt="Logo" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  <p className="text-white/50 text-xs flex-1 truncate">{basic.logo_url}</p>
                  <button type="button" onClick={() => setBasic(b => ({ ...b, logo_url: '' }))}><X size={14} className="text-white/30 hover:text-white" /></button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading || !userId}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-white/15 hover:border-[#FF3B1A]/50 text-white/40 hover:text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  {logoUploading ? <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
                  {logoUploading ? 'Uploading…' : userId ? 'Click to upload photo or logo' : 'Sign in to upload'}
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            {/* Content inspiration */}
            <div>
              <label className="block text-white/50 text-xs mb-1.5">Content Inspiration</label>
              <p className="text-white/25 text-[11px] mb-2">Uploads work best. Add screenshots, videos, product photos, or links to content you like.</p>
              <textarea className={tc} rows={3} value={basic.content_inspiration_links} onChange={e => setBasic(b => ({ ...b, content_inspiration_links: e.target.value }))} placeholder="Paste links to content you like, or describe what style you want. No TikTok account? No problem — Strategy AI can still build ideas from your product and audience." />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/25' : 'bg-[#FF3B1A] hover:bg-[#e02e10] text-white disabled:opacity-60'}`}>
              {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : <><CheckCircle size={13} /> Save Basic Setup</>}
            </button>
            <button type="button" onClick={saveAndGenerate}
              className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#FF3B1A]/40 text-[#FF3B1A] hover:bg-[#FF3B1A] hover:text-white transition">
              <Sparkles size={13} /> Generate Commercial Ideas
            </button>
          </div>
          <p className="text-white/25 text-xs">Start here. Add Pro details later if you want better ideas.</p>
        </div>
      )}

      {/* ── PRO TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'pro' && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold text-sm">Pro Setup</p>
            <p className="text-white/35 text-xs mt-0.5">Add deeper brand, product, audience, and creative direction so Strategy AI can create more accurate UGC commercial ideas.</p>
          </div>

          {/* Section A: Brand Profile */}
          <SectionCard title="Brand Profile" subtitle="Tell us how your brand should sound and feel.">
            <div className="mt-2 space-y-3">
              {[
                ['Brand Voice', 'brand_voice', 'Bold, fun, direct, playful, premium, conversational…'],
                ['Brand Colors', 'brand_colors', 'Primary: orange. Secondary: black, white…'],
                ['Tagline', 'tagline', 'Your brand tagline or slogan'],
                ['Words to Use', 'words_to_use', 'Words or phrases that feel on-brand'],
                ['Words to Avoid', 'words_to_avoid', 'Words or phrases that feel off-brand'],
                ['Additional Brand Notes', 'additional_brand_notes', 'Anything else about how the brand should feel'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="block text-white/40 text-xs mb-1">{label}</label>
                  <textarea className={tc} rows={2} value={(pro[key as keyof ExtendedBrandNotes] ?? '') as string} onChange={e => setPro(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section B: Product & Offer */}
          <SectionCard title="Product & Offer" subtitle="Help Strategy AI understand why someone would buy.">
            <div className="mt-2 space-y-3">
              {[
                ['Main Product', 'main_product', 'Your primary product or service'],
                ['Main Offer', 'main_offer', 'The specific offer, deal, or package'],
                ['Top Benefits', 'top_benefits', 'What does the customer get? What changes?'],
                ['Top 3 Selling Points', 'top_selling_points', '1. High protein\n2. Bold flavor\n3. No artificial ingredients'],
                ['Price Range', 'price_range', '$12–$18 per bag, $45 bundle…'],
                ['Product Links', 'product_links', 'Links to product pages, listings, or store'],
                ['Bundles or Promotions', 'bundles_promotions', 'Any current deals or bundles running'],
                ['Reviews or Testimonials', 'reviews_testimonials', 'Paste key reviews, ratings, or customer quotes'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="block text-white/40 text-xs mb-1">{label}</label>
                  <textarea className={tc} rows={2} value={(pro[key as keyof ExtendedBrandNotes] ?? '') as string} onChange={e => setPro(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section C: Audience */}
          <SectionCard title="Audience" subtitle="Who buys, why they buy, and when they use it.">
            <div className="mt-2 space-y-3">
              {[
                ['Ideal Customer', 'ideal_customer', 'Snack lovers, college students, gym-goers, busy parents…'],
                ['Pain Points', 'pain_points', 'What problem does this solve? What do they struggle with?'],
                ['Desires', 'desires', 'What do they want? What does success look like to them?'],
                ['Buying Triggers', 'buying_triggers', 'What makes them buy? Hunger, boredom, health goals, taste…'],
                ['Objections', 'objections', 'Why might they hesitate? Price, ingredients, competitors…'],
                ['Situations Where They Use the Product', 'use_situations', 'Example: movie night, road trip, lunch break, game day, morning routine, office snack, family dinner, gym bag, weekend trip.'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="block text-white/40 text-xs mb-1">{label}</label>
                  <textarea className={tc} rows={2} value={(pro[key as keyof ExtendedBrandNotes] ?? '') as string} onChange={e => setPro(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section D: Creative Direction */}
          <SectionCard title="Creative Direction" subtitle="Show us what your content should look and feel like.">
            <div className="mt-2 space-y-4">
              {[
                ['Content Style Feel', 'style_feel', 'Authentic, raw, premium, lifestyle, fast-paced, calm, sensory…'],
                ['Creator Type', 'creator_type', 'Young adults, parents, gamers, foodies, fitness people…'],
                ['Locations', 'locations', 'Kitchen, outdoors, gym, bedroom, office, car, park…'],
                ['Visual Style', 'visual_style', 'iPhone-style, cinematic, bright/clean, dark/moody, ASMR close-up…'],
                ['Examples They Like', 'examples_like', 'Links or descriptions of content they love'],
                ['Examples They Do Not Like', 'examples_dislike', 'Links or descriptions of content to avoid'],
                ['Competitor Inspiration', 'competitor_inspiration', 'Competitors or brands with good UGC content'],
                ['Claims to Avoid', 'claims_to_avoid', 'Claims we cannot or should not make'],
                ['Compliance Notes', 'compliance_notes', 'Any legal, medical, or compliance restrictions'],
                ['Do / Don\'t Notes', 'do_dont_notes', 'Specific do\'s and don\'ts for this brand'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="block text-white/40 text-xs mb-1">{label}</label>
                  <textarea className={tc} rows={2} value={(pro[key as keyof ExtendedBrandNotes] ?? '') as string} onChange={e => setPro(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}

              {/* Content format checkboxes */}
              <div>
                <label className="block text-white/40 text-xs mb-2">Content Formats</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_FORMATS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFormat(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        (pro.content_formats ?? []).includes(f)
                          ? 'bg-[#FF3B1A]/18 border-[#FF3B1A]/50 text-white'
                          : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section E: Brand Moodboard */}
          <SectionCard title="Brand Moodboard" subtitle="Upload images, videos, screenshots, ads, and examples that show the style you want.">
            <div className="mt-2 space-y-4">
              <p className="text-white/25 text-xs">Uploads work best. Links are helpful, but screenshots and videos give Strategy AI better creative direction.</p>

              {/* Upload button */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => moodInputRef.current?.click()}
                  disabled={moodUploading || !userId}
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-white/15 hover:border-[#FF3B1A]/50 text-white/40 hover:text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  {moodUploading ? <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
                  {moodUploading ? 'Uploading…' : userId ? 'Upload photos, videos, or screenshots' : 'Sign in to upload'}
                </button>
                <input ref={moodInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMoodUpload} />
              </div>

              {/* Add link */}
              <div className="space-y-2">
                <label className="block text-white/40 text-xs">Add Example Link</label>
                <div className="flex gap-2">
                  <input className={ic + ' flex-1'} value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://… (TikTok, Instagram, YouTube, etc.)" onKeyDown={e => e.key === 'Enter' && addMoodLink()} />
                  <button type="button" onClick={addMoodLink} className="px-3 py-2 bg-[#FF3B1A] text-white rounded-lg hover:bg-[#e02e10] transition shrink-0">
                    <LinkIcon size={14} />
                  </button>
                </div>
                <input className={ic} value={newLinkNote} onChange={e => setNewLinkNote(e.target.value)} placeholder="Why did you add this? (optional)" />
              </div>

              {/* Moodboard items grid */}
              {(pro.moodboard_items ?? []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(pro.moodboard_items ?? []).map(item => (
                    <div key={item.id} className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          {item.type === 'image' ? <ImageIcon size={14} className="text-white/30" /> :
                           item.type === 'video' ? <Video size={14} className="text-white/30" /> :
                           <LinkIcon size={14} className="text-white/30" />}
                        </div>
                        <p className="text-white/60 text-xs flex-1 break-all line-clamp-2">{item.filename ?? item.url}</p>
                        <button type="button" onClick={() => removeMoodItem(item.id)} className="shrink-0">
                          <Trash2 size={12} className="text-white/25 hover:text-red-400 transition" />
                        </button>
                      </div>
                      {item.type === 'image' && item.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                      )}
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 text-xs focus:outline-none focus:border-[#FF3B1A]"
                        value={item.label}
                        onChange={e => updateMoodItem(item.id, { label: e.target.value })}
                      >
                        {MOODBOARD_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/55 text-xs focus:outline-none focus:border-[#FF3B1A] placeholder:text-white/20"
                        value={item.note ?? ''}
                        onChange={e => updateMoodItem(item.id, { note: e.target.value })}
                        placeholder="Why did you add this? (optional)"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(pro.moodboard_items ?? []).length === 0 && (
                <div className="flex flex-col items-center py-8 text-center space-y-2">
                  <FileText size={24} className="text-white/15" />
                  <p className="text-white/25 text-xs">No moodboard items yet. Upload photos, videos, or add links above.</p>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/25' : 'bg-[#FF3B1A] hover:bg-[#e02e10] text-white disabled:opacity-60'}`}>
              {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : <><CheckCircle size={13} /> Save Pro Setup</>}
            </button>
            <button type="button" onClick={saveAndGenerate}
              className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#FF3B1A]/40 text-[#FF3B1A] hover:bg-[#FF3B1A] hover:text-white transition">
              <Sparkles size={13} /> Generate Commercial Ideas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
