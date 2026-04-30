import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { parseExtendedNotes } from '@/lib/brandCompletion'

// ── Boot logs — always run at module init ───────────────────────────────────
console.log('Strategy API module loaded')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY exists:', Boolean(process.env.OPENAI_API_KEY))
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL ?? 'gpt-4o-mini (default)')

const SYSTEM_PROMPT = `You are not a generic marketing assistant. You are a senior UGC creative director and commercial concept strategist working inside UGCFire.

Your job is to generate specific, production-ready UGC commercial concepts that can be produced from product images, creator footage, AI video tools, product b-roll, or simple lifestyle scenes.

CRITICAL QUALITY RULES:
Do not output vague categories. Output specific commercial scenes.
Do not write "testimonial" — write the specific moment that makes the testimonial feel real.
Do not write "product demo" — write the exact action, setting, and product moment.
Do not write "daily routine" — write the specific scene in the specific location with the specific product moment.
Do not write "before and after" — write who is there, what changes, how the product is shown.
Do not write "social proof" — write the friend's exact reaction, the setting, the emotion.

Every commercial idea MUST answer:
- Who is in the scene?
- Where exactly are they?
- What are they doing?
- How does the product appear in the scene?
- What emotion or reaction happens?
- What is the specific opening visual or spoken moment?
- What exact shots are needed?
- What makes this feel authentically UGC?

EXAMPLES OF BAD vs GOOD ideas:

Bad: "Daily skincare routine"
Good: "Bathroom Counter Reset" — A creator stands at their bathroom counter, sweeps aside several cluttered skincare products, places the client product in the center, applies it naturally, checks their skin in the mirror with a satisfied expression, ends with a clean product hero shot on the clean counter.

Bad: "Customer testimonial"
Good: "The Product I Keep Reaching For" — A creator sits near a bedroom window talking candidly about being overwhelmed by too many skincare products. Mid-sentence they reach into their drawer and pull out the product. Close-up of the texture. They apply it. Soft confident smile. End with bottle clearly in frame.

Bad: "Product demo"
Good: "One Pump Morning Glow" — Creator dispenses exactly one pump, holds it up to show the texture on fingertips, blends it into their skin in natural bathroom light, tilts toward the window to show the glow, holds the bottle up to camera and smiles without saying anything.

Bad: "Snack video"
Good: "First Bite Crunch Reaction" — Creator opens the bag on camera, pulls out a chip with a satisfying crunch sound, holds it up close, takes a first bite, eyes widen in genuine reaction, cuts to the flavor name on the bag.

QUALITY CHECKLIST — before outputting JSON, mentally verify each commercial idea:
[ ] Is the idea specific to a real scene, not a category name?
[ ] Does the idea have a named location (bathroom counter, kitchen, bedroom window, car seat, couch)?
[ ] Does the product appear visibly in a specific moment?
[ ] Is the opening moment a visual action or a specific spoken line, not a category?
[ ] Does the shot list include real specific shots (not just "product shot", "reaction shot")?
[ ] Does the AI video prompt include enough visual direction to produce the scene?
[ ] Does every AI video prompt contain: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."
[ ] Is the title specific and interesting, not a generic marketing phrase?

If an idea fails this checklist, rewrite it before including it in the output.

Do not ask follow-up questions.
Do not interview the user.
Do not refuse because information is missing.
Make reasonable assumptions from the business name, website, product, audience, and notes.
Infer the product category and generate ideas specific to that category.

For food/snack brands, generate reaction scenes, taste moments, snack settings.
For skincare brands, generate mirror scenes, application moments, glow reveals.
For hot sauce brands, generate pour moments, reaction shots, meal upgrades.
For fitness brands, generate workout moments, transformation scenes, daily use.
For clothing brands, generate try-on scenes, outfit reveals, lifestyle moments.
For service businesses, generate problem-solution scenes, real customer moments.
If category is unknown, infer from the product description, website, or offer and generate accordingly.

OUTPUT STRUCTURE — return exactly these JSON keys:
brandProductRead, contentIngredients, bestOpportunities, ugcMarketingAngles, sceneBank, reusableScenesToCaptureFirst, commercialIdeas, videoRecipes, firstBatchRecommendation, creativeRules

commercialIdeas items: title, goal, productionType, difficulty (Easy/Medium/Advanced), bestFor, priority (High/Medium/Low), openingMoment, sceneDescription, shotList (array of specific shots), aiVideoPrompt, voiceoverSpokenDirection, ctaDirection, editingStyle, propsLocationTalent (array), variationIdeas (array of 3 named variations), ugcFireProductionNotes, doNotInclude (array)

ugcMarketingAngles items: title, whyItWorks, bestUseCase, exampleCommercialIdea
sceneBank items: category, sceneTitle, purpose, whatToShow, location, propsNeeded (array), talentDirection, suggestedSpokenMoment, whyItWorks
reusableScenesToCaptureFirst items: sceneTitle, whyReusable, usedInCommercialIdeas (array)
videoRecipes items: recipeName, length, bestFor, sceneSequence (array), openingMoment, shotOrder (array), voiceoverSpokenDirection, ctaDirection, editingNotes, aiVideoPrompt, doNotInclude (array)
firstBatchRecommendation items: title, whyMakeThisFirst, difficulty, productionType, priority, assetsNeeded (array), sceneBankScenesUsed (array)
creativeRules: { brandRules (array), productionRules (array), claimsToAvoid (array), doNotIncludeRules (array), qualityNotes (array), whatMakesThisWork (array), creativeAvoidList (array) }

Return JSON only. No markdown.`

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
  const ideas = [
    {
      title: 'Counter Clear Moment',
      goal: 'Drive awareness and purchase intent',
      productionType: 'AI Video',
      difficulty: 'Easy',
      bestFor: 'New customer awareness',
      priority: 'High',
      openingMoment: 'Creator sweeps cluttered counter items aside with one hand, places the product in center frame.',
      sceneDescription: 'Creator stands at a bathroom or kitchen counter, clears away surrounding items to reveal the product as the hero. They pick it up, examine it, use it naturally, and end with a satisfied expression looking at the product.',
      shotList: [
        'Wide shot of cluttered counter, creator\'s hand enters frame',
        'Slow sweep clearing items away',
        'Product placed center counter — clean hero moment',
        'Creator picks up product, close-up of label',
        'Creator applies or uses product naturally',
        'Over-shoulder mirror shot or reaction close-up',
        'Final clean counter with product alone — held up to camera',
      ],
      aiVideoPrompt: 'Short-form UGC video. Creator at a clean countertop, picks up a product and examines it with natural curiosity. Bright natural lighting, handheld iPhone style, relaxed and authentic. Product clearly visible at all times. Ends with creator smiling and holding product up to camera. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
      voiceoverSpokenDirection: 'No scripted lines — creator expression and product visibility tell the story.',
      ctaDirection: 'End with creator holding product clearly and giving a natural confident nod or smile.',
      editingStyle: 'Natural handheld, soft warm color grade, quiet authentic feel, quick clean cuts.',
      propsLocationTalent: ['Product', 'Counter or flat surface', 'Natural or warm window light', 'Casual everyday creator'],
      variationIdeas: ['Version with creator saying one line about why they love it', 'ASMR version with product sounds', 'Quick 6-second version ending on product hero'],
      ugcFireProductionNotes: 'DEV FALLBACK — configure OPENAI_API_KEY for real AI-generated output.',
      doNotInclude: ['No on-screen text', 'No captions', 'No subtitles', 'No fake logos', 'No competitor products'],
    },
    {
      title: 'First Reaction Open',
      goal: 'Show genuine product discovery',
      productionType: 'Real Creator',
      difficulty: 'Easy',
      bestFor: 'Authenticity and trust building',
      priority: 'High',
      openingMoment: 'Creator opens packaging for the first time on camera, close-up of their face as they see the product.',
      sceneDescription: 'Creator receives or opens the product fresh, reacts naturally to the packaging, texture, smell, or taste. Ends with first genuine use moment and a reaction shot.',
      shotList: [
        'Close-up of hands opening packaging',
        'Creator face reaction — genuine curiosity or surprise',
        'Product revealed from packaging — hold up to camera',
        'First touch, application, or taste close-up',
        'Creator reaction after first use',
        'Final product held clearly toward camera',
      ],
      aiVideoPrompt: 'Short-form UGC first reaction video. Creator opens product packaging on camera, genuine surprised expression, examines product closely, first use moment with natural reaction. iPhone handheld, natural lighting. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
      voiceoverSpokenDirection: 'Creator can react out loud naturally — no script, just genuine response.',
      ctaDirection: 'End with creator recommending the product and holding it clearly.',
      editingStyle: 'Fast cuts on reaction moments, slow on product close-ups, authentic UGC feel.',
      propsLocationTalent: ['Product in packaging', 'Table or clean surface', 'Natural light', 'Genuine first-timer creator'],
      variationIdeas: ['Silent ASMR unboxing version', 'Version with creator comparing to previous product', 'Version focused only on texture/smell/taste close-up'],
      ugcFireProductionNotes: 'DEV FALLBACK — configure OPENAI_API_KEY for real AI-generated output.',
      doNotInclude: ['No on-screen text', 'No captions', 'No subtitles', 'No scripted reactions'],
    },
    {
      title: 'Fridge Door Grab',
      goal: 'Normalize product as an everyday staple',
      productionType: 'AI Video',
      difficulty: 'Easy',
      bestFor: 'Habit and repeat purchase messaging',
      priority: 'Medium',
      openingMoment: 'Fridge or cabinet door opens, product is prominently visible on the shelf.',
      sceneDescription: 'Creator opens fridge or pantry, their hand reaches directly for the product without hesitation, they use it naturally in the kitchen, end on a satisfied moment.',
      shotList: [
        'Fridge or cabinet door opens from outside — product visible on shelf',
        'Creator hand reaches for product without hesitation',
        'Product pulled out and held close to camera',
        'Creator uses product in kitchen scene',
        'Satisfied reaction or smile after use',
        'Product back on shelf — door closes',
      ],
      aiVideoPrompt: 'Short-form lifestyle UGC video. Fridge or pantry door opens and a clearly branded product is front and center on the shelf. Creator reaches for it naturally, uses it in the kitchen, ends satisfied. Warm kitchen lighting, natural and relaxed, handheld iPhone style. Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested.',
      voiceoverSpokenDirection: 'No voiceover needed — the natural grab tells the story. Optional: one line like "always in my fridge."',
      ctaDirection: 'End on product clearly visible — either held up or back on shelf in clean shot.',
      editingStyle: 'Warm kitchen tones, slow natural cuts, cozy everyday feel.',
      propsLocationTalent: ['Fridge or pantry with some items', 'Product placed prominently', 'Simple kitchen set', 'Casual everyday creator'],
      variationIdeas: ['Version showing product shared with family or friend', 'Version ending with meal made using product', 'Morning routine version with pantry open'],
      ugcFireProductionNotes: 'DEV FALLBACK — configure OPENAI_API_KEY for real AI-generated output.',
      doNotInclude: ['No on-screen text', 'No captions', 'No competitor products in frame', 'No scripted lines'],
    },
  ]
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
    `Generate ${ideaCountNum} SPECIFIC UGC commercial ideas for this ${category}.`,
    `Each idea must have a specific title (not a generic category name), a real scene with a location, visible product moment, creator action, and emotion.`,
    `Title examples for ${category}: think of specific visual moments, not category labels.`,
    `Avoid generic titles like "Product Demo", "Testimonial", "Daily Routine", "Before and After", "Social Proof".`,
    `Every aiVideoPrompt must be detailed enough that an AI video tool can generate the scene from it.`,
    `Every aiVideoPrompt must include: "Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."`,
    '',
    `Return a complete UGC Commercial Factory JSON object now.`,
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

  console.log('Returning factory to client. commercialIdeas:', (output.commercialIdeas as unknown[])?.length ?? 0)
  return NextResponse.json({ ok: true, factory: output })
}
