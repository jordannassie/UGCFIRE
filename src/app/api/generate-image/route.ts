import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildPrompt, getSizeForAspectRatio } from '@/lib/prompts'
import type { BrandDNA } from '@/lib/brandDna'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateRequest {
  assetId: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  dna: BrandDNA
  referenceImages?: {
    character?: string  // base64, no prefix
    product?: string
    moodboard?: string
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const body = await req.json() as GenerateRequest
    const { assetId, aspectRatio, dna, referenceImages } = body

    const hasCharacter = !!referenceImages?.character
    const hasProduct   = !!referenceImages?.product
    const hasMoodboard = !!referenceImages?.moodboard

    const prompt = buildPrompt(assetId, { dna, hasCharacter, hasProduct, hasMoodboard })
    const size   = getSizeForAspectRatio(aspectRatio)

    let b64: string

    if (hasCharacter || hasProduct || hasMoodboard) {
      // Build File array from base64 reference images
      const imageFiles: File[] = []
      const order = ['character', 'moodboard', 'product'] as const
      for (const key of order) {
        const raw = referenceImages?.[key]
        if (!raw) continue
        const buf = Buffer.from(raw, 'base64')
        imageFiles.push(new File([buf], `${key}.jpg`, { type: 'image/jpeg' }))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (openai.images.edit as any)({
        model: 'gpt-image-1',
        image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
        prompt,
        size,
      })

      b64 = (response.data ?? response)[0].b64_json!
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (openai.images.generate as any)({
        model: 'gpt-image-1',
        prompt,
        size,
        response_format: 'b64_json',
      })

      b64 = (response.data ?? response)[0].b64_json!
    }

    return NextResponse.json({ b64, assetId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    console.error('[generate-image]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
