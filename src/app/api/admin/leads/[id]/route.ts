import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

// PATCH /api/admin/leads/[id] — update status, follow-up date, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const supabase = getSupabase()

    const allowed = [
      'status', 'next_follow_up_at', 'last_contacted_at', 'lead_score',
      'main_contact', 'contact_title', 'contact_email', 'contact_phone', 'business_notes',
    ]
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    const { data, error } = await supabase
      .from('leads')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, lead: data })
  } catch (err) {
    console.error('[leads PATCH]', err)
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}

// GET /api/admin/leads/[id] — fetch single lead with notes and activities
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    const [{ data: lead, error: le }, { data: notes, error: ne }, { data: activities, error: ae }] =
      await Promise.all([
        supabase.from('leads').select('*').eq('id', id).single(),
        supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
        supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      ])

    if (le) throw le
    return NextResponse.json({
      success: true,
      lead,
      notes: ne ? [] : (notes ?? []),
      activities: ae ? [] : (activities ?? []),
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
