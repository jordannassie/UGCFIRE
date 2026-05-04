import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSizeForAspectRatio } from '@/lib/prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateRequest {
  assetId: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  assetLabel: string
  userPrompt: string
  referenceImages?: string[]  // array of base64 strings
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const body = await req.json() as GenerateRequest
    const { assetId, aspectRatio, assetLabel, userPrompt, referenceImages } = body

    const size   = getSizeForAspectRatio(aspectRatio)
    const prompt = `${userPrompt}\n\nAsset type: ${assetLabel}. Aspect ratio: ${aspectRatio}. Ultra high-quality, photorealistic, professional campaign photography.`

    let b64: string

    if (referenceImages?.length) {
      const imageFiles = referenceImages.map((raw, i) => {
        const buf = Buffer.from(raw, 'base64')
        return new File([buf], `ref-${i}.jpg`, { type: 'image/jpeg' })
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (openai.images.edit as any)({
        model: 'gpt-image-1',
        image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
        prompt,
        size,
      })

      b64 = (response.data ?? response)[0].b64_json
    } else {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size,
      })

      b64 = response.data[0].b64_json!
    }

    return NextResponse.json({ b64, assetId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    console.error('[generate-image]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
