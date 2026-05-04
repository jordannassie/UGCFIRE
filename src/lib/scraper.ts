import * as cheerio from 'cheerio'
import axios from 'axios'

export interface ScrapedBrand {
  brandName: string
  tagline: string
  colors: string[]
  productNames: string[]
  productDescriptions: string[]
  productImages: string[]
}

export async function scrapeBrandUrl(url: string): Promise<ScrapedBrand> {
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    timeout: 12000,
    maxRedirects: 5,
  })

  const $ = cheerio.load(res.data as string)

  // Brand name
  const brandName = (
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    $('title').text().split(/[|\-–—]/)[0] ||
    new URL(url).hostname.replace(/^www\./, '')
  ).trim().substring(0, 60)

  // Tagline / description
  const tagline = (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  ).trim().substring(0, 200)

  // Colors: theme-color meta + CSS hex values from style tags
  const colors: string[] = []
  const themeColor = $('meta[name="theme-color"]').attr('content')
  if (themeColor && themeColor.startsWith('#')) colors.push(themeColor)

  const styleText = $('style').text()
  const hexMatches = styleText.match(/#[0-9a-fA-F]{6}\b/g) ?? []
  const uniqueHex = [...new Set(hexMatches)]
    .filter(c => c !== '#000000' && c !== '#ffffff' && c !== '#FFFFFF' && c !== '#000000')
    .slice(0, 6)
  colors.push(...uniqueHex)

  // Product names from headings
  const productNames: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length >= 3 && text.length <= 80 && !text.toLowerCase().includes('cookie')) {
      productNames.push(text)
    }
  })

  // Product descriptions from paragraphs
  const productDescriptions: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length >= 40 && text.length <= 400) {
      productDescriptions.push(text)
    }
  })

  // Product images (skip logos, icons, tracking pixels)
  const productImages: string[] = []
  $('img[src], img[data-src]').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? ''
    if (!src) return
    if (src.match(/logo|icon|sprite|pixel|tracking|1x1/i)) return
    if (!src.match(/\.(jpg|jpeg|png|webp)/i) && !src.startsWith('data:image')) return
    try {
      const abs = src.startsWith('http') ? src : new URL(src, url).href
      productImages.push(abs)
    } catch { /* skip malformed URLs */ }
  })

  return {
    brandName,
    tagline,
    colors: colors.slice(0, 8),
    productNames: productNames.slice(0, 6),
    productDescriptions: productDescriptions.slice(0, 3),
    productImages: productImages.slice(0, 5),
  }
}
