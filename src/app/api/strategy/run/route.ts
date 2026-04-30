import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

// ── Boot logs — always run at module init ───────────────────────────────────
console.log('Strategy API module loaded')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL ?? 'gpt-4o-mini (default)')

const SYSTEM_PROMPT = `You are not a generic marketing assistant. You are a senior UGC creative director and commercial concept strategist working inside UGCFire.

Your job is to generate a list of specific, production-ready UGC commercial ideas that can be produced from product images, creator footage, AI video tools, product b-roll, or simple lifestyle scenes.

CRITICAL QUALITY RULES:
Do not output vague categories. Output specific commercial scenes.
Do not write "testimonial" — write the specific moment that makes the testimonial feel real.
Do not write "product demo" — write the exact action, setting, and product moment.
Do not write "daily routine" — write the specific scene in the specific location with the specific product moment.
Do not write "before and after" — write who is there, what changes, how the product is shown.
Do not write "social proof" — write the friend's exact reaction, the setting, the emotion.

Every idea MUST answer:
- Who is in the scene?
- Where exactly are they?
- What are they doing?
- How does the product appear?
- What emotion or reaction happens?
- What exact shots are needed?

EXAMPLES OF BAD vs GOOD:

Bad: "Daily skincare routine"
Good: "Bathroom Counter Reset" — A creator stands at their bathroom counter, sweeps aside cluttered skincare products, places the client product in the center, applies it naturally, checks their skin in the mirror, ends with a clean product hero shot.

Bad: "Customer testimonial"
Good: "The Product I Keep Reaching For" — Creator sits near a bedroom window talking candidly about being overwhelmed by skincare. Mid-sentence they reach into their drawer and pull out the product. Close-up of texture. They apply it. Soft confident smile. Bottle clearly in frame.

Bad: "Product demo"
Good: "One Pump Morning Glow" — Creator dispenses one pump, holds it up to show texture on fingertips, blends it in natural bathroom light, tilts toward window to show glow, holds bottle up to camera and smiles.

Bad: "Snack video"
Good: "First Bite Crunch Reaction" — Creator opens the bag on camera, pulls out a chip with a satisfying crunch sound, takes a first bite, eyes widen in genuine reaction, cuts to the flavor name on the bag.

QUALITY CHECKLIST — verify each idea before outputting:
[ ] Specific scene, not a category name?
[ ] Named location (bathroom counter, kitchen, bedroom window, car seat, couch)?
[ ] Product visibly present in a specific moment?
[ ] Shot list contains real specific shots?
[ ] ugcPrompt detailed enough for an AI video tool?
[ ] ugcPrompt contains "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."?
[ ] Title is specific and interesting, not a generic marketing phrase?

If any idea fails this checklist, rewrite it before including.

Do not ask follow-up questions. Do not interview the user. Do not refuse because information is missing.
Make smart assumptions from the business name, website, product, audience, and notes.

For food/snack brands: reaction scenes, taste moments, snack settings.
For skincare brands: mirror scenes, application moments, glow reveals.
For hot sauce brands: pour moments, reaction shots, meal upgrades.
For fitness brands: workout moments, transformation scenes, daily use.
For clothing brands: try-on scenes, outfit reveals, lifestyle moments.
For service businesses: problem-solution scenes, real customer moments.
Infer category from available context and generate accordingly.

OUTPUT — return only this JSON structure:
{
  "ideas": [
    {
      "title": "specific scene name, not a category",
      "description": "one sentence describing what happens in the scene",
      "productionType": "AI Video | Real Creator | Product B-Roll | Mixed",
      "difficulty": "Easy | Medium | Advanced",
      "ugcPrompt": "complete copy-paste prompt for AI video generation. Must include: Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.",
      "shotList": ["specific shot 1", "specific shot 2", "..."],
      "voiceoverDirection": "natural direction or 'no scripted lines'",
      "editingStyle": "brief editing note",
      "doNotInclude": ["No on-screen text", "No captions", "..."]
    }
  ]
}

Return JSON only. No markdown. No extra keys outside of "ideas".`

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
  return {
    ideas: [
      {
        title: 'Counter Clear Moment',
        description: 'Creator sweeps aside clutter to reveal the product as the hero on a clean counter.',
        productionType: 'AI Video',
        difficulty: 'Easy',
        ugcPrompt: 'Short-form UGC video. Creator at a bathroom or kitchen counter sweeps aside several random items with one hand, places the product in the center of the clean counter, picks it up and examines it with natural curiosity, applies or uses it, ends with a satisfied smile and product held clearly to camera. Natural warm lighting, handheld iPhone style, relaxed and authentic. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Wide shot of cluttered counter — creator hand enters frame',
          'Slow sweep clearing items aside',
          'Product placed center counter — clean hero reveal',
          'Close-up of product label in hand',
          'Creator applies or uses product naturally',
          'Over-shoulder mirror reflection or close-up reaction',
          'Final — product held up to camera, creator smiles',
        ],
        voiceoverDirection: 'No scripted lines — creator expression and product visibility tell the story.',
        editingStyle: 'Natural handheld, soft warm color grade, quiet authentic feel, quick clean cuts.',
        doNotInclude: ['No on-screen text', 'No captions', 'No fake logos', 'No competitor products'],
      },
      {
        title: 'First Reaction Open',
        description: 'Creator opens the product for the first time on camera with a genuine discovery reaction.',
        productionType: 'Real Creator',
        difficulty: 'Easy',
        ugcPrompt: 'Short-form UGC first-reaction video. Creator opens product packaging on camera for the first time. Genuine surprised and curious expression as they see and examine the product. First touch or first use moment with natural sensory reaction. iPhone handheld camera, natural lighting, authentic feel. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Close-up of hands opening packaging',
          'Creator face — genuine curiosity or surprise reaction',
          'Product revealed — held up to camera',
          'First touch, application, or taste close-up',
          'Creator reaction after first use — satisfied expression',
          'Final — product held clearly toward camera',
        ],
        voiceoverDirection: 'Creator reacts out loud naturally — no script, just genuine response.',
        editingStyle: 'Fast cuts on reaction moments, slow on product close-ups, authentic UGC feel.',
        doNotInclude: ['No on-screen text', 'No captions', 'No scripted lines'],
      },
      {
        title: 'Fridge Door Grab',
        description: 'Fridge or pantry door opens to reveal the product prominently on the shelf — creator reaches for it without hesitation.',
        productionType: 'AI Video',
        difficulty: 'Easy',
        ugcPrompt: 'Short-form lifestyle UGC video. Fridge or pantry door opens from the outside and a clearly branded product is front and center on the shelf. Creator hand reaches for it without hesitation, pulls it out, uses it naturally in the kitchen, ends satisfied. Warm natural kitchen lighting, relaxed everyday feel, handheld iPhone style. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Fridge or cabinet door opens — product visible and prominent on shelf',
          'Creator hand reaches directly for product without hesitation',
          'Product pulled out and held close to camera',
          'Creator uses product in kitchen — natural action',
          'Satisfied expression or soft smile after use',
          'Final — product back on shelf or held toward camera',
        ],
        voiceoverDirection: 'No voiceover needed. Optional single natural line: "always in my fridge."',
        editingStyle: 'Warm kitchen tones, slow natural cuts, cozy everyday feel.',
        doNotInclude: ['No on-screen text', 'No captions', 'No competitor products in frame'],
      },
    ],
  }
}

