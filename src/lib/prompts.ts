import type { BrandDNA } from './brandDna'

export interface PromptContext {
  dna: BrandDNA
  hasCharacter: boolean
  hasProduct: boolean
  hasMoodboard: boolean
}

function styleAnchor(ctx: PromptContext): string {
  const { dna, hasCharacter, hasProduct, hasMoodboard } = ctx
  const refs: string[] = []
  if (hasCharacter) refs.push('featuring the exact same person shown in the reference photo — same face, same skin tone, same hair')
  if (hasProduct) refs.push('featuring the exact product from the reference photo — same shape, colors, and branding')
  if (hasMoodboard) refs.push('matching the visual style, color grading, and mood from the moodboard reference')
  const refNote = refs.length ? ` ${refs.join('; ')}.` : ''

  return `Brand: ${dna.brandName}. Style: ${dna.vibe} aesthetic.${refNote} Primary color: ${dna.colors.primary}, accent: ${dna.colors.accent}. Ultra high-quality, photorealistic, professional campaign photography, magazine grade.`
}

export function buildPrompt(assetId: string, ctx: PromptContext): string {
  const { dna } = ctx
  const s = styleAnchor(ctx)
  const person = dna.targetPerson || 'young professional model'
  const setting = dna.setting || 'modern urban environment'
  const product = dna.productName || dna.brandName
  const tagline = dna.tagline || dna.brandName

  switch (assetId) {
    case 'reel-hero':
      return `${s} Vertical 9:16 cinematic reel cover frame for ${dna.brandName}. ${person} in a powerful hero pose in ${setting}. ${product} prominently featured. Bold "${tagline}" text overlay at bottom third. Dynamic lighting, slight motion blur, depth of field. Feels like a premium brand launch video thumbnail.`

    case 'brand-identity':
      return `${s} Brand identity design system sheet, 1:1 square format, clean white or very light background. Shows: ${dna.brandName} logo mark with clear space rules, full color palette swatches labeled with hex codes (${dna.colors.primary}, ${dna.colors.accent}, ${dna.colors.dark}, ${dna.colors.light}), typography scale in Bebas Neue and DM Sans, brand pattern or texture. Professional graphic design layout, flat lay style, Behance-worthy presentation.`

    case 'product-detail':
      return `${s} Product detail hero sheet, 1:1 square. Large center hero shot of ${product} on gradient from white to ${dna.colors.light}. Six smaller inset panels showing: texture close-up, key feature callout, alternate angle, color variant, scale reference, lifestyle context. ${dna.productDescription || dna.productCategory + ' product'}. Studio lighting, sharp focus, commercial product photography.`

    case 'social-posts':
      return `${s} Three social media feed posts shown side by side, each vertical 9:16, slight gap between them. Left panel: clean product shot of ${product} on ${dna.colors.light} background. Center panel: lifestyle photo of ${person} using ${product} in ${setting}. Right panel: bold typographic post — "${tagline}" in Bebas Neue-style font on ${dna.colors.dark} background with ${dna.colors.primary} accent. Visually cohesive trio, consistent typography and color theme across all three.`

    case 'campaign-poster':
      return `${s} High-impact campaign poster, 9:16 vertical. ${person} mid-stride or in dynamic action in ${setting}. ${dna.brandName} logo top-left. "${tagline}" in giant bold condensed type, slammed in from left, taking up 40% of frame. ${dna.colors.primary} and ${dna.colors.dark} color blocking. Feels like a major streetwear or luxury brand launch billboard. Editorial, cinematic.`

    case 'app-ui':
      return `${s} Mobile app UI design, 16:9 landscape. Three iPhone 15 Pro mockframes floating at angles on dark ${dna.colors.dark} background with subtle glow. Screen 1: ${dna.brandName} home/discovery feed with product grid. Screen 2: ${product} detail page with add-to-cart. Screen 3: user profile or checkout confirmation. Clean modern UI, ${dna.colors.primary} CTA buttons, Bebas Neue headings. Premium app store screenshot quality.`

    case 'website-hero':
      return `${s} Website hero section displayed on a MacBook Pro 16" mockup, 16:9 landscape. On the screen: full-width ${dna.brandName} homepage — large lifestyle hero image of ${person} in ${setting}, headline "${tagline}" in bold type, ${dna.colors.primary} CTA button "Shop Now". Desktop browser chrome visible. Clean, modern, ${dna.vibe.toLowerCase()} web design. Soft shadow behind laptop, subtle background gradient.`

    case 'ad-campaign':
      return `${s} Editorial luxury advertisement, 1:1 square. ${person} in an aspirational pose in ${setting} with ${product} as the hero element. Minimal text — only ${dna.brandName} wordmark and "${tagline}" in small elegant type. High-fashion magazine double-page spread quality. Perfect exposure, film-like color grade, luxury brand aesthetic (think Bottega Veneta, Apple, Nike campaign level).`

    case 'packaging':
      return `${s} Premium product packaging design, 9:16 vertical. Three boxes or containers of ${product} stacked and fanned: colorway 1 in ${dna.colors.primary}, colorway 2 in ${dna.colors.accent}, colorway 3 in ${dna.colors.dark}. Clean sans-serif ${dna.brandName} wordmark on each box. Photographed on white surface with soft shadows and reflections. Luxury unboxing aesthetic, studio lighting, 3D-rendered level of quality.`

    default:
      return `${s} Brand campaign asset for ${dna.brandName} featuring ${product}.`
  }
}

