import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildPrompt, getSizeForAspectRatio } from '@/lib/prompts'
import type { BrandDNA } from '@/lib/brandDna'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_IMAGE_BYTES = 1 * 1024 * 1024 // 1 MB per reference image

interface GenerateRequest {
  assetId: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  dna: BrandDNA
  referenceImages?: {
    character?: string
    product?: string
    moodboard?: string
  }
}

function clampBase64(raw: string): string {
  const maxChars = Math.floor(MAX_IMAGE_BYTES * 4 / 3)
  return raw.length > maxChars ? raw.slice(0, maxChars) : raw
}

function toImageFile(raw: string, name: string): File {
  const buf = Buffer.from(clampBase64(raw), 'base64')
  return new File([buf], `${name}.jpg`, { type: 'image/jpeg' })
}

async function generateWithRefs(
  prompt: string,
  size: '1024x1024' | '1024x1536' | '1536x1024',
  refs: Record<string, string>,
): Promise<string> {
  const files = Object.entries(refs).map(([key, b64]) => toImageFile(b64, key))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (openai.images.edit as any)({
    model: 'gpt-image-1',
    image: files.length === 1 ? files[0] : files,
    prompt,
    size,
  })
  const item = (res.data ?? res)[0]
  const b64 = item?.b64_json ?? item?.url
  if (!b64) throw new Error('No image data in edit response')
  return b64
}

async function generateTextOnly(
  prompt: string,
  size: '1024x1024' | '1024x1536' | '1536x1024',
): Promise<string> {
  const res = await openai.images.generate({ model: 'gpt-image-1', prompt, size })
  const b64 = res.data[0]?.b64_json
  if (!b64) throw new Error('No image data in generate response')
  return b64
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    let body: GenerateRequest
    try {
      body = await req.json() as GenerateRequest
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { assetId, aspectRatio, dna, referenceImages } = body

    if (!assetId || !dna?.brandName) {
      return NextResponse.json({ error: 'Missing required fields: assetId, dna' }, { status: 400 })
    }

    const size = getSizeForAspectRatio(aspectRatio ?? '1:1')
    const prompt = buildPrompt(assetId, {
      dna,
      hasCharacter: !!referenceImages?.character,
      hasProduct: !!referenceImages?.product,
      hasMoodboard: !!referenceImages?.moodboard,
    })

    console.log(`[generate-image] ${assetId} | size=${size} | refs=${Object.keys(referenceImages ?? {}).length}`)

    let b64: string

    const refs = referenceImages
      ? Object.fromEntries(Object.entries(referenceImages).filter(([, v]) => !!v)) as Record<string, string>
      : {}

    if (Object.keys(refs).length > 0) {
      try {
        b64 = await generateWithRefs(prompt, size, refs)
        console.log(`[generate-image] ${assetId} — edit mode OK`)
      } catch (editErr) {
        const reason = editErr instanceof Error ? editErr.message : String(editErr)
        console.error(`[generate-image] ${assetId} — edit failed (${reason}), falling back to text-only`)
        b64 = await generateTextOnly(prompt, size)
        console.log(`[generate-image] ${assetId} — text-only fallback OK`)
      }
    } else {
      b64 = await generateTextOnly(prompt, size)
      console.log(`[generate-image] ${assetId} — text-only OK`)
    }

    return NextResponse.json({ b64, assetId })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-image] unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