// ── Product category inference ───────────────────────────────────────────────

function inferCategory(brief: Record<string, unknown> | undefined): string {
  if (!brief) return 'general product'
  const hay = [brief.offer, brief.company_name, brief.target_customer, brief.video_styles, brief.examples]
    .filter(Boolean).join(' ').toLowerCase()

  if (/skin|moistur|serum|glow|cleanser|toner|face|beauty|makeup/.test(hay)) return 'skincare / beauty product'
  if (/chip|snack|crunch|crisp|popcorn|pretzel|cracker|food|eat|flavor/.test(hay)) return 'snack / food product'
  if (/hot sauce|sauce|spicy|condiment|salsa|pepper|heat/.test(hay)) return 'hot sauce / condiment'
  if (/drink|beverage|coffee|tea|juice|water|soda|energy/.test(hay)) return 'beverage / drink product'
  if (/protein|supplement|fitness|workout|gym|nutrition|vitamin|health/.test(hay)) return 'fitness / supplement product'
  if (/cloth|wear|shirt|dress|apparel|fashion|outfit|style/.test(hay)) return 'clothing / fashion product'
  if (/pet|dog|cat|animal/.test(hay)) return 'pet product'
  if (/clean|detergent|soap|wash|laundry|home/.test(hay)) return 'home / cleaning product'
  if (/restaurant|cafe|food service|meal|dish|menu/.test(hay)) return 'restaurant / food service'
  if (/coaching|course|program|service|consulting|agency/.test(hay)) return 'service / program'
  if (/candle|scent|fragrance|wax|aroma/.test(hay)) return 'candle / fragrance product'
  if (/baby|infant|kid|toddler|child/.test(hay)) return 'baby / kids product'
  return 'consumer product'
}

function buildUserPrompt({ brandContext, ideaCountNum, selectedCommercialStyle, selectedProductionType, brandBrief }: {
  brandContext: string
  ideaCountNum: number
  selectedCommercialStyle: string
  selectedProductionType: string
  brandBrief: Record<string, unknown> | undefined
}): string {
  const category = inferCategory(brandBrief)
  const productName = (brandBrief?.company_name ?? brandBrief?.offer ?? 'this product') as string
  const goal = (() => {
    try {
      const ext = brandBrief?.notes ? JSON.parse(brandBrief.notes as string) as Record<string, string> : {}
      return ext.main_goal ?? ''
    } catch { return '' }
  })()

  return [
    `Brand Context:\n${brandContext}`,
    '',
    `Product Category: ${category}`,
    `Product/Brand: ${productName}`,
    goal ? `Primary Goal: ${goal}` : '',
    '',
    `Generation Settings:`,
    `- Commercial Ideas to generate: ${ideaCountNum}`,
    `- Commercial Style: ${selectedCommercialStyle}`,
    `- Production Type: ${selectedProductionType}`,
    '',
    `Generate exactly ${ideaCountNum} SPECIFIC UGC commercial ideas for this ${category}.`,
    `Each idea must have a specific title (not a generic category name), a real scene with a location, visible product moment, creator action, and emotion.`,
    `Avoid generic titles like "Product Demo", "Testimonial", "Daily Routine", "Before and After", "Social Proof".`,
    `Every ugcPrompt must be detailed enough that an AI video tool can generate the scene from it.`,
    `Every ugcPrompt MUST include: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."`,
    '',
    `Return exactly this JSON structure: { "ideas": [ { "title", "description", "productionType", "difficulty", "ugcPrompt", "shotList", "voiceoverDirection", "editingStyle", "doNotInclude" } ] }`,
    `Return JSON only. No markdown. Return exactly ${ideaCountNum} ideas.`,
  ].filter(Boolean).join('\n')
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
          content: buildUserPrompt({ brandContext, ideaCountNum, selectedCommercialStyle, selectedProductionType, brandBrief }),
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

  console.log('Returning factory to client. ideas:', (output.ideas as unknown[])?.length ?? 0)
  return NextResponse.json({ ok: true, factory: output })
}
