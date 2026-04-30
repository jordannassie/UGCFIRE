import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'fire-creator-avatars'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use jpg, png, or webp.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `fire-creator/avatar-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const supabase = getSupabase()

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    // Update the profile row
    const { data: profileRow } = await supabase
      .from('fire_creator_profile')
      .select('id')
      .limit(1)
      .single()

    if (profileRow?.id) {
      await supabase
        .from('fire_creator_profile')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profileRow.id)
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl })
  } catch (err) {
    console.error('[profile/avatar POST]', err)
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = getSupabase()
    const { data: profileRow } = await supabase
      .from('fire_creator_profile')
      .select('id')
      .limit(1)
      .single()

    if (profileRow?.id) {
      await supabase
        .from('fire_creator_profile')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', profileRow.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status: 500 })
  }
}
