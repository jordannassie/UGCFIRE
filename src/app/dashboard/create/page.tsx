'use client'

import { useState } from 'react'
import {
  Video, Image as ImageIcon, Wand2, Repeat2, Type, FileText,
  Copy, Check, Send, ChevronRight, Sparkles, ArrowRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type CreationType = 'ugc_script' | 'product_photo' | 'video_prompt' | 'ad_variations' | 'caption' | 'brief'

interface FormState {
  product: string
  platform: string
  audience: string
  tone: string
  goal: string
  notes: string
}

interface GeneratedOutput {
  hook: string
  script: string
  caption: string
  videoPrompt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CREATION_TYPES = [
  {
    id: 'ugc_script' as CreationType,
    label: 'UGC Video Script',
    description: 'Generate hooks, scripts, captions, and shot ideas.',
    icon: Video,
  },
  {
    id: 'product_photo' as CreationType,
    label: 'Product Photo Ad',
    description: 'Create lifestyle product photo concepts and ad directions.',
    icon: ImageIcon,
  },
  {
    id: 'video_prompt' as CreationType,
    label: 'Video Ad Prompt',
    description: 'Build prompts for AI video tools and UGC-style scenes.',
    icon: Wand2,
  },
  {
    id: 'ad_variations' as CreationType,
    label: 'Ad Variations',
    description: 'Turn one winning idea into multiple new angles.',
    icon: Repeat2,
  },
  {
    id: 'caption' as CreationType,
    label: 'Social Caption',
    description: 'Write platform-ready captions for TikTok, Instagram, Facebook, and YouTube.',
    icon: Type,
  },
  {
    id: 'brief' as CreationType,
    label: 'Creative Brief',
    description: 'Send a request to the UGC Fire team to make it for you.',
    icon: FileText,
  },
]

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube Shorts', 'Meta Ads']
const TONES     = ['Authentic', 'Bold', 'Funny', 'Premium', 'Educational', 'Direct Response']
const GOALS     = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Retargeting']

// ─── Mock generation ──────────────────────────────────────────────────────────

function generateOutput(type: CreationType, f: FormState): GeneratedOutput {
  const p = f.product || 'your product'
  const tone = f.tone || 'Authentic'
  const platform = f.platform || 'TikTok'
  const goal = f.goal || 'Sales'

  const data: Record<CreationType, GeneratedOutput> = {
    ugc_script: {
      hook: `POV: I tried ${p} for 30 days and this is what actually happened…`,
      script: `[HOOK — 0:00–0:03]\n"I can't believe I waited this long to try ${p}."\n\n[BODY — 0:03–0:22]\nShow the product in real use. Walk through 3 key benefits naturally — don't pitch, share. Keep energy ${tone.toLowerCase()}.\n\nBenefit 1: [First win]\nBenefit 2: [Second win]\nBenefit 3: [The one they didn't expect]\n\n[CTA — 0:22–0:30]\n"Link in bio. First order ships free. Don't sleep on this."`,
      caption: `I wasn't going to post this but I genuinely can't stop using ${p}.\n\nIf you know, you know. Link in bio.\n\n#ugc #${p.replace(/\s+/g, '').toLowerCase()} #${platform.toLowerCase()}`,
      videoPrompt: `"Create a 30-second UGC-style ${platform} script for ${p}. ${tone} tone. Hook within the first 2 seconds. Conversational, no emojis. End with a clear CTA driving ${goal.toLowerCase()}."`,
    },
    product_photo: {
      hook: `This is why ${p} is all over your feed right now.`,
      script: `SHOT 1 — Flat lay\nClean surface (white marble or wood). Natural side light. Product centered. No clutter.\n\nSHOT 2 — Lifestyle context\n${p} in real use. Authentic setting, not staged. Warm tones.\n\nSHOT 3 — Detail close-up\nSoft bokeh background. Focus on texture, label, or key feature.\n\nCOLOR DIRECTION: Match brand palette. Avoid heavy presets. Keep it real.`,
      caption: `Clean. Simple. The kind of product that doesn't need much explaining.\n\n${p} — shop now, link in bio.\n\n#productphotography #${platform.toLowerCase()}`,
      videoPrompt: `"Generate a product photography direction for ${p}. Minimal background, natural light, lifestyle context. Style: modern editorial. Format optimized for ${platform} feed ads."`,
    },
    video_prompt: {
      hook: `[OPEN] Close-up of ${p} on a clean surface. Slow reveal.`,
      script: `[SCENE 1 — 0:00–0:04]\nDrone pull-back from product. Warm cinematic grade. No audio yet.\n\n[SCENE 2 — 0:04–0:10]\nHand interaction in slow motion (1.5x). Extreme close-up of key feature.\n\n[SCENE 3 — 0:10–0:20]\nLifestyle cut. Real person using ${p} in a natural environment.\n\n[SCENE 4 — 0:20–0:25]\nProduct hero shot. Text overlay: "${p} — built for real life."\n\n[SCENE 5 — 0:25–0:30]\nFade to brand color. Logo. CTA.`,
      caption: `Shot on a budget. Looks like a brand film. ${p} x AI video.\n\n#aiads #videoad #${platform.toLowerCase()}`,
      videoPrompt: `"Cinematic ${platform} video ad for ${p}. ${tone} tone. 30-second format. Camera movements: pull-back, close-up, lifestyle cut. Lighting: warm and natural. Pacing: fast-cut with pause on hero shot. Goal: ${goal.toLowerCase()}."`,
    },
    ad_variations: {
      hook: `Which angle wins? 4 versions. One product.`,
      script: `ANGLE 1 — Pain Point\n"Tired of wasting money on products that don't actually work? ${p} is built different."\n\nANGLE 2 — Social Proof\n"10,000 customers switched to ${p} in the last 90 days. Here's why."\n\nANGLE 3 — Curiosity\n"What nobody tells you about ${p}... (this surprised us too)"\n\nANGLE 4 — Urgency\n"48 hours left to try ${p} at this price. After that, it's gone."`,
      caption: `Run all 4. Let the data pick the winner. That's how you scale.\n\n${p} ad variations ready to test.\n\n#metaads #${platform.toLowerCase()} #adcreative`,
      videoPrompt: `"Create 4 short-form ad variations for ${p} targeting ${goal.toLowerCase()} on ${platform}. Each uses a different emotional trigger: pain, proof, curiosity, urgency. ${tone} tone throughout."`,
    },
    caption: {
      hook: `Nobody's talking about what ${p} actually does for your daily routine.`,
      script: `VERSION 1 — Value hook\n"${p} is quietly becoming the go-to for people serious about results.\n\nHere's what makes it different:\n— [Benefit 1]\n— [Benefit 2]\n— [Benefit 3]\n\nComment 'INFO' and I'll DM you the link."\n\nVERSION 2 — Story\n"I've tried everything. Then I found ${p}.\n\nI'm not going back."\n\nVERSION 3 — Direct\n"${p}. Buy it. Thank me later.\n\nLink in bio."`,
      caption: `Save this. Paste your own product name. Post it. Watch what happens.\n\n#caption #contentcreator #${platform.toLowerCase()}`,
      videoPrompt: `"Write 3 platform-native captions for ${p} on ${platform}. ${tone} tone. Goal: ${goal.toLowerCase()}. Under 150 characters each. Include a CTA. No hashtag spam."`,
    },
    brief: {
      hook: `Creative request ready to send to the UGC Fire team.`,
      script: `PROJECT BRIEF\n\nProduct: ${p}\nPlatform: ${platform}\nGoal: ${goal}\nTone: ${tone}\nTarget Audience: ${f.audience || 'Your ideal customer'}\n\nCREATIVE DIRECTION:\nWe need 1 UGC-style video (30–60 seconds) featuring ${p} in everyday use. ${tone} energy. Should feel native to ${platform} — not produced, not scripted-looking.\n\nDELIVERABLES:\n- 1 raw cut\n- 1 edited version with captions\n- 1 thumbnail/cover frame\n\nNOTES:\n${f.notes || 'No additional notes.'}\n\nPRIORITY: High\nDEADLINE: Open`,
      caption: `Brief sent to the UGC Fire team. You'll hear back within 48 hours.\n\n#ugcfire #contentcreation #${platform.toLowerCase()}`,
      videoPrompt: `"Write a complete creative brief for a UGC video about ${p} on ${platform}. Include: objective, audience, tone, key messages, deliverables, success metrics, and timeline."`,
    },
  }

  return data[type]
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Output card ─────────────────────────────────────────────────────────────

function OutputCard({
  label, content, onSave,
}: { label: string; content: string; onSave: () => void }) {
  return (
    <div className="bg-[#111] border border-white/8 rounded-xl p-4 space-y-3">
      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-white/85 text-xs leading-relaxed whitespace-pre-wrap">{content}</p>
      <div className="flex items-center gap-2 pt-1">
        <CopyButton text={content} />
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-[#FF3B1A]/12 hover:bg-[#FF3B1A]/20 text-[#FF3B1A] transition"
        >
          <Check size={11} />
          Save to Studio
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [selectedType, setSelectedType] = useState<CreationType | null>(null)
  const [form, setForm] = useState<FormState>({
    product: '', platform: 'TikTok', audience: '', tone: 'Authentic', goal: 'Sales', notes: '',
  })
  const [output, setOutput]           = useState<GeneratedOutput | null>(null)
  const [generating, setGenerating]   = useState(false)
  const [teamToast, setTeamToast]     = useState(false)
  const [saveToast, setSaveToast]     = useState('')

  function setField(k: keyof FormState, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setOutput(null)
  }

  async function generate() {
    if (!selectedType) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1100))
    setOutput(generateOutput(selectedType, form))
    setGenerating(false)
  }

  function showSaveToast(label: string) {
    setSaveToast(`"${label}" saved to Studio.`)
    setTimeout(() => setSaveToast(''), 3000)
  }

  function sendToTeam() {
    setTeamToast(true)
    setTimeout(() => setTeamToast(false), 3500)
  }

  const selected = CREATION_TYPES.find(t => t.id === selectedType)

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Toast notifications */}
      {(saveToast || teamToast) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] border border-white/15 text-white text-sm px-5 py-3 rounded-xl shadow-xl pointer-events-none">
          {teamToast ? 'Creative request sent to your UGC Fire team.' : saveToast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Create</h1>
        <p className="text-white/40 text-sm mt-1">
          Create your own ads, scripts, prompts, and content ideas inside your UGC Fire Studio.
        </p>
      </div>

      {/* Team callout */}
      <div className="flex items-start gap-3 bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl px-4 py-3">
        <Sparkles size={15} className="text-[#FF3B1A] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm">
            Need us to make it for you?{' '}
            <span className="text-white/50">Send the idea to the UGC Fire team and we'll turn it into content.</span>
          </p>
        </div>
        <button onClick={sendToTeam} className="shrink-0 flex items-center gap-1.5 text-[#FF3B1A] text-xs font-semibold hover:underline whitespace-nowrap">
          Send idea <ArrowRight size={12} />
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-[#111] border border-white/8 rounded-2xl px-6 py-5">
        <h2 className="text-white font-bold text-lg">What do you want to create?</h2>
        <p className="text-white/40 text-sm mt-1">
          Generate ad ideas, UGC scripts, captions, video prompts, and creative briefs for your brand.
        </p>

        {/* Creation type grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {CREATION_TYPES.map(ct => {
            const Icon = ct.icon
            const active = selectedType === ct.id
            return (
              <button
                key={ct.id}
                onClick={() => { setSelectedType(ct.id); setOutput(null) }}
                className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                  active
                    ? 'bg-[#FF3B1A]/12 border-[#FF3B1A]/40 ring-1 ring-[#FF3B1A]/20'
                    : 'bg-white/3 border-white/8 hover:border-white/18 hover:bg-white/5'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${active ? 'bg-[#FF3B1A]/20' : 'bg-white/8'}`}>
                  <Icon size={16} className={active ? 'text-[#FF3B1A]' : 'text-white/50'} />
                </div>
                <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-white/70'}`}>{ct.label}</p>
                <p className="text-white/35 text-xs mt-1 leading-snug">{ct.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Creation form — shown when type selected */}
      {selectedType && (
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
            {selected && <selected.icon size={15} className="text-[#FF3B1A]" />}
            <p className="text-white font-semibold text-sm">{selected?.label}</p>
            <ChevronRight size={13} className="text-white/25 mx-0.5" />
            <p className="text-white/40 text-sm">Fill in the details</p>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs mb-1.5 block">Product or Offer</label>
              <input
                value={form.product}
                onChange={e => setField('product', e.target.value)}
                placeholder="e.g. Hydrating Face Serum, Online Coaching Program, SaaS Tool..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] transition"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Platform</label>
              <select
                value={form.platform}
                onChange={e => setField('platform', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] transition"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Audience</label>
              <input
                value={form.audience}
                onChange={e => setField('audience', e.target.value)}
                placeholder="e.g. Women 25–40, fitness enthusiasts..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] transition"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Tone</label>
              <select
                value={form.tone}
                onChange={e => setField('tone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] transition"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Goal</label>
              <select
                value={form.goal}
                onChange={e => setField('goal', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] transition"
              >
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs mb-1.5 block">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Any specific angle, competitor reference, offer details, or style notes..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={generate}
                disabled={generating || !form.product.trim()}
                className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  : <><Wand2 size={15} /> Generate Creative</>
                }
              </button>

              <button
                onClick={sendToTeam}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white px-5 py-2.5 rounded-lg text-sm transition"
              >
                <Send size={14} />
                Ask UGC Fire Team To Create This
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated output */}
      {output && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Generated Output</p>
            <span className="text-white/25 text-xs">· {selected?.label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OutputCard label="Hook" content={output.hook} onSave={() => showSaveToast('Hook')} />
            <OutputCard label="Script" content={output.script} onSave={() => showSaveToast('Script')} />
            <OutputCard label="Caption" content={output.caption} onSave={() => showSaveToast('Caption')} />
            <OutputCard label="Video Prompt" content={output.videoPrompt} onSave={() => showSaveToast('Video Prompt')} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={generate}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white px-4 py-2.5 rounded-lg text-sm transition"
            >
              <Wand2 size={13} />
              Regenerate
            </button>
            <button
              onClick={sendToTeam}
              className="flex items-center gap-2 bg-[#FF3B1A]/12 hover:bg-[#FF3B1A]/20 text-[#FF3B1A] px-4 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              <Send size={13} />
              Ask UGC Fire Team To Create This
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