export function getSizeForAspectRatio(
  aspectRatio: '9:16' | '1:1' | '16:9',
): '1024x1792' | '1024x1024' | '1792x1024' {
  if (aspectRatio === '9:16') return '1024x1792'
  if (aspectRatio === '16:9') return '1792x1024'
  return '1024x1024'
}

export function generateHiggsfieldBrief(brandName: string, assets: Array<{ id: string; label: string; fileName: string }>): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const motionMap: Record<string, { duration: number; motion: string; transition: string }> = {
    'reel-hero':       { duration: 3, motion: 'Slow cinematic zoom in, brand text animates up from bottom with fade', transition: 'Dissolve to next' },
    'brand-identity':  { duration: 3, motion: 'Color swatches pop in sequentially, logo scales from center', transition: 'Cross-dissolve' },
    'product-detail':  { duration: 4, motion: 'Product rotates slowly 30°, detail panels cascade in left-to-right', transition: 'Slide left' },
    'social-posts':    { duration: 5, motion: 'Posts slide in from right one-by-one with springy ease, parallax layers', transition: 'Cut' },
    'campaign-poster': { duration: 4, motion: 'Person walks forward, headline slams in from left with impact frame', transition: 'Hard cut' },
    'app-ui':          { duration: 4, motion: 'Screens float down and settle with physics spring, UI elements animate on', transition: 'Fade' },
    'website-hero':    { duration: 5, motion: 'MacBook lid opens, website scrolls down slowly, CTA button pulses', transition: 'Zoom out' },
    'ad-campaign':     { duration: 3, motion: 'Camera slowly pulls back from product, product glistens, text fades in', transition: 'Fade to black' },
    'packaging':       { duration: 4, motion: 'Boxes stack up from bottom one-by-one, gentle rotation 360°', transition: 'Fade out' },
  }

  let brief = `HIGGSFIELD ANIMATION BRIEF — ${brandName} Campaign\n`
  brief += `Generated: ${date}\n`
  brief += `${'─'.repeat(60)}\n\n`
  brief += `REEL ORDER & MOTION PROMPTS:\n\n`

  assets.forEach((asset, i) => {
    const guide = motionMap[asset.id] ?? { duration: 3, motion: 'Smooth zoom with fade-in text', transition: 'Dissolve' }
    brief += `${String(i + 1).padStart(2, '0')} — ${asset.label.toUpperCase()}\n`
    brief += `File:       ${asset.fileName}\n`
    brief += `Duration:   ${guide.duration} seconds\n`
    brief += `Motion:     ${guide.motion}\n`
    brief += `Transition: ${guide.transition}\n\n`
  })

  brief += `${'─'.repeat(60)}\n`
  brief += `UPLOAD ORDER FOR HIGGSFIELD:\n\n`
  assets.forEach((asset, i) => {
    brief += `${i + 1}. ${asset.fileName}\n`
  })

  brief += `\n${'─'.repeat(60)}\n`
  brief += `Total assets: ${assets.length}\n`
  brief += `Estimated total reel duration: ${assets.reduce((sum, a) => sum + (motionMap[a.id]?.duration ?? 3), 0)} seconds\n`
  brief += `\nGenerated by UGCFire AI Campaign Creator\n`

  return brief
}
