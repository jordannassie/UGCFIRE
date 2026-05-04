import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export const maxDuration = 30

function detectSize(prompt: string): string {
  const p = prompt.toLowerCase()
  if (/\b(portrait|vertical|9[\s:\/]16|tall|story|reel|poster)\b/.test(p)) return '1024x1536'
  if (/\b(landscape|horizontal|16[\s:\/]9|wide|banner|cover|hero)\b/.test(p)) return '1536x1024'
  return '1024x1024'
}

function parseCount(prompt: string): number {
  const patterns = [
    /\b(\d+)\s+(?:image|photo|poster|version|asset|variation|design|concept|visual|render|shot|frame|card)s?\b/i,
    /\b(?:generate|create|make|produce|give\s+me|show\s+me)\s+(\d+)\b/i,
  ]
  for (const re of patterns) {
    const m = prompt.match(re)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n >= 1 && n <= 50) return n
    }
  }
  return 9
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { prompt, userId, referencePaths = [] } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const sessionId = randomUUID()
    const count = parseCount(prompt)
    const size = detectSize(prompt)

    const jobs = Array.from({ length: count }, (_, i) => ({
      user_id: userId || null,
      session_id: sessionId,
      prompt,
      asset_number: i + 1,
      asset_label: `Image ${i + 1}`,
      size,
      status: 'pending',
      reference_paths: referencePaths,
    }))

    const { data, error } = await supabase
      .from('generation_jobs')
      .insert(jobs)
      .select('id, asset_number, asset_label, size, status')

    if (error) {
      console.error('[generate-campaign] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[generate-campaign] Created ${data.length} jobs for session ${sessionId}`)
    return NextResponse.json({ sessionId, jobs: data })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-campaign] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
