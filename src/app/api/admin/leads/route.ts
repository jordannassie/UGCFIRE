import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

// GET /api/admin/leads — list all leads, newest first
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)

    const supabase = getSupabase()
    let query = supabase
      .from('leads')
      .select('*')
      .order('lead_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'All') query = query.eq('status', status)
    if (search) query = query.ilike('business_name', `%${search}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, leads: data ?? [] })
  } catch (err) {
    console.error('[leads GET]', err)
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
