import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

const MAX_IMAGE_BYTES = 1 * 1024 * 1024

type SupportedSize = '1024x1024' | '1024x1536' | '1536x1024'

interface GenerateRequest {
  index: number
  userPrompt: string
  referenceImages?: string[]
}

function detectSize(prompt: string): SupportedSize {
  const p = prompt.toLowerCase()
  if (/\b(portrait|vertical|9[\s:\/]16|tall|story|reel|poster)\b/.test(p)) return '1024x1536'
  if (/\b(landscape|horizontal|16[\s:\/]9|wide|banner|cover|hero)\b/.test(p)) return '1536x1024'
  return '1024x1024'
}

function clampBase64(raw: string): string {
  const maxChars = Math.floor(MAX_IMAGE_BYTES * 4 / 3)
  return raw.length > maxChars ? raw.slice(0, maxChars) : raw
}

function toImageFile(raw: string, i: number): File {
  const buf = Buffer.from(clampBase64(raw), 'base64')
  return new File([buf], `ref-${i}.png`, { type: 'image/png' })
}

async function generateWithRefs(openai: OpenAI, prompt: string, size: SupportedSize, refs: string[]): Promise<string> {
  const files = refs.map(toImageFile)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (openai.images.edit as any)({
    model: 'gpt-image-2',
    image: files.length === 1 ? files[0] : files,
    prompt,
    size,
  })
  const item = (res.data ?? res)[0]
  const b64 = item?.b64_json ?? item?.url
  if (!b64) throw new Error('No image data in edit response')
  return b64
}

async function generateTextOnly(openai: OpenAI, prompt: string, size: SupportedSize): Promise<string> {
  const res = await openai.images.generate({ model: 'gpt-image-2', prompt, size })
  const b64 = res.data[0]?.b64_json
  if (!b64) throw new Error('No image data in generate response')
  return b64
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let body: GenerateRequest
    try {
      body = await req.json() as GenerateRequest
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { index, userPrompt, referenceImages } = body

    if (index === undefined || !userPrompt) {
      return NextResponse.json({ error: 'Missing required fields: index, userPrompt' }, { status: 400 })
    }

    const size   = detectSize(userPrompt)
    const prompt = `${userPrompt}\n\nUltra high-quality, photorealistic, professional photography.`

    console.log(`[generate-image] #${index + 1} | size=${size} | refs=${referenceImages?.length ?? 0}`)

    let b64: string

    if (referenceImages?.length) {
      try {
        b64 = await generateWithRefs(openai, prompt, size, referenceImages)
        console.log(`[generate-image] #${index + 1} — edit mode OK`)
      } catch (editErr) {
        const reason = editErr instanceof Error ? editErr.message : String(editErr)
        console.error(`[generate-image] #${index + 1} — edit failed (${reason}), falling back to text-only`)
        b64 = await generateTextOnly(openai, prompt, size)
        console.log(`[generate-image] #${index + 1} — text-only fallback OK`)
      }
    } else {
      b64 = await generateTextOnly(openai, prompt, size)
      console.log(`[generate-image] #${index + 1} — text-only OK`)
    }

    return NextResponse.json({ b64, index })

  } catch (err) {
    let message = err instanceof Error ? err.message : String(err)
    if (err && typeof err === 'object' && 'error' in err) {
      const apiErr = (err as { error?: { message?: string } }).error
      if (apiErr?.message) message = apiErr.message
    }
    console.error('[generate-image] unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
