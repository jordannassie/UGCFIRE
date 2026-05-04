import { NextRequest, NextResponse } from 'next/server'
import { scrapeBrandUrl } from '@/lib/scraper'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string }
    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let url = body.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const data = await scrapeBrandUrl(url)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to scrape URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
