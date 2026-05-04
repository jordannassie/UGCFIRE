import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSizeForAspectRatio } from '@/lib/prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_IMAGE_BYTES = 1 * 1024 * 1024 // 1 MB

interface GenerateRequest {
  assetId: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  assetLabel: string
  userPrompt: string
  referenceImages?: string[]  // base64 strings, no data-URL prefix
}

// Truncate a base64 string so the decoded bytes fit within MAX_IMAGE_BYTES.
// base64 overhead is ~4/3, so max base64 chars ≈ MAX_IMAGE_BYTES * 4 / 3.
function clampBase64(raw: string): string {
  const maxChars = Math.floor(MAX_IMAGE_BYTES * 4 / 3)
  return raw.length > maxChars ? raw.slice(0, maxChars) : raw
}

function toImageFile(raw: string, index: number): File {
  const clamped = clampBase64(raw)
  const buf = Buffer.from(clamped, 'base64')
  return new File([buf], `ref-${index}.jpg`, { type: 'image/jpeg' })
}

async function generateWithRefs(
  prompt: string,
  size: ReturnType<typeof getSizeForAspectRatio>,
  referenceImages: string[],
): Promise<string> {
  const imageFiles = referenceImages.map(toImageFile)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (openai.images.edit as any)({
    model: 'gpt-image-1',
    image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
    prompt,
    size,
  })

  const item = (response.data ?? response)[0]
  const b64  = item?.b64_json ?? item?.url
  if (!b64) throw new Error('No image data returned from edit endpoint')
  return b64
}

async function generateTextOnly(
  prompt: string,
  size: ReturnType<typeof getSizeForAspectRatio>,
): Promise<string> {
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
  })

  const b64 = response.data[0]?.b64_json
  if (!b64) throw new Error('No image data returned from generate endpoint')
  return b64
}

export async function POST(req: NextRequest) {
  // Always return JSON — never let an unhandled error produce an HTML response.
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    let body: GenerateRequest
    try {
      body = await req.json() as GenerateRequest
    } catch (parseErr) {
      console.error('[generate-image] failed to parse request body:', parseErr)
      return NextResponse.json({ error: 'Invalid request body — expected JSON' }, { status: 400 })
    }

    const { assetId, aspectRatio, assetLabel, userPrompt, referenceImages } = body

    if (!assetId || !aspectRatio || !userPrompt) {
      return NextResponse.json({ error: 'Missing required fields: assetId, aspectRatio, userPrompt' }, { status: 400 })
    }

    const size   = getSizeForAspectRatio(aspectRatio)
    const prompt = `${userPrompt}\n\nAsset type: ${assetLabel}. Aspect ratio: ${aspectRatio}. Ultra high-quality, photorealistic, professional campaign photography.`

    console.log(`[generate-image] ${assetId} | size=${size} | refs=${referenceImages?.length ?? 0}`)

    let b64: string

    if (referenceImages?.length) {
      try {
        b64 = await generateWithRefs(prompt, size, referenceImages)
        console.log(`[generate-image] ${assetId} — edit mode succeeded`)
      } catch (editErr) {
        // Fall back to text-only if reference image mode fails
        const reason = editErr instanceof Error ? editErr.message : String(editErr)
        console.error(`[generate-image] ${assetId} — edit mode failed (${reason}), falling back to text-only`)
        b64 = await generateTextOnly(prompt, size)
        console.log(`[generate-image] ${assetId} — text-only fallback succeeded`)
      }
    } else {
      b64 = await generateTextOnly(prompt, size)
      console.log(`[generate-image] ${assetId} — text-only succeeded`)
    }

    return NextResponse.json({ b64, assetId })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-image] unhandled error:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
