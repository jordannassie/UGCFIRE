import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export const maxDuration = 60

function toImageFile(b64: string, i: number): File {
  const buf = Buffer.from(b64, 'base64')
  return new File([buf], `ref-${i}.png`, { type: 'image/png' })
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let jobId: string
  try {
    const body = await req.json()
    jobId = body.jobId
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Fetch job
  const { data: job, error: fetchErr } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (fetchErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status === 'complete') {
    return NextResponse.json({ success: true, already_done: true })
  }

  // Mark as processing
  await supabase
    .from('generation_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId)

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `${job.prompt}\n\nUltra high-quality, photorealistic, professional photography.`
    const size = (job.size || '1024x1024') as '1024x1024' | '1024x1536' | '1536x1024'

    let b64: string

    // If reference images stored in Supabase Storage, download them
    const refPaths: string[] = job.reference_paths || []
    const refB64s: string[] = []

    for (const path of refPaths) {
      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .download(path)
      if (!error && data) {
        const buf = Buffer.from(await data.arrayBuffer())
        refB64s.push(buf.toString('base64'))
      }
    }

    if (refB64s.length > 0) {
      try {
        const files = refB64s.map(toImageFile)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (openai.images.edit as any)({
          model: 'gpt-image-2',
          image: files.length === 1 ? files[0] : files,
          prompt,
          size,
        })
        const item = (res.data ?? res)[0]
        b64 = item?.b64_json ?? item?.url
        if (!b64) throw new Error('No image data in edit response')
      } catch (editErr) {
        console.error(`[process-job] ${jobId} edit failed, falling back:`, editErr)
        const res = await openai.images.generate({ model: 'gpt-image-2', prompt, size })
        b64 = res.data[0]?.b64_json ?? ''
        if (!b64) throw new Error('No image data in generate response')
      }
    } else {
      const res = await openai.images.generate({ model: 'gpt-image-2', prompt, size })
      b64 = res.data[0]?.b64_json ?? ''
      if (!b64) throw new Error('No image data in generate response')
    }

    // Upload to Supabase Storage
    const storagePath = `generated/${job.session_id}/${jobId}.png`
    const imageBuffer = Buffer.from(b64, 'base64')

    const { error: uploadErr } = await supabase.storage
      .from('campaign-assets')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(storagePath)

    // Update job to complete
    await supabase
      .from('generation_jobs')
      .update({
        status: 'complete',
        image_url: publicUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    console.log(`[process-job] ${jobId} complete → ${publicUrl}`)
    return NextResponse.json({ success: true, imageUrl: publicUrl })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[process-job] ${jobId} failed:`, message)

    await supabase
      .from('generation_jobs')
      .update({ status: 'error', error: message })
      .eq('id', jobId)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
