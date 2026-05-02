import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const path = formData.get('path') as string | null

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    // Use service role key to bypass storage RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket('UGC Fire', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('UGC Fire')
      .upload(path, arrayBuffer, {
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('UGC Fire').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    return NextResponse.json({ success: true, publicUrl })
  } catch (err) {
    console.error('[api/upload-avatar]', err)
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
