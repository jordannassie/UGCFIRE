import OpenAI from 'openai'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key found' })

    const openai = new OpenAI({ apiKey: key })
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: 'a red circle',
      size: '1024x1024',
      n: 1,
    })

    return NextResponse.json({
      success: true,
      has_b64: !!result.data[0].b64_json,
      has_url: !!result.data[0].url,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message })
  }
}
