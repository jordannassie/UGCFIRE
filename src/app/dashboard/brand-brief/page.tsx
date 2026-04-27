'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, BrandBrief } from '@/lib/types'
import { FileText, CheckCircle, Globe, Target, Mic, Image, Video, Link as LinkIcon, MessageSquare, Folder, Edit3 } from 'lucide-react'

const CONTENT_STYLE_OPTIONS = [
  'Founder Talking Head',
  'Lifestyle B-Roll',
  'Before/After',
  'Product Demo',
  'Testimonial',
  'Tutorial',
  'ASMR/Process',
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function inputClass() {
  return 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none'
}

function textareaClass() {
  return 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none'
}

export default function BrandBriefPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [existingBrief, setExistingBrief] = useState<BrandBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    website: '',
    offer: '',
    target_customer: '',
    brand_voice: '',
    preferred_styles: [] as string[],
    video_styles: '',
    photo_styles: '',
    example_video_links: '',
    example_photo_links: '',
    notes: '',
    assets_url: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      if (co) {
        const { data: brief } = await supabase
          .from('brand_briefs')
          .select('*')
          .eq('company_id', co.id)
          .single()

        if (brief) {
          setExistingBrief(brief as BrandBrief)
        } else {
          setForm(f => ({ ...f, company_name: co.name, website: co.website ?? '' }))
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function field(key: keyof typeof form) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  function toggleStyle(style: string) {
    setForm(f => ({
      ...f,
      preferred_styles: f.preferred_styles.includes(style)
        ? f.preferred_styles.filter(s => s !== style)
        : [...f.preferred_styles, style],
    }))
  }

  function startEdit() {
    if (existingBrief) {
      // Parse styles from notes if stored
      const notes = existingBrief.notes ?? ''
      const stylesMatch = notes.match(/Preferred content styles: ([^\n]+)/)
      const parsedStyles = stylesMatch ? stylesMatch[1].split(', ') : []

      setForm({
        company_name: existingBrief.company_name,
        website: existingBrief.website ?? '',
        offer: existingBrief.offer ?? '',
        target_customer: existingBrief.target_customer ?? '',
        brand_voice: existingBrief.brand_voice ?? '',
        preferred_styles: parsedStyles,
        video_styles: existingBrief.video_styles ?? '',
        photo_styles: '',
        example_video_links: existingBrief.examples ?? '',
        example_photo_links: '',
        notes: notes.replace(/\nPreferred content styles: [^\n]+\n?/, '') ?? '',
        assets_url: existingBrief.assets_url ?? '',
      })
    }
    setSaved(false)
    setEditing(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const videoStylesCombined = [form.video_styles, form.photo_styles ? `Photo styles:\n${form.photo_styles}` : ''].filter(Boolean).join('\n\n')
      const examplesCombined = [form.example_video_links, form.example_photo_links ? `Photo examples:\n${form.example_photo_links}` : ''].filter(Boolean).join('\n\n')
      const notesCombined = [
        form.preferred_styles.length > 0 ? `Preferred content styles: ${form.preferred_styles.join(', ')}` : '',
        form.notes,
      ].filter(Boolean).join('\n')

      await supabase.from('brand_briefs').upsert({
        company_id: company.id,
        company_name: form.company_name,
        website: form.website || null,
        offer: form.offer || null,
        target_customer: form.target_customer || null,
        brand_voice: form.brand_voice || null,
        video_styles: videoStylesCombined || null,
        examples: examplesCombined || null,
        notes: notesCombined || null,
        assets_url: form.assets_url || null,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

      await supabase.from('companies').update({ onboarding_status: 'completed' }).eq('id', company.id)

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: 'brand_brief_completed',
        event_message: 'Client completed the brand brief',
      })

      // Refresh
      const { data: updatedBrief } = await supabase
        .from('brand_briefs')
        .select('*')
        .eq('company_id', company.id)
        .single()
      if (updatedBrief) setExistingBrief(updatedBrief as BrandBrief)

      setSaved(true)
      setEditing(false)
    } catch {
      setSubmitting(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (existingBrief && !editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Brand Brief</h1>
            <p className="text-white/40 mt-1 text-sm">
              {existingBrief.completed_at ? `Submitted ${formatDate(existingBrief.completed_at)}` : 'Your brand profile for the UGCFire team.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {existingBrief.completed_at && (
              <span className="bg-green-500/20 text-green-300 text-sm font-bold px-4 py-1.5 rounded-full border border-green-500/20 flex items-center gap-2">
                <CheckCircle size={14} />
                Completed
              </span>
            )}
            <button
              onClick={startEdit}
              className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm flex items-center gap-2"
            >
              <Edit3 size={14} />
              Edit Brief
            </button>
          </div>
        </div>

        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle className="text-green-400" size={16} />
            <span className="text-green-400 text-sm font-medium">Brand brief saved successfully.</span>
          </div>
        )}

        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          {[
            { label: 'Company Name', icon: <FileText className="text-[#FF3B1A]" size={14} />, value: existingBrief.company_name },
            { label: 'Website', icon: <Globe className="text-[#FF3B1A]" size={14} />, value: existingBrief.website },
            { label: 'Main Offer', icon: <Target className="text-[#FF3B1A]" size={14} />, value: existingBrief.offer },
            { label: 'Target Customer', icon: <Target className="text-[#FF3B1A]" size={14} />, value: existingBrief.target_customer },
            { label: 'Brand Voice', icon: <Mic className="text-[#FF3B1A]" size={14} />, value: existingBrief.brand_voice },
            { label: 'Video / Photo Styles', icon: <Video className="text-[#FF3B1A]" size={14} />, value: existingBrief.video_styles },
            { label: 'Example Links', icon: <LinkIcon className="text-[#FF3B1A]" size={14} />, value: existingBrief.examples },
            { label: 'Assets', icon: <Folder className="text-[#FF3B1A]" size={14} />, value: existingBrief.assets_url },
            { label: 'Notes', icon: <MessageSquare className="text-[#FF3B1A]" size={14} />, value: existingBrief.notes },
          ].map(item => item.value ? (
            <div key={item.label} className="flex gap-3">
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-white text-sm whitespace-pre-wrap">{item.value}</p>
              </div>
            </div>
          ) : null)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Brand Brief</h1>
        <p className="text-white/40 mt-1 text-sm">Tell us about your brand so we can create content that converts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <FileText className="text-[#FF3B1A]" size={16} />
            <span className="text-white font-bold">Brand Info</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/60 text-sm mb-2">Company Name</label>
              <input type="text" required {...field('company_name')} className={inputClass()} />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Website</label>
              <input type="text" {...field('website')} placeholder="https://" className={inputClass()} />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">What do you sell? / Main offer</label>
            <textarea rows={3} {...field('offer')} placeholder="Describe your main product or service..." className={textareaClass()} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Target customer</label>
            <textarea rows={3} {...field('target_customer')} placeholder="Who is your ideal customer? Age, interests, pain points..." className={textareaClass()} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Brand voice</label>
            <textarea rows={2} {...field('brand_voice')} placeholder="professional, fun, bold, playful, luxury, conversational..." className={textareaClass()} />
          </div>
        </div>

        {/* Content styles */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Video className="text-[#FF3B1A]" size={16} />
            <span className="text-white font-bold">Content Styles</span>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-3">Preferred content styles <span className="text-white/30">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_STYLE_OPTIONS.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                    form.preferred_styles.includes(style)
                      ? 'bg-[#FF3B1A]/20 border-[#FF3B1A]/60 text-white'
                      : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <Video size={12} className="text-[#FF3B1A]" />
              Video style notes
            </label>
            <textarea rows={2} {...field('video_styles')} placeholder="UGC-style, cinematic, talking head, fast cuts, voiceover..." className={textareaClass()} />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <Image size={12} className="text-[#FF3B1A]" />
              Photo style notes
            </label>
            <textarea rows={2} {...field('photo_styles')} placeholder="Lifestyle, product flat lay, dark/moody, bright/clean..." className={textareaClass()} />
          </div>
        </div>

        {/* References */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <LinkIcon className="text-[#FF3B1A]" size={16} />
            <span className="text-white font-bold">References &amp; Assets</span>
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Example video links</label>
            <textarea rows={2} {...field('example_video_links')} placeholder="Links to videos you love (YouTube, TikTok, Instagram, etc.)" className={textareaClass()} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Example photo / ad links</label>
            <textarea rows={2} {...field('example_photo_links')} placeholder="Links to photos or ads you love" className={textareaClass()} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <Folder size={12} className="text-[#FF3B1A]" />
              Assets folder link <span className="text-white/30 ml-1">(Google Drive, Dropbox, etc.)</span>
            </label>
            <input type="text" {...field('assets_url')} placeholder="https://drive.google.com/..." className={inputClass()} />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-5">
            <MessageSquare className="text-[#FF3B1A]" size={16} />
            <span className="text-white font-bold">Notes for UGCFire Team</span>
          </div>
          <textarea
            rows={4}
            {...field('notes')}
            placeholder="Anything else we should know — competitors to avoid, things that don't work, special requests, brand do's and don'ts..."
            className={textareaClass()}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.company_name}
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={16} />
            {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Submit Brand Brief'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border border-white/10 text-white/60 px-6 py-3 rounded-lg hover:border-[#FF3B1A] hover:text-white transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
