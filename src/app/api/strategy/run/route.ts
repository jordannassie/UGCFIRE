import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

// ── Boot logs — always run at module init ───────────────────────────────────
console.log('Strategy API module loaded')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL ?? 'gpt-4o-mini (default)')

const SYSTEM_PROMPT = `You are UGCFire Strategy AI, a UGC commercial strategy agency.

Turn the client's brand context into a UGC Commercial Factory output in JSON format.

For each commercial idea include: title, goal, productionType, difficulty (Easy/Medium/Advanced), bestFor, priority (High/Medium/Low), openingMoment, sceneDescription, shotList (array of strings), aiVideoPrompt, voiceoverSpokenDirection, ctaDirection, editingStyle, propsLocationTalent (array), variationIdeas (array of 3), ugcFireProductionNotes, doNotInclude (array).

Every aiVideoPrompt must contain: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."

Never refuse because brand info is missing. Make reasonable assumptions. No unsupported claims.

Return ONLY a raw JSON object with no markdown, no code fences, no explanation. The JSON must have these exact top-level keys: brandProductRead, contentIngredients, bestOpportunities, ugcMarketingAngles, sceneBank, reusableScenesToCaptureFirst, commercialIdeas, videoRecipes, firstBatchRecommendation, creativeRules.`

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first !== -1 && last > first) return raw.slice(first, last + 1)
  return raw.trim()
}

function tokenBudget(ideaCount: string): number {
  const n = parseInt(ideaCount.replace(/\D/g, ''), 10) || 8
  if (n >= 40) return 14000
  if (n >= 20) return 10000
  return 8000
}

