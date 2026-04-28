'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Save, Check, Sparkles, ArrowRight, Globe, Target, Users, Mic, BarChart2, Link2 } from 'lucide-react'

const BRAIN_KEY = 'ugcfire_brand_brain'

interface BrandBrain {
  businessName: string
  websiteUrl: string
  category: string
  offer: string
  targetCustomer: string
  brandVoice: string
  primaryGoal: string
  competitorUrls: string
  socialLinks: string
  notes: string
}

const EMPTY: BrandBrain = {
  businessName: '',
  websiteUrl: '',
  category: '',
  offer: '',
  targetCustomer: '',
  brandVoice: '',
  primaryGoal: 'leads',
  competitorUrls: '',
  socialLinks: '',
  notes: '',
}

const GOAL_OPTIONS = [
  { value: 'leads',        label: 'Generate Leads',      desc: 'Drive inbound inquiries and sign-ups' },
  { value: 'sales',        label: 'Drive Sales',         desc: 'Direct-response content that converts' },
  { value: 'appointments', label: 'Book Appointments',   desc: 'Get people booked on the calendar' },
  { value: 'awareness',    label: 'Build Awareness',     desc: 'Grow brand presence and reach' },
]

const VOICE_OPTIONS = [
  'Professional & authoritative',
  'Friendly & relatable',
  'Bold & direct',
  'Educational & informative',
  'Casual & conversational',
  'Inspirational & motivational',
  'Witty & entertaining',
]

export default function BrandBrainPage() {
  const router = useRouter()
  const [form, setForm] = useState<BrandBrain>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRAIN_KEY)
      if (stored) {
        setForm({ ...EMPTY, ...JSON.parse(stored) })
        setHasExisting(true)
      }
    } catch {}
  }, [])

  function set(key: keyof BrandBrain, value: string) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function save() {
    localStorage.setItem(BRAIN_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setHasExisting(true)
  }

  function saveAndRun() {
    localStorage.setItem(BRAIN_KEY, JSON.stringify(form))
    router.push('/dashboard/strategy-ai')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none'
  const labelCls = 'block text-white/55 text-xs font-semibold mb-1.5 uppercase tracking-wide'
  const hintCls  = 'text-white/25 text-[10px] mt-1'

  return (
    <div className="max-w-2xl space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={18} className="text-[#FF3B1A]" />
            <h1 className="text-2xl font-bold text-white">Brand Brain</h1>
          </div>
          <p className="text-white/40 text-sm">
            Tell Strategy AI about your business. The more detail you give, the sharper your strategy.
          </p>
        </div>
        {hasExisting && (
          <button
            onClick={() => router.push('/dashboard/strategy-ai')}
            className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm transition"
          >
            Back to Strategy AI <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Form sections */}
      <div className="space-y-6">

        {/* Business basics */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Business Basics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Business Name</label>
              <input
                value={form.businessName}
                onChange={e => set('businessName', e.target.value)}
                placeholder="e.g. Apex Fitness Co."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Website URL</label>
              <input
                value={form.websiteUrl}
                onChange={e => set('websiteUrl', e.target.value)}
                placeholder="https://yourbusiness.com"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Business Category</label>
            <input
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Fitness coaching, SaaS, E-commerce, Real estate, Skincare…"
              className={inputCls}
            />
            <p className={hintCls}>Be specific — "online fitness coaching for busy moms" beats "fitness".</p>
          </div>

          <div>
            <label className={labelCls}>Main Offer</label>
            <input
              value={form.offer}
              onChange={e => set('offer', e.target.value)}
              placeholder="e.g. 12-week transformation program, Monthly retainer, Product subscription…"
              className={inputCls}
            />
            <p className={hintCls}>What is the primary thing you sell or offer?</p>
          </div>
        </div>

        {/* Audience & Voice */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Audience & Voice</p>
          </div>

          <div>
            <label className={labelCls}>Target Customer</label>
            <textarea
              value={form.targetCustomer}
              onChange={e => set('targetCustomer', e.target.value)}
              placeholder="e.g. Women 28–45 who want to lose weight without giving up their social life. Busy, skeptical of diets, follow lifestyle influencers on Instagram."
              rows={3}
              className={inputCls}
            />
            <p className={hintCls}>The more specific you are, the better the hooks and scripts will perform.</p>
          </div>

          <div>
            <label className={labelCls}>Brand Voice</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_OPTIONS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('brandVoice', v)}
                  className={`text-left px-3 py-2 rounded-lg text-xs border transition ${
                    form.brandVoice === v
                      ? 'border-[#FF3B1A] bg-[#FF3B1A]/10 text-white'
                      : 'border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              value={VOICE_OPTIONS.includes(form.brandVoice) ? '' : form.brandVoice}
              onChange={e => set('brandVoice', e.target.value)}
              placeholder="Or describe your own voice…"
              className={`${inputCls} mt-2`}
            />
          </div>
        </div>

        {/* Primary Goal */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Primary Goal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => set('primaryGoal', g.value)}
                className={`text-left px-4 py-3 rounded-xl border transition ${
                  form.primaryGoal === g.value
                    ? 'border-[#FF3B1A] bg-[#FF3B1A]/10'
                    : 'border-white/8 bg-white/3 hover:border-white/20'
                }`}
              >
                <p className={`text-sm font-semibold ${form.primaryGoal === g.value ? 'text-white' : 'text-white/70'}`}>{g.label}</p>
                <p className="text-white/35 text-[11px] mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Competitors & Social */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Competitors & Social</p>
          </div>

          <div>
            <label className={labelCls}>Competitor URLs or Handles</label>
            <textarea
              value={form.competitorUrls}
              onChange={e => set('competitorUrls', e.target.value)}
              placeholder="e.g. @competitorhandle, https://competitor.com (one per line)"
              rows={3}
              className={inputCls}
            />
            <p className={hintCls}>Strategy AI will use these to identify content gaps and differentiation opportunities.</p>
          </div>

          <div>
            <label className={labelCls}>Your Social Links</label>
            <textarea
              value={form.socialLinks}
              onChange={e => set('socialLinks', e.target.value)}
              placeholder="e.g. @yourtiktok, https://instagram.com/yourbrand (one per line)"
              rows={2}
              className={inputCls}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Additional Notes</p>
          </div>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Anything else Strategy AI should know? Seasonal events, upcoming launches, content restrictions, past ads that worked or flopped…"
            rows={4}
            className={inputCls}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            {saved ? <><Check size={14} className="text-green-400" /> Saved</> : <><Save size={14} /> Save Brand Brain</>}
          </button>
          <button
            onClick={saveAndRun}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            <Sparkles size={14} /> Save & Run Strategy AI
          </button>
        </div>

        <p className="text-white/20 text-xs">
          Brand Brain is saved locally in your browser. Cloud sync coming in a future update.
        </p>
      </div>
    </div>
  )
}
