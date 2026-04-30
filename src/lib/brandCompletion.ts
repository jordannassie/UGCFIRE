export interface BrandContextResult {
  setupLevel: 'Empty' | 'Basic' | 'Pro' | 'Mixed'
  completionPercentage: number
  confidenceLabel: 'Low' | 'Medium' | 'High'
  missingSuggestions: string[]
  availableContextSummary: Record<string, unknown>
}

export interface ExtendedBrandNotes {
  _v?: number
  main_goal?: string
  content_inspiration_links?: string
  logo_url?: string
  brand_voice?: string
  brand_colors?: string
  tagline?: string
  words_to_use?: string
  words_to_avoid?: string
  additional_brand_notes?: string
  main_product?: string
  main_offer?: string
  top_benefits?: string
  top_selling_points?: string
  price_range?: string
  product_links?: string
  product_photo_urls?: string[]
  bundles_promotions?: string
  reviews_testimonials?: string
  ideal_customer?: string
  pain_points?: string
  desires?: string
  buying_triggers?: string
  objections?: string
  use_situations?: string
  style_feel?: string
  creator_type?: string
  locations?: string
  visual_style?: string
  examples_like?: string
  examples_dislike?: string
  competitor_inspiration?: string
  claims_to_avoid?: string
  compliance_notes?: string
  do_dont_notes?: string
  content_formats?: string[]
  moodboard_items?: MoodboardItem[]
}

export interface MoodboardItem {
  id: string
  type: 'image' | 'video' | 'link' | 'file'
  url: string
  filename?: string
  label: string
  note?: string
}

export function parseExtendedNotes(notes: string | null | undefined): ExtendedBrandNotes {
  if (!notes) return {}
  try {
    const parsed = JSON.parse(notes)
    if (parsed && parsed._v === 2) return parsed as ExtendedBrandNotes
  } catch { /* ignore */ }
  return {}
}

function hasVal(v: unknown): boolean {
  if (v == null || v === '') return false
  if (Array.isArray(v)) return v.length > 0
  return String(v).trim().length > 0
}

export function calcBrandContext(brief: Record<string, unknown> | null): BrandContextResult {
  if (!brief) {
    return { setupLevel: 'Empty', completionPercentage: 0, confidenceLabel: 'Low', missingSuggestions: ['Add your business name', 'Describe what you sell', 'Describe your customer'], availableContextSummary: {} }
  }

  const ext = parseExtendedNotes(brief.notes as string | null)

  // Basic fields (from direct columns + ext.main_goal)
  const basicFields: [string, unknown, number][] = [
    ['Business name',         brief.company_name,      3],
    ['Website',               brief.website,           1],
    ['What you sell',         brief.offer,             3],
    ['Target customer',       brief.target_customer,   3],
    ['Main goal',             ext.main_goal,           2],
  ]

  // Pro fields
  const proFields: [string, unknown, number][] = [
    ['Brand voice',           brief.brand_voice ?? ext.brand_voice,  1],
    ['Product benefits',      ext.top_benefits,        2],
    ['Top selling points',    ext.top_selling_points,  2],
    ['Pain points',           ext.pain_points,         2],
    ['Desires',               ext.desires,             1],
    ['Buying triggers',       ext.buying_triggers,     1],
    ['Video styles',          brief.video_styles,      1],
    ['Example links',         brief.examples,          1],
    ['Style feel',            ext.style_feel,          1],
    ['Claims to avoid',       ext.claims_to_avoid,     1],
    ['Moodboard',             ext.moodboard_items,     3],
  ]

  let basicEarned = 0
  let basicTotal = 0
  let proEarned = 0
  let proTotal = 0
  const missing: string[] = []

  for (const [label, value, weight] of basicFields) {
    basicTotal += weight
    if (hasVal(value)) basicEarned += weight
    else missing.push(label)
  }
  for (const [label, value, weight] of proFields) {
    proTotal += weight
    if (hasVal(value)) proEarned += weight
    else missing.push(label)
  }

  const total = basicTotal + proTotal
  const earned = basicEarned + proEarned
  const pct = Math.round((earned / total) * 100)
  const basicPct = Math.round((basicEarned / basicTotal) * 100)
  const proPct = Math.round((proEarned / proTotal) * 100)

  let setupLevel: BrandContextResult['setupLevel']
  if (basicEarned === 0) setupLevel = 'Empty'
  else if (basicPct >= 80 && proPct >= 60) setupLevel = 'Pro'
  else if (basicPct >= 80 && proPct > 0) setupLevel = 'Mixed'
  else if (basicPct >= 60) setupLevel = 'Basic'
  else setupLevel = 'Empty'

  const confidenceLabel: BrandContextResult['confidenceLabel'] =
    pct >= 65 ? 'High' : pct >= 35 ? 'Medium' : 'Low'

  return {
    setupLevel,
    completionPercentage: pct,
    confidenceLabel,
    missingSuggestions: missing.slice(0, 5),
    availableContextSummary: {
      businessName: brief.company_name,
      website: brief.website,
      whatYouSell: brief.offer,
      customer: brief.target_customer,
      mainGoal: ext.main_goal,
      brandVoice: brief.brand_voice ?? ext.brand_voice,
      painPoints: ext.pain_points,
      moodboardCount: (ext.moodboard_items ?? []).length,
    },
  }
}
