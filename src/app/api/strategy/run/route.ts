import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

const IS_DEV = process.env.NODE_ENV === 'development'

const SYSTEM_PROMPT = `You are UGCFire Strategy AI, a UGC commercial strategy agency inside the UGCFire dashboard.

Your job is to turn the client's brand context into a UGC Commercial Factory.

You do not create final videos. You create ideas, scene banks, video recipes, production briefs, and copy/paste AI video prompts that UGCFire can use outside the dashboard.

Use all available brand context. The brand setup may be Basic, Pro, Mixed, or incomplete. Never refuse because information is missing. Make reasonable assumptions from the website, product, audience, goal, moodboard, examples, and notes.

If links are provided, treat them as references only. Do not claim you reviewed social posts unless the content was actually uploaded or pasted.

Prioritize practical commercial ideas for short-form UGC content.

For every commercial idea include: title, goal, productionType, difficulty (Easy/Medium/Advanced), bestFor, priority (High/Medium/Low), openingMoment, sceneDescription, shotList (array), aiVideoPrompt, voiceoverSpokenDirection, ctaDirection, editingStyle, propsLocationTalent (array), variationIdeas (array of 3), ugcFireProductionNotes, doNotInclude (array).

Every aiVideoPrompt MUST contain: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."

Do not recommend unsupported medical, financial, legal, or unrealistic claims. No fake logos. No competitor mentions.

Return ONLY a raw JSON object. No markdown. No code fences. No explanation. Just the JSON.`

// ── Helpers ────────────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  // Strip leading/trailing whitespace and any text before first {
  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1)
  }
  return raw.trim()
}

function tokenBudget(ideaCount: string): number {
  const n = parseInt(ideaCount.replace(/\D/g, ''), 10)
  if (n >= 40) return 12000
  if (n >= 20) return 8000
  return 5000
}

// ── DEV fallback (only when OPENAI_API_KEY is absent in development) ────────

function makeFallback(ideaCount: number) {
  const ideas = Array.from({ length: Math.min(ideaCount, 3) }, (_, i) => ({
    title: `Commercial Idea ${i + 1} (Dev Fallback)`,
    goal: 'Get more sales',
    productionType: 'AI Video',
    difficulty: 'Easy',
    bestFor: 'Awareness',
    priority: 'High',
    openingMoment: 'Creator holds product up to camera',
    sceneDescription: 'Creator showcases the product in a natural everyday setting',
    shotList: ['Close-up of product', 'Creator reaction shot', 'Product in use'],
    aiVideoPrompt: 'Short-form UGC video, creator holds product, natural lighting, iPhone-style. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
    voiceoverSpokenDirection: 'Creator naturally recommends the product',
    ctaDirection: 'End with creator recommending the product',
    editingStyle: 'Natural handheld, authentic UGC feel',
    propsLocationTalent: ['Product', 'Natural light', 'Casual creator'],
    variationIdeas: ['More premium version', 'More fun version', 'More direct response'],
    ugcFireProductionNotes: 'DEV FALLBACK — configure OPENAI_API_KEY to get real output',
    doNotInclude: ['No on-screen text', 'No captions', 'No fake logos'],
  }))
  return {
    brandProductRead: 'DEV FALLBACK — configure OPENAI_API_KEY to see real output',
    contentIngredients: ['Product photos', 'Brand assets'],
    bestOpportunities: ['Product demo', 'Lifestyle use'],
    ugcMarketingAngles: [{ title: 'First Reaction', whyItWorks: 'Authentic surprise', bestUseCase: 'Product launch', exampleCommercialIdea: 'Creator tries product for first time' }],
    sceneBank: [{ category: 'Product Hero Scenes', sceneTitle: 'Hero Shot', purpose: 'Show product clearly', whatToShow: 'Product on surface', location: 'Kitchen counter', propsNeeded: ['Product'], talentDirection: 'Hold product naturally', suggestedSpokenMoment: 'This is amazing', whyItWorks: 'Establishes product clearly' }],
    reusableScenesToCaptureFirst: [],
    commercialIdeas: ideas,
    videoRecipes: [],
    firstBatchRecommendation: ideas.map(i => ({ title: i.title, whyMakeThisFirst: 'Easy to produce', difficulty: 'Easy', productionType: 'AI Video', priority: 'High', assetsNeeded: ['Product image'], sceneBankScenesUsed: ['Hero Shot'] })),
    creativeRules: { brandRules: ['Be authentic'], productionRules: ['Natural lighting'], claimsToAvoid: [], doNotIncludeRules: ['No on-screen text'], qualityNotes: ['Show product clearly'], whatMakesThisWork: ['Authenticity'], creativeAvoidList: [] },
  }
}

// ── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log('[strategy/run] Request received')

  const apiKey = process.env.OPENAI_API_KEY
  console.log('[strategy/run] OPENAI_API_KEY present:', !!apiKey)

  // DEV fallback when no API key configured
  if (!apiKey) {
    if (IS_DEV) {
      console.warn('[strategy/run] No OPENAI_API_KEY — returning dev fallback')
      const ideaCount = 3
      return NextResponse.json({ ok: true, factory: makeFallback(ideaCount) })
    }
    console.error('[strategy/run] MISSING_OPENAI_KEY in production')
    return NextResponse.json({ ok: false, error: 'MISSING_OPENAI_KEY' }, { status: 500 })
  }

  // Parse request body
  let body: {
    userId?: string
    setupLevel?: string
    completionPercentage?: number
    confidenceLabel?: string
    brandBrief?: Record<string, unknown>
    selectedIdeaCount?: string
    selectedCommercialStyle?: string
    selectedProductionType?: string
    actionType?: string
  }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const {
    userId,
    brandBrief,
    selectedIdeaCount = '8 ideas',
    selectedCommercialStyle = 'Mixed',
    selectedProductionType = 'Mixed Production',
    setupLevel = 'Empty',
    confidenceLabel = 'Low',
  } = body

  console.log('[strategy/run] Setup level:', setupLevel, '| Ideas:', selectedIdeaCount, '| Style:', selectedCommercialStyle)

  // ── Build brand context ──────────────────────────────────────────────────
  let brandContext = 'No brand setup found. Generate a general UGC commercial strategy based on the selected style and production type.'

  if (brandBrief && Object.keys(brandBrief).length > 0) {
    const ext = parseExtendedNotes(brandBrief.notes as string | null)
    const lines: string[] = [
      `Setup Level: ${setupLevel}`,
      `Strategy Confidence: ${confidenceLabel}`,
      `Business Name: ${brandBrief.company_name ?? 'Not provided'}`,
      `Website: ${brandBrief.website ?? 'Not provided'}`,
      `What They Sell: ${brandBrief.offer ?? 'Not provided'}`,
      `Target Customer: ${brandBrief.target_customer ?? 'Not provided'}`,
      `Brand Voice: ${brandBrief.brand_voice ?? ext.brand_voice ?? 'Not provided'}`,
      `Video/Content Styles: ${brandBrief.video_styles ?? ext.visual_style ?? 'Not provided'}`,
      `Example Links: ${brandBrief.examples ?? ext.content_inspiration_links ?? 'Not provided'}`,
      `Main Goal: ${ext.main_goal ?? 'Not provided'}`,
    ]
    if (ext.tagline) lines.push(`Tagline: ${ext.tagline}`)
    if (ext.brand_colors) lines.push(`Brand Colors: ${ext.brand_colors}`)
    if (ext.top_benefits) lines.push(`Product Benefits: ${ext.top_benefits}`)
    if (ext.top_selling_points) lines.push(`Top Selling Points: ${ext.top_selling_points}`)
    if (ext.price_range) lines.push(`Price Range: ${ext.price_range}`)
    if (ext.pain_points) lines.push(`Customer Pain Points: ${ext.pain_points}`)
    if (ext.desires) lines.push(`Customer Desires: ${ext.desires}`)
    if (ext.buying_triggers) lines.push(`Buying Triggers: ${ext.buying_triggers}`)
    if (ext.objections) lines.push(`Objections: ${ext.objections}`)
    if (ext.use_situations) lines.push(`Use Situations: ${ext.use_situations}`)
    if (ext.style_feel) lines.push(`Style Feel: ${ext.style_feel}`)
    if (ext.creator_type) lines.push(`Creator Type: ${ext.creator_type}`)
    if (ext.locations) lines.push(`Locations: ${ext.locations}`)
    if (ext.claims_to_avoid) lines.push(`Claims to Avoid: ${ext.claims_to_avoid}`)
    if (ext.compliance_notes) lines.push(`Compliance Notes: ${ext.compliance_notes}`)
    if (ext.do_dont_notes) lines.push(`Do/Don't Notes: ${ext.do_dont_notes}`)
    if (ext.content_formats?.length) lines.push(`Preferred Content Formats: ${ext.content_formats.join(', ')}`)
    if (ext.moodboard_items?.length) {
      lines.push(`Moodboard: ${ext.moodboard_items.length} items uploaded`)
      for (const item of ext.moodboard_items.slice(0, 5)) {
        lines.push(`  - [${item.label}]${item.note ? ` ${item.note}` : ''}`)
      }
    }
    if (ext.reviews_testimonials) lines.push(`Reviews/Testimonials: ${ext.reviews_testimonials}`)
    brandContext = lines.join('\n')
  }

  // ── Load supplemental strategy memories (non-blocking, best-effort) ──────
  if (userId) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: mems, error: memsErr } = await supabase
        .from('strategy_memories')
        .select('stage, title, summary')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (memsErr) {
        console.warn('[strategy/run] strategy_memories fetch failed (non-fatal):', memsErr.message)
      } else if (mems?.length) {
        brandContext += '\n\nAdditional AI memory:\n' + mems.map((m: { stage: string; title: string; summary: string }) => `[${m.stage}] ${m.title}: ${m.summary}`).join('\n')
      }
    } catch (e) {
      console.warn('[strategy/run] Supabase memories import failed (non-fatal):', (e as Error).message)
    }
  }

  console.log('[strategy/run] Brand context length:', brandContext.length, 'chars')

  // ── Call OpenAI ────────────────────────────────────────────────────────────
  const ideaCountNum = parseInt(selectedIdeaCount.replace(/\D/g, ''), 10) || 8
  const maxTokens = tokenBudget(selectedIdeaCount)

  let rawOutput: string
  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `Brand Context:\n${brandContext}`,
            `Generation Settings:`,
            `- Number of Commercial Ideas: ${ideaCountNum}`,
            `- Commercial Style: ${selectedCommercialStyle}`,
            `- Production Type: ${selectedProductionType}`,
            '',
            `Generate a complete UGC Commercial Factory. Return a raw JSON object (no markdown, no code fences) with these exact top-level keys:`,
            `brandProductRead, contentIngredients, bestOpportunities, ugcMarketingAngles, sceneBank, reusableScenesToCaptureFirst, commercialIdeas, videoRecipes, firstBatchRecommendation, creativeRules`,
          ].join('\n'),
        },
      ],
      max_tokens: maxTokens,
    })

    rawOutput = completion.choices[0].message.content ?? '{}'
    console.log('[strategy/run] OpenAI response received, length:', rawOutput.length)
  } catch (err) {
    const msg = (err as Error).message ?? String(err)
    console.error('[strategy/run] OPENAI_GENERATION_FAILED:', msg)
    return NextResponse.json(
      { ok: false, error: 'OPENAI_GENERATION_FAILED', detail: IS_DEV ? msg : undefined },
      { status: 502 },
    )
  }

  // ── Parse JSON ─────────────────────────────────────────────────────────────
  let output: Record<string, unknown>
  try {
    output = JSON.parse(extractJson(rawOutput))
    console.log('[strategy/run] JSON parsed OK. Keys:', Object.keys(output).join(', '))
  } catch (err) {
    const msg = (err as Error).message
    console.error('[strategy/run] JSON_PARSE_FAILED:', msg, '| Raw (first 300):', rawOutput.slice(0, 300))
    return NextResponse.json(
      { ok: false, error: 'JSON_PARSE_FAILED', detail: IS_DEV ? msg : undefined },
      { status: 502 },
    )
  }

  // ── Save to Supabase (fire-and-forget, never blocks response) ──────────────
  void (async () => {
    if (!userId) return
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { error: saveErr } = await supabase.from('strategy_runs').insert({
        user_id: userId,
        status: 'complete',
        input_snapshot: { selectedIdeaCount, selectedCommercialStyle, selectedProductionType, setupLevel, confidenceLabel },
        output,
      })
      if (saveErr) console.warn('[strategy/run] SUPABASE_SAVE_FAILED (non-fatal):', saveErr.message)
      else console.log('[strategy/run] Saved to strategy_runs OK')
    } catch (e) {
      console.warn('[strategy/run] Supabase save import failed (non-fatal):', (e as Error).message)
    }
  })()

  console.log('[strategy/run] Returning factory output to client')
  return NextResponse.json({ ok: true, factory: output })
}
