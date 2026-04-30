import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

// GET /api/admin/leads/[id]/notes
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await getSupabase()
      .from('lead_notes')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, notes: data ?? [] })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}

// POST /api/admin/leads/[id]/notes
// Body: { note, outcome?, next_follow_up_at?, activity_type? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { note, outcome, next_follow_up_at, activity_type } = body

    if (!note?.trim()) {
      return NextResponse.json({ error: 'note is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const now = new Date().toISOString()

    // Insert note
    const { data: noteRow, error: ne } = await supabase
      .from('lead_notes')
      .insert({ lead_id: id, note: note.trim() })
      .select()
      .single()
    if (ne) throw ne

    // Insert activity
    await supabase.from('lead_activities').insert({
      lead_id: id,
      activity_type: activity_type ?? outcome ?? 'note',
      description: note.trim(),
    })

    // Update lead status + timestamps
    const leadPatch: Record<string, unknown> = {
      last_contacted_at: now,
      updated_at: now,
    }
    if (outcome) leadPatch.status = outcome
    if (next_follow_up_at !== undefined) {
      leadPatch.next_follow_up_at = next_follow_up_at || null
    }

    const { data: updatedLead, error: le } = await supabase
      .from('leads')
      .update(leadPatch)
      .eq('id', id)
      .select()
      .single()

    if (le) console.error('[notes POST] lead update error:', le.message)

    return NextResponse.json({ success: true, note: noteRow, lead: updatedLead ?? null })
  } catch (err) {
    console.error('[notes POST]', err)
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