function makeFallback() {
  const ideas = Array.from({ length: 3 }, (_, i) => ({
    title: `Sample Commercial Idea ${i + 1}`,
    goal: 'Get more sales', productionType: 'AI Video', difficulty: 'Easy',
    bestFor: 'Awareness', priority: 'High', openingMoment: 'Creator holds product up to camera',
    sceneDescription: 'Creator showcases the product in a natural everyday setting.',
    shotList: ['Close-up of product', 'Creator reaction shot', 'Product in use'],
    aiVideoPrompt: 'Short-form UGC video. Creator holds product, natural lighting, iPhone handheld style. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
    voiceoverSpokenDirection: 'Creator naturally describes what they like about the product.',
    ctaDirection: 'End with creator recommending the product clearly.',
    editingStyle: 'Natural handheld, authentic UGC feel, quick clean cuts.',
    propsLocationTalent: ['Product', 'Natural light', 'Casual creator'],
    variationIdeas: ['More premium', 'More fun', 'More direct response'],
    ugcFireProductionNotes: 'DEV FALLBACK — add OPENAI_API_KEY for real output.',
    doNotInclude: ['No on-screen text', 'No captions', 'No fake logos'],
  }))
  return {
    brandProductRead: 'DEV FALLBACK — configure OPENAI_API_KEY to generate real output.',
    contentIngredients: ['Product photos', 'Brand assets'],
    bestOpportunities: ['Product demo', 'Lifestyle use'],
    ugcMarketingAngles: [{ title: 'First Reaction', whyItWorks: 'Authentic surprise', bestUseCase: 'Product launch', exampleCommercialIdea: 'Creator tries product for first time' }],
    sceneBank: [{ category: 'Product Hero Scenes', sceneTitle: 'Hero Shot', purpose: 'Show product clearly', whatToShow: 'Product on surface', location: 'Kitchen', propsNeeded: ['Product'], talentDirection: 'Hold product naturally', suggestedSpokenMoment: 'Look at this', whyItWorks: 'Establishes product' }],
    reusableScenesToCaptureFirst: [],
    commercialIdeas: ideas,
    videoRecipes: [],
    firstBatchRecommendation: ideas.map(i => ({ title: i.title, whyMakeThisFirst: 'Easy to produce', difficulty: 'Easy', productionType: 'AI Video', priority: 'High', assetsNeeded: ['Product image'], sceneBankScenesUsed: ['Hero Shot'] })),
    creativeRules: { brandRules: [], productionRules: [], claimsToAvoid: [], doNotIncludeRules: ['No on-screen text'], qualityNotes: [], whatMakesThisWork: [], creativeAvoidList: [] },
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log('Strategy API hit')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
  console.log('Request received')

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('No OPENAI_API_KEY — returning dev fallback')
      return NextResponse.json({ ok: true, factory: makeFallback() })
    }
    console.error('MISSING_OPENAI_KEY in production')
    return NextResponse.json(
      { ok: false, error: 'MISSING_OPENAI_KEY', details: 'OPENAI_API_KEY environment variable is not set.' },
      { status: 500 },
    )
  }

  // Parse request body
  let body: {
    userId?: string; setupLevel?: string; completionPercentage?: number
    confidenceLabel?: string; brandBrief?: Record<string, unknown>
    selectedIdeaCount?: string; selectedCommercialStyle?: string
    selectedProductionType?: string; actionType?: string
  }
  try { body = await req.json() } catch { body = {} }

  const {
    userId, brandBrief,
    selectedIdeaCount = '8 ideas', selectedCommercialStyle = 'Mixed',
    selectedProductionType = 'Mixed Production', setupLevel = 'Empty', confidenceLabel = 'Low',
  } = body

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  console.log('Model:', model, '| Ideas:', selectedIdeaCount, '| Style:', selectedCommercialStyle, '| Setup:', setupLevel)

  // ── Build brand context string ────────────────────────────────────────────
  let brandContext = 'No brand setup found. Generate a solid general UGC commercial strategy based on the selected style and production type.'

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
      `Content Examples/Links: ${brandBrief.examples ?? ext.content_inspiration_links ?? 'Not provided'}`,
      `Main Goal: ${ext.main_goal ?? 'Not provided'}`,
    ]
    if (ext.tagline) lines.push(`Tagline: ${ext.tagline}`)
    if (ext.top_benefits) lines.push(`Product Benefits: ${ext.top_benefits}`)
    if (ext.top_selling_points) lines.push(`Top Selling Points: ${ext.top_selling_points}`)
    if (ext.price_range) lines.push(`Price Range: ${ext.price_range}`)
    if (ext.pain_points) lines.push(`Customer Pain Points: ${ext.pain_points}`)
    if (ext.desires) lines.push(`Customer Desires: ${ext.desires}`)
    if (ext.buying_triggers) lines.push(`Buying Triggers: ${ext.buying_triggers}`)
    if (ext.claims_to_avoid) lines.push(`Claims to Avoid: ${ext.claims_to_avoid}`)
    if (ext.do_dont_notes) lines.push(`Do/Don't Notes: ${ext.do_dont_notes}`)
    if (ext.content_formats?.length) lines.push(`Content Formats: ${ext.content_formats.join(', ')}`)
    if (ext.moodboard_items?.length) lines.push(`Moodboard items: ${ext.moodboard_items.length} uploaded`)
    brandContext = lines.join('\n')
  }

  // Load strategy memories (non-blocking, best-effort)
  if (userId) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: mems, error: memsErr } = await supabase
        .from('strategy_memories')
        .select('stage, title, summary')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15)
      if (memsErr) {
        console.warn('strategy_memories fetch failed (non-fatal):', memsErr.message)
      } else if (mems?.length) {
        brandContext += '\n\nAI memory:\n' + mems.map((m: { stage: string; title: string; summary: string }) => `[${m.stage}] ${m.title}: ${m.summary}`).join('\n')
      }
    } catch (e) {
      console.warn('Supabase memories failed (non-fatal):', (e as Error).message)
    }
  }

  const ideaCountNum = parseInt(selectedIdeaCount.replace(/\D/g, ''), 10) || 8
  const maxTokens = tokenBudget(selectedIdeaCount)
  console.log('Calling OpenAI — model:', model, 'max_tokens:', maxTokens, 'brand context chars:', brandContext.length)

  // ── Call OpenAI ────────────────────────────────────────────────────────────
  let rawOutput: string
  let finishReason: string | null | undefined
  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `Brand Context:\n${brandContext}`,
            '',
            `Generation Settings:`,
            `- Commercial Ideas to generate: ${ideaCountNum}`,
            `- Commercial Style: ${selectedCommercialStyle}`,
            `- Production Type: ${selectedProductionType}`,
            '',
            `Generate a complete UGC Commercial Factory in JSON format now.`,
          ].join('\n'),
        },
      ],
      max_tokens: maxTokens,
    })

    rawOutput = completion.choices[0].message.content ?? '{}'
    finishReason = completion.choices[0].finish_reason
    console.log('OpenAI response OK — finish_reason:', finishReason, '| output chars:', rawOutput.length)

    if (finishReason === 'length') {
      console.warn('OpenAI output was TRUNCATED (finish_reason=length). Attempting partial JSON extraction.')
    }
  } catch (err) {
    const details = String((err as Error).message ?? err)
    console.error('OPENAI_REQUEST_FAILED:', details)
    return NextResponse.json(
      { ok: false, error: 'OPENAI_REQUEST_FAILED', details },
      { status: 502 },
    )
  }

  // ── Parse JSON (always strip fences first) ─────────────────────────────────
  let output: Record<string, unknown>
  try {
    output = JSON.parse(extractJson(rawOutput))
    console.log('JSON parsed OK. Top-level keys:', Object.keys(output).join(', '))
  } catch (err) {
    const details = String((err as Error).message)
    console.error('OPENAI_JSON_PARSE_FAILED:', details)
    console.error('Raw output (first 500):', rawOutput.slice(0, 500))
    return NextResponse.json(
      { ok: false, error: 'OPENAI_JSON_PARSE_FAILED', details, truncated: finishReason === 'length' },
      { status: 502 },
    )
  }

  // ── Save to Supabase (fire-and-forget — never blocks the response) ─────────
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
      if (saveErr) {
        console.warn('SUPABASE_SAVE_FAILED (non-fatal):', saveErr.message)
      } else {
        console.log('Saved to strategy_runs OK')
      }
    } catch (e) {
      console.warn('Supabase save failed (non-fatal):', (e as Error).message)
    }
  })()

  console.log('Returning factory to client. commercialIdeas:', (output.commercialIdeas as unknown[])?.length ?? 0)
  return NextResponse.json({ ok: true, factory: output })
}
