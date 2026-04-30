import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

// ── Boot logs — always run at module init ───────────────────────────────────
console.log('Strategy API module loaded')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL ?? 'gpt-4o-mini (default)')

const SYSTEM_PROMPT = `You are UGCFire Strategy AI.

Your only job is to generate specific UGC commercial ideas based on the saved Your Brand context.

Think like a video agency pitching commercial concepts to a client.

Do not ask follow-up questions.
Do not interview the user.
Do not create a long marketing strategy report.
Do not create tabs, scene banks, campaign reports, or strategy documents.
Generate a simple list of commercial ideas.

Each idea must be specific, visual, and production-ready.

CRITICAL QUALITY RULES:
Do not output vague categories. Output specific commercial scenes.
Avoid generic titles like "Product Demo", "Testimonial", "Before and After", "Social Proof", "Daily Routine" unless made specific and visual.

EXAMPLES OF BAD vs GOOD:

Bad title: "Product Demo"
Good title: "One Pump Morning Glow" — Creator dispenses one pump, shows texture on fingertips, blends it in natural bathroom light, smiles at camera, holds bottle up.

Bad title: "Customer Testimonial"
Good title: "The Product I Keep Reaching For" — Creator opens skincare drawer, reaches past other products, grabs this one, explains why it became their daily favorite.

Bad title: "Food Review"
Good title: "First Bite Crunch Reaction" — Creator opens chip bag, takes first bite, reacts to crunch, reaches back for more.

QUALITY CHECKLIST — verify each idea:
[ ] Title sounds like a real UGC commercial concept, not a marketing category?
[ ] Specific scene with named location?
[ ] Product visible in a specific moment?
[ ] Hook is a specific line or visual action that opens the video?
[ ] CTA is a natural recommendation or action?
[ ] ugcPrompt contains enough direction for an AI video tool or creator?
[ ] ugcPrompt includes: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."?
[ ] Shot list contains real specific shots, not just "product shot" or "reaction shot"?

If any idea fails, rewrite it before including.

Do not ask follow-up questions. Do not refuse for missing info. Make smart assumptions.

For food/snack brands: reaction scenes, taste moments, snack settings.
For skincare brands: mirror scenes, application moments, glow reveals.
For hot sauce brands: pour moments, reaction shots, meal upgrades.
For fitness brands: workout moments, transformation scenes, daily use.
For clothing brands: try-on scenes, outfit reveals, lifestyle moments.
For service businesses: problem-solution scenes, real customer moments.
Infer category from available context and generate accordingly.

OUTPUT — return only this exact JSON structure. No extra keys. No markdown:
{
  "ideas": [
    {
      "title": "specific commercial concept name",
      "description": "one sentence describing what happens in this scene",
      "hook": "the exact opening line or visual action that starts the video",
      "cta": "the natural closing action or recommendation",
      "productionType": "AI Video | Real Creator | Product B-Roll | Mixed",
      "difficulty": "Easy | Medium | Advanced",
      "ugcPrompt": "complete copy-paste prompt for AI video tools or creators. Include: Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.",
      "shotList": ["specific shot 1", "specific shot 2", "specific shot 3"],
      "voiceoverDirection": "natural spoken direction or no scripted lines",
      "editingStyle": "brief editing note"
    }
  ]
}

Return JSON only. No markdown. No explanation. No keys outside of "ideas".`

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
        hook: 'Creator\'s hand sweeps a cluttered counter clean in one motion, placing the product front and center.',
        cta: 'End with creator holding the product clearly and giving a natural confident nod.',
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
      },
      {
        title: 'First Reaction Open',
        description: 'Creator opens the product for the first time on camera with a genuine discovery reaction.',
        hook: 'Creator opens packaging on camera for the first time — genuine surprised expression as the product is revealed.',
        cta: 'End with creator holding product clearly and giving a natural recommendation.',
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
      },
      {
        title: 'Fridge Door Grab',
        description: 'Fridge door opens to reveal the product prominently on the shelf — creator reaches for it without hesitation.',
        hook: 'Fridge door opens and the product is immediately visible, front and center on the shelf.',
        cta: 'End on product clearly visible — held up or back on shelf in a clean final shot.',
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
    `Generate exactly ${ideaCountNum} UGC commercial ideas for this ${category}.`,
    `Each idea must have: a specific title (not a category name), a one-line description, a hook (specific opening line or visual), a CTA (natural closing action), production type, difficulty, ugcPrompt, shot list, voiceover direction, and editing style.`,
    `Avoid generic titles like "Product Demo", "Testimonial", "Daily Routine", "Social Proof".`,
    `Every ugcPrompt must include: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."`,
    '',
    `Return exactly this JSON: { "ideas": [ { "title", "description", "hook", "cta", "productionType", "difficulty", "ugcPrompt", "shotList", "voiceoverDirection", "editingStyle" } ] }`,
    `Return JSON only. No markdown. No extra keys. Return exactly ${ideaCountNum} ideas.`,
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
      return NextResponse.json({ success: true, data: makeFallback() })
    }
    console.error('MISSING_OPENAI_KEY in production')
    return NextResponse.json(
      { success: false, error: 'Strategy AI is not configured. Please contact support.' },
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
      { success: false, error: 'Strategy AI could not connect to OpenAI. Please try again.', details },
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
      { success: false, error: 'Strategy AI returned an unexpected format. Please try again.', details, truncated: finishReason === 'length' },
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

  console.log('Returning ideas to client. count:', (output.ideas as unknown[])?.length ?? 0)
  return NextResponse.json({ success: true, data: output })
}
