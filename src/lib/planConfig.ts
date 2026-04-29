/**
 * UGCFire — centralized plan configuration.
 * Import this anywhere pricing or plan feature data is needed so the
 * numbers and copy are always consistent between public site and dashboard.
 */

export const BOOKING_CALENDAR_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1r9yLOh-Z6nt5dZAgnKaR9iXZ6ea-kOkrJxLqctzq_0C4uLmNgX2FpB6zTQl26FqmN21-zAquz?gv=true'

export interface PlanConfig {
  key: 'growth' | 'scale' | 'enterprise'
  name: string
  monthlyPrice: number | null       // price when billed monthly
  yearlyMonthlyPrice: number | null // price per month when billed yearly (20% off)
  deliverables: number | null       // videos/assets per month
  tagline: string                   // short subtitle under price
  badge: string | null
  salesOnly: boolean
  desc: string
  includes: string[]
  cta: string
  dashboardFeatures: string[]
}

export const PLAN_CONFIG: PlanConfig[] = [
  {
    key: 'growth',
    name: 'Growth',
    monthlyPrice: 1497,
    yearlyMonthlyPrice: 1197,        // Math.round(1497 * 0.8)
    deliverables: 8,
    tagline: '8 UGC-style videos per month',
    badge: null,
    salesOnly: false,
    desc: 'Best for brands that want consistent weekly content without hiring creators, editors, or a full content team.',
    includes: [
      '8 UGC-style videos/month',
      'Brand voice onboarding',
      'Hook and script creation',
      'AI-assisted content production',
      'Captions and creative direction',
      'Revisions included',
      'Cancel anytime',
    ],
    cta: 'Book Growth Call',
    dashboardFeatures: [
      '8 content deliverables/month',
      'Photos + videos',
      'AI-assisted production',
      'Dashboard review system',
      'Team chat support',
      'Revisions included',
      'Cancel anytime',
    ],
  },
  {
    key: 'scale',
    name: 'Scale',
    monthlyPrice: 2497,
    yearlyMonthlyPrice: 1997,        // Math.round(2497 * 0.8) = 1997.6 → 1997
    deliverables: 20,
    tagline: '20 UGC-style videos per month',
    badge: 'Most Popular',
    salesOnly: false,
    desc: 'Best for brands that want daily content volume and more creative testing.',
    includes: [
      '20 UGC-style videos/month',
      'One fresh content asset every business day',
      'Brand voice onboarding',
      'Hook and script creation',
      'AI-assisted content production',
      'Captions and creative direction',
      'Priority delivery',
      'Revisions included',
      'Cancel anytime',
    ],
    cta: 'Book Scale Call',
    dashboardFeatures: [
      '20 content deliverables/month',
      'Photos + videos + carousels',
      'AI-assisted production',
      'Dashboard review system',
      'Priority team chat support',
      'Weekly content drops',
      'Priority delivery',
      'Revisions included',
      'Cancel anytime',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyMonthlyPrice: null,
    deliverables: null,
    tagline: 'For brands that need higher volume, custom workflows, and priority support.',
    badge: null,
    salesOnly: true,
    desc: 'For high-volume brands and agencies that need a dedicated creative partner, custom workflows, and priority support.',
    includes: [
      'Custom monthly deliverables',
      'Dedicated creative strategist',
      'Priority support',
      'Custom workflows',
      'Team collaboration',
      'Strategy support',
      'Priority delivery',
    ],
    cta: 'Talk to Sales',
    dashboardFeatures: [
      'Custom monthly deliverables',
      'Dedicated creative strategist',
      'Priority support',
      'Custom workflows',
      'Team collaboration',
      'Strategy support',
      'Priority delivery',
    ],
  },
]

/** Returns the display price string for a given plan + billing cycle. */
export function getDisplayPrice(
  plan: PlanConfig,
  cycle: 'monthly' | 'yearly',
): { main: string; unit: string; note: string | null } {
  if (plan.salesOnly) {
    return { main: 'Custom', unit: '', note: null }
  }
  if (cycle === 'yearly' && plan.yearlyMonthlyPrice != null) {
    return {
      main: `$${plan.yearlyMonthlyPrice.toLocaleString()}`,
      unit: '/mo',
      note: 'billed annually',
    }
  }
  return {
    main: `$${plan.monthlyPrice!.toLocaleString()}`,
    unit: '/mo',
    note: null,
  }
}
