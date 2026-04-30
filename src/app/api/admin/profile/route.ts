import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

async function getOrCreateProfile() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fire_creator_profile')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code === 'PGRST116') {
    // No row — insert default
    const { data: inserted } = await supabase
      .from('fire_creator_profile')
      .insert({
        display_name: 'UGC Fire Team',
        title: 'Fire Creator',
        bio: 'Your UGC Fire creator helping produce and deliver your monthly content.',
      })
      .select()
      .single()
    return inserted
  }

  return data
}

export async function GET() {
  try {
    const profile = await getOrCreateProfile()
    return NextResponse.json({ success: true, profile })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const allowed = ['display_name', 'title', 'bio', 'avatar_url']
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    const profile = await getOrCreateProfile()
    if (!profile) throw new Error('Could not find or create profile')

    const { data, error } = await getSupabase()
      .from('fire_creator_profile')
      .update(patch)
      .eq('id', profile.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, profile: data })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
