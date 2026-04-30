import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('lead_call_scripts')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, scripts: data ?? [] })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, category, script, is_default } = body
    if (!name?.trim() || !script?.trim()) {
      return NextResponse.json({ error: 'name and script are required' }, { status: 400 })
    }
    const { data, error } = await getSupabase()
      .from('lead_call_scripts')
      .insert({ name: name.trim(), category: category?.trim() || null, script: script.trim(), is_default: !!is_default })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, script: data })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
