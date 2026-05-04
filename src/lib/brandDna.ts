export const VIBES = [
  'Luxury', 'Streetwear', 'Minimalist', 'Bold & Energetic', 'Tech Forward',
  'Natural & Organic', 'Retro / Vintage', 'Playful & Fun', 'Editorial', 'Athletic',
]

export const PRODUCT_CATEGORIES = [
  'Footwear', 'Apparel', 'Accessories', 'Beauty & Skincare', 'Health & Wellness',
  'Food & Beverage', 'Tech & Electronics', 'Home & Lifestyle', 'Sports & Fitness',
  'Jewelry', 'Fragrance', 'Automotive', 'Pet Products', 'Other',
]

export interface BrandColors {
  primary: string
  accent: string
  dark: string
  light: string
}

export interface GeneratedAsset {
  id: string
  index: number
  label: string
  spec: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  fileName: string
  status: 'idle' | 'generating' | 'done' | 'error'
  b64?: string
  error?: string
}

export interface BrandDNA {
  brandName: string
  productName: string
  productCategory: string
  tagline: string
  vibe: string
  colors: BrandColors
  productDescription: string
  targetPerson: string
  setting: string
  characterImagePath?: string
  productImagePath?: string
  moodboardPath?: string
  generatedAssets: GeneratedAsset[]
  createdAt: string
  updatedAt: string
}

export const DEFAULT_ASSETS: Omit<GeneratedAsset, 'status' | 'b64' | 'error'>[] = [
  { id: 'reel-hero',       index: 1, label: 'Reel Hero Cover',      spec: '9:16',   aspectRatio: '9:16',  fileName: '01-reel-hero.png' },
  { id: 'brand-identity',  index: 2, label: 'Brand Identity Sheet', spec: '1:1',    aspectRatio: '1:1',   fileName: '02-brand-identity.png' },
  { id: 'product-detail',  index: 3, label: 'Product Detail Sheet', spec: '1:1',    aspectRatio: '1:1',   fileName: '03-product-detail.png' },
  { id: 'social-posts',    index: 4, label: 'Social Media Posts ×3',spec: '3×9:16', aspectRatio: '9:16',  fileName: '04-social-posts.png' },
  { id: 'campaign-poster', index: 5, label: 'Campaign Poster',      spec: '9:16',   aspectRatio: '9:16',  fileName: '05-campaign-poster.png' },
  { id: 'app-ui',          index: 6, label: 'Mobile App UI',        spec: '16:9',   aspectRatio: '16:9',  fileName: '06-app-ui.png' },
  { id: 'website-hero',    index: 7, label: 'Website Hero Design',  spec: '16:9',   aspectRatio: '16:9',  fileName: '07-website-hero.png' },
  { id: 'ad-campaign',     index: 8, label: 'Ad Campaign Visual',   spec: '1:1',    aspectRatio: '1:1',   fileName: '08-ad-campaign.png' },
  { id: 'packaging',       index: 9, label: 'Packaging Design',     spec: '9:16',   aspectRatio: '9:16',  fileName: '09-packaging.png' },
]

