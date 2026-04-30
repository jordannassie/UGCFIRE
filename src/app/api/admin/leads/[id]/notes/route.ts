import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

// POST /api/admin/leads/[id]/notes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { note, activity_type } = await req.json().catch(() => ({}))
    if (!note?.trim()) {
      return NextResponse.json({ error: 'note is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const [{ data: noteRow, error: ne }, { error: ae }] = await Promise.all([
      supabase.from('lead_notes').insert({ lead_id: id, note: note.trim() }).select().single(),
      supabase.from('lead_activities').insert({
        lead_id: id,
        activity_type: activity_type ?? 'note',
        description: note.trim(),
      }),
    ])

    if (ne) throw ne
    return NextResponse.json({ success: true, note: noteRow })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
