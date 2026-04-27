'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, BrandBrief } from '@/lib/types'

const CONTENT_TYPE_OPTIONS = ['Videos', 'Photos', 'Both']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BrandBriefPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [existingBrief, setExistingBrief] = useState<BrandBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    website: '',
    offer: '',
    target_customer: '',
    brand_voice: '',
    content_type_needed: 'Both',
    video_styles: '',
    photo_styles: '',
    example_video_links: '',
    example_photo_links: '',
    notes: '',
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
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  function startEdit() {
    if (existingBrief) {
      setForm({
        company_name: existingBrief.company_name,
        website: existingBrief.website ?? '',
        offer: existingBrief.offer ?? '',
        target_customer: existingBrief.target_customer ?? '',
        brand_voice: existingBrief.brand_voice ?? '',
        content_type_needed: 'Both',
        video_styles: existingBrief.video_styles ?? '',
        photo_styles: '',
        example_video_links: existingBrief.examples ?? '',
        example_photo_links: '',
        notes: existingBrief.notes ?? '',
      })
    }
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

      const videoStylesCombined = [form.video_styles, form.photo_styles].filter(Boolean).join('\n\nPhoto styles:\n')
      const examplesCombined = [form.example_video_links, form.example_photo_links].filter(Boolean).join('\n\nPhoto examples:\n')
      const notesCombined = [form.content_type_needed ? `Content type needed: ${form.content_type_needed}` : '', form.notes].filter(Boolean).join('\n\n')

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

      router.push('/dashboard')
    } catch {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Brand Brief</h1>
            <p className="text-white/40 mt-1 text-sm">
              Submitted {existingBrief.completed_at ? formatDate(existingBrief.completed_at) : ''}
            </p>
          </div>
          <button
            onClick={startEdit}
            className="border border-white/10 text-white/60 px-6 py-3 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm"
          >
            Edit Brief
          </button>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          {[
            { label: 'Company Name', value: existingBrief.company_name },
            { label: 'Website', value: existingBrief.website },
            { label: 'Main Offer', value: existingBrief.offer },
            { label: 'Target Customer', value: existingBrief.target_customer },
            { label: 'Brand Voice', value: existingBrief.brand_voice },
            { label: 'Video / Photo Styles', value: existingBrief.video_styles },
            { label: 'Examples', value: existingBrief.examples },
            { label: 'Notes', value: existingBrief.notes },
          ].map(item => item.value ? (
            <div key={item.label}>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-white text-sm whitespace-pre-wrap">{item.value}</p>
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

      <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-white/60 text-sm mb-2">Company Name</label>
            <input
              type="text"
              required
              {...field('company_name')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Website</label>
            <input
              type="text"
              {...field('website')}
              placeholder="https://"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">What do you sell? / Main offer</label>
          <textarea
            rows={3}
            {...field('offer')}
            placeholder="Describe your main product or service..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Target customer</label>
          <textarea
            rows={3}
            {...field('target_customer')}
            placeholder="Who is your ideal customer? Age, interests, pain points..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Brand voice</label>
          <textarea
            rows={2}
            {...field('brand_voice')}
            placeholder="professional, fun, bold, playful, luxury, conversational..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">What type of content do you need most?</label>
          <select
            {...field('content_type_needed')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
          >
            {CONTENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Preferred video style</label>
          <textarea
            rows={2}
            {...field('video_styles')}
            placeholder="UGC-style, cinematic, talking head, fast cuts, voiceover..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Preferred photo style</label>
          <textarea
            rows={2}
            {...field('photo_styles')}
            placeholder="Lifestyle, product flat lay, dark/moody, bright/clean..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Example video links</label>
          <textarea
            rows={2}
            {...field('example_video_links')}
            placeholder="Links to videos you love (YouTube, TikTok, Instagram, etc.)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Example photo links</label>
          <textarea
            rows={2}
            {...field('example_photo_links')}
            placeholder="Links to photos or ads you love"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Notes for UGCFire team</label>
          <textarea
            rows={3}
            {...field('notes')}
            placeholder="Anything else we should know — competitors to avoid, things that don't work, special requests..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.company_name}
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : editing ? 'Save Changes' : 'Submit Brand Brief'}
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
