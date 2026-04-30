import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

// ── Boot logs — always run at module init ───────────────────────────────────
console.log('Strategy API module loaded')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL ?? 'gpt-4o-mini (default)')

const SYSTEM_PROMPT = `You are UGCFire Strategy AI.

Your job is to generate specific UGC commercial ideas designed for AI video creation.

Think like a video agency pitching commercial concepts to a client.
Write prompts for AI video tools, not for human videographers.

CRITICAL LANGUAGE RULES:
Use language like:
- "Create a realistic..."
- "Generate an iPhone-style..."
- "Show a creator..."
- "Depict a natural UGC-style scene..."
- "Create a short UGC commercial where..."

Do NOT use: "Record", "Film", "Shoot", "Capture footage", "Have the creator record"
unless productionType is specifically "Real Creator".

CRITICAL DURATION RULE:
Do NOT include explicit duration wording in the ugcPrompt text.
Do NOT write "5-second", "15-second", "30-second", or "60-second" inside the ugcPrompt.
The UI already shows the selected video length to the user.
Use the selected video length only to decide how complex the idea should be (shots, story, voiceover depth).

Use length-based language alternatives:
- Instead of "5-second": use "quick" or "single-moment"
- Instead of "15-second": use "short" 
- Instead of "30-second": use (no duration qualifier needed)
- Instead of "60-second": use "detailed" or "story-driven"

CRITICAL QUALITY RULES:
Do not output vague categories. Output specific commercial scenes.
Avoid generic titles like "Product Demo", "Testimonial", "Before and After", "Social Proof", "Daily Routine" unless made specific and visual.

EXAMPLES OF BAD vs GOOD:

Bad prompt: "Record a 30-day skincare journey."
Good prompt (for 5 sec): "Create a quick iPhone-style UGC clip showing a skincare product on a bathroom counter, a creator applying one pump, and smiling softly in the mirror."
Good prompt (for 15 sec): "Create a short iPhone-style UGC commercial showing a creator starting their morning routine, applying the product in natural bathroom light, checking their skin, and ending with the product clearly visible."
Good prompt (for 30 sec): "Create a realistic UGC-style commercial showing a creator talking through a simple morning routine, applying the product, showing texture close-ups, reacting naturally, and ending with a clear product recommendation."
Good prompt (for 60 sec): "Create a detailed UGC-style routine video where a creator explains how they simplified their skincare routine, shows the product in use, demonstrates texture and application, shares a natural reaction, and ends with a clear product moment."

Bad title: "Product Demo"
Good title: "One Pump Morning Glow"

Bad title: "Customer Testimonial"
Good title: "The Product I Keep Reaching For"

Bad title: "Food Review"
Good title: "First Bite Crunch Reaction"

VIDEO LENGTH RULES — use length to decide complexity, NOT to write duration into the prompt:

For 5-second ideas:
- One simple visual moment — quick, single action
- Very short ugcPrompt (1–2 sentences), use "quick" or "single-moment" language
- 1–2 shots max, minimal or no voiceover

For 15-second ideas:
- Hook → product moment → reaction → CTA
- Short clear ugcPrompt, use "short" language but no explicit "15-second"
- 3–5 shots max

For 30-second ideas:
- Hook → routine/problem → product use → benefit/reaction → CTA
- Full but concise ugcPrompt, no duration qualifier needed
- 5–7 shots max

For 60-second ideas:
- Hook → routine/demo → multiple product moments → voiceover → CTA
- Detailed ugcPrompt, use "detailed" or "story-driven" language
- 7–10 shots max

QUALITY CHECKLIST — verify each idea:
[ ] Title sounds like a real UGC commercial, not a marketing category?
[ ] Specific scene with named location?
[ ] Product visible in a specific moment?
[ ] Hook is a specific opening line or visual?
[ ] CTA is a natural recommendation or action?
[ ] ugcPrompt uses AI-generation language (Create/Generate/Show/Depict)?
[ ] ugcPrompt does NOT contain "5-second", "15-second", "30-second", or "60-second"?
[ ] ugcPrompt complexity matches the selected video length?
[ ] ugcPrompt includes: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."?
[ ] Shot list length matches the video length?

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
      "videoLength": "5 sec | 15 sec | 30 sec | 60 sec",
      "productionType": "AI Video | Real Creator | Product B-Roll | Mixed",
      "difficulty": "Easy | Medium | Advanced",
      "ugcPrompt": "complete copy-paste AI video generation prompt. Use Create/Generate/Show language. Include: Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.",
      "shotList": ["specific shot 1", "specific shot 2"]
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
        description: 'A product is revealed as the hero when a creator sweeps a cluttered counter clean in one motion.',
        hook: 'A hand sweeps a cluttered counter clean in one motion, placing the product front and center.',
        cta: 'Creator picks up the product and holds it clearly toward the camera.',
        videoLength: '15 sec',
        productionType: 'AI Video',
        difficulty: 'Easy',
        ugcPrompt: 'Create a short iPhone-style UGC clip. Show a bathroom or kitchen counter with several items scattered on it. Depict a hand sweeping the items aside in one smooth motion and placing the product in the center. Show the creator picking it up, examining it with natural curiosity, applying or using it, and ending with a satisfied smile holding the product clearly toward the camera. Natural warm lighting, handheld style, relaxed and authentic. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Wide shot of cluttered counter — creator hand enters frame',
          'Slow sweep clearing items aside',
          'Product placed center counter — clean hero reveal',
          'Close-up of product label in hand',
          'Creator applies or uses product naturally',
          'Over-shoulder mirror reflection or close-up reaction',
          'Final — product held up to camera, creator smiles',
        ],
      },
      {
        title: 'First Reaction Open',
        description: 'A creator opens the product for the first time with a genuine discovery and reaction.',
        hook: 'Packaging opens on camera — genuine surprised expression as the product is revealed for the first time.',
        cta: 'Creator holds the product clearly toward the camera with a natural, satisfied expression.',
        videoLength: '15 sec',
        productionType: 'Real Creator',
        difficulty: 'Easy',
        ugcPrompt: 'Create a short iPhone-style UGC first-reaction video. Show a creator opening product packaging on camera for the first time. Depict a genuine surprised and curious expression as they see and examine the product. Show the first touch or first use moment with a natural sensory reaction. Handheld camera, natural lighting, authentic UGC feel. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Close-up of hands opening packaging',
          'Creator face — genuine curiosity or surprise reaction',
          'Product revealed — held up to camera',
          'First touch, application, or taste close-up',
          'Creator reaction after first use — satisfied expression',
          'Final — product held clearly toward camera',
        ],
      },
      {
        title: 'Fridge Door Grab',
        description: 'The fridge opens to reveal the product prominently on the shelf — a hand reaches for it without hesitation.',
        hook: 'Fridge door swings open and the product is immediately visible, front and center on the shelf.',
        cta: 'End on the product clearly visible — held up or placed back on the shelf in a clean final shot.',
        videoLength: '15 sec',
        productionType: 'AI Video',
        difficulty: 'Easy',
        ugcPrompt: 'Create a short iPhone-style lifestyle UGC video. Show a fridge or pantry door opening from the outside with a clearly branded product front and center on the shelf. Depict a hand reaching for the product without hesitation, pulling it out naturally, using it in the kitchen, ending with a satisfied expression. Warm natural kitchen lighting, relaxed everyday feel, handheld style. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
        shotList: [
          'Fridge or cabinet door opens — product visible and prominent on shelf',
          'Creator hand reaches directly for product without hesitation',
          'Product pulled out and held close to camera',
          'Creator uses product in kitchen — natural action',
          'Satisfied expression or soft smile after use',
          'Final — product back on shelf or held toward camera',
        ],
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

function lengthInstruction(videoLength: string): string {
  switch (videoLength) {
    case '5 sec': return 'Make every idea a single quick visual moment — one action, one product, one emotion. Very short ugcPrompt (1–2 sentences). Use "quick" or "single-moment" in the prompt, NOT "5-second". 1–2 shots max. Minimal or no voiceover.'
    case '15 sec': return 'Make every idea a short hook-product-CTA commercial. ugcPrompt should be concise and direct. Use "short" in the prompt, NOT "15-second". 3–5 shots max. Simple voiceover or none.'
    case '30 sec': return 'Make every idea a complete UGC commercial with hook, setup, product use, reaction, and CTA. ugcPrompt should be full but focused. Do not use any explicit duration wording. 5–7 shots.'
    case '60 sec': return 'Make every idea a deeper story or routine concept with multiple product moments and voiceover. ugcPrompt should be detailed. Use "detailed" or "story-driven" in the prompt, NOT "60-second". 7–10 shots.'
    default: return 'Make every idea a complete short UGC commercial. Do not write any explicit duration like "5-second", "15-second", "30-second", or "60-second" inside the ugcPrompt.'
  }
}

function buildUserPrompt({ brandContext, ideaCountNum, selectedVideoLength, selectedCommercialStyle, selectedProductionType, brandBrief }: {
  brandContext: string
  ideaCountNum: number
  selectedVideoLength: string
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
    `- Ideas to generate: ${ideaCountNum}`,
    `- Video Length: ${selectedVideoLength}`,
    `- Commercial Style: ${selectedCommercialStyle}`,
    `- Production Type: ${selectedProductionType}`,
    '',
    `Generate exactly ${ideaCountNum} UGC commercial ideas for this ${category}.`,
    `Selected video length: ${selectedVideoLength}. ${lengthInstruction(selectedVideoLength)}`,
    `Do not create long documentary-style concepts unless 60 sec is selected.`,
    `Do not create 30-day journey concepts for 5 sec or 15 sec videos.`,
    ``,
    `All ugcPrompts must use AI-generation language (Create/Generate/Show/Depict), not recording language (Record/Film/Shoot/Capture).`,
    `IMPORTANT: Do NOT include explicit duration wording ("5-second", "15-second", "30-second", "60-second") inside any ugcPrompt. Use complexity and shot count to reflect the length instead.`,
    `Every ugcPrompt must include: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."`,
    `Each idea must include: title, description, hook, cta, videoLength (set to "${selectedVideoLength}"), productionType, difficulty, ugcPrompt, shotList.`,
    `Do not include voiceoverDirection or editingStyle — these fields are not needed.`,
    `Avoid generic titles like "Product Demo", "Testimonial", "Daily Routine", "Social Proof".`,
    '',
    `Return exactly this JSON: { "ideas": [ { "title", "description", "hook", "cta", "videoLength", "productionType", "difficulty", "ugcPrompt", "shotList" } ] }`,
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
    selectedIdeaCount?: string; selectedVideoLength?: string
    selectedCommercialStyle?: string; selectedProductionType?: string; actionType?: string
  }
  try { body = await req.json() } catch { body = {} }

  const {
    userId, brandBrief,
    selectedIdeaCount = '8 ideas', selectedVideoLength = '15 sec',
    selectedCommercialStyle = 'Mixed', selectedProductionType = 'Mixed Production',
    setupLevel = 'Empty', confidenceLabel = 'Low',
  } = body

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  console.log('Model:', model, '| Ideas:', selectedIdeaCount, '| Length:', selectedVideoLength, '| Setup:', setupLevel)

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
          content: buildUserPrompt({ brandContext, ideaCountNum, selectedVideoLength, selectedCommercialStyle, selectedProductionType, brandBrief }),
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
