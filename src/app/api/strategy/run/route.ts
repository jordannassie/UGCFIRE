import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { parseExtendedNotes } from '@/lib/brandCompletion'

const SYSTEM_PROMPT = `You are UGCFire Strategy AI, a UGC commercial strategy agency inside the UGCFire dashboard.

Your job is to turn the client's brand context into a UGC Commercial Factory.

You do not create final videos. You create ideas, scene banks, video recipes, production briefs, and copy/paste AI video prompts that UGCFire can use outside the dashboard.

Use all available brand context. The brand setup may be Basic, Pro, Mixed, or incomplete. Never refuse because information is missing. Make reasonable assumptions from the website, product, audience, goal, moodboard, examples, and notes.

If links are provided, treat them as references only. Do not claim you reviewed social posts unless the content was actually uploaded or pasted.

Prioritize practical commercial ideas for short-form UGC content.

For every commercial idea, include: title, goal, production type, difficulty (Easy/Medium/Advanced), best for, priority (High/Medium/Low), opening moment, scene description, shot list, AI video prompt, voiceover/spoken direction, CTA direction, editing style, props/location/talent, variation ideas (3–5), UGCFire production notes, and do-not-include rules.

Every AI video prompt MUST include this instruction exactly:
"Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."

Every AI video prompt should also specify: realistic UGC feel, product visible early, natural lighting where relevant, handheld/iPhone-style if relevant, clear ending product moment, no fake logos, no competitor mentions, no unsupported claims.

Do not recommend unsupported medical, financial, legal, or unrealistic claims.

Generate the number of commercial ideas matching the selectedIdeaCount (8, 20, or 40).

Return ONLY valid JSON matching the exact schema. No markdown. No explanation outside JSON.`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 })
  }

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
  try { body = await req.json() } catch { body = {} }

  const { userId, brandBrief, selectedIdeaCount = '8 ideas', selectedCommercialStyle = 'Mixed', selectedProductionType = 'Mixed Production', setupLevel = 'Empty', confidenceLabel = 'Low' } = body

  const supabase = await createClient()

  // Build brand context string from brand_briefs (primary) + strategy_memories (supplement)
  let brandContext = 'No brand setup found. Generate a general UGC commercial strategy.'

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
    if (ext.words_to_avoid) lines.push(`Words to Avoid: ${ext.words_to_avoid}`)
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
    if (ext.examples_like) lines.push(`Examples They Like: ${ext.examples_like}`)
    if (ext.examples_dislike) lines.push(`Examples They Dislike: ${ext.examples_dislike}`)
    if (ext.claims_to_avoid) lines.push(`Claims to Avoid: ${ext.claims_to_avoid}`)
    if (ext.compliance_notes) lines.push(`Compliance Notes: ${ext.compliance_notes}`)
    if (ext.do_dont_notes) lines.push(`Do/Don't Notes: ${ext.do_dont_notes}`)
    if (ext.content_formats?.length) lines.push(`Preferred Content Formats: ${ext.content_formats.join(', ')}`)
    if (ext.moodboard_items?.length) {
      lines.push(`Moodboard: ${ext.moodboard_items.length} items`)
      for (const item of ext.moodboard_items.slice(0, 8)) {
        lines.push(`  - [${item.label}] ${item.type === 'link' ? item.url : item.filename ?? item.url}${item.note ? ` (note: ${item.note})` : ''}`)
      }
    }
    if (ext.reviews_testimonials) lines.push(`Reviews/Testimonials: ${ext.reviews_testimonials}`)
    if (ext.bundles_promotions) lines.push(`Bundles/Promotions: ${ext.bundles_promotions}`)
    brandContext = lines.join('\n')
  }

  // Also load strategy_memories as supplemental context
  if (supabase && userId) {
    const { data: mems } = await supabase
      .from('strategy_memories')
      .select('stage, title, summary')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (mems?.length) {
      brandContext += '\n\nAdditional context from AI memory:\n' + mems.map(m => `[${m.stage}] ${m.title}: ${m.summary}`).join('\n')
    }
  }

  const ideaCountNum = selectedIdeaCount.replace(' ideas', '')

  const openai = new OpenAI({ apiKey })
  let output: Record<string, unknown>

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Brand Context:\n${brandContext}\n\nGeneration Settings:\n- Number of Commercial Ideas: ${ideaCountNum}\n- Commercial Style: ${selectedCommercialStyle}\n- Production Type: ${selectedProductionType}\n\nGenerate a complete UGC Commercial Factory now. Return valid JSON only with these exact keys: brandProductRead, contentIngredients, bestOpportunities, ugcMarketingAngles, sceneBank, reusableScenesToCaptureFirst, commercialIdeas, videoRecipes, firstBatchRecommendation, creativeRules.`,
        },
      ],
      max_tokens: 6000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    output = JSON.parse(raw)
  } catch (err) {
    console.error('OpenAI factory error:', err)
    return NextResponse.json({ error: 'Strategy AI could not generate right now. Please try again.' }, { status: 502 })
  }

  // Save to strategy_runs
  if (supabase && userId) {
    await supabase.from('strategy_runs').insert({
      user_id: userId,
      status: 'complete',
      input_snapshot: { brandContext, selectedIdeaCount, selectedCommercialStyle, selectedProductionType, setupLevel, confidenceLabel },
      output,
    }).catch(() => { /* non-fatal */ })
  }

  return NextResponse.json(output)
}
