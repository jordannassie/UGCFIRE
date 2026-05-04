import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { saveBrandDNA, getBrandDir, listSavedBrands, loadBrandDNA } from '@/lib/brandDna'
import type { BrandDNA } from '@/lib/brandDna'

interface SaveRequest {
  dna: BrandDNA
  assets?: Array<{ id: string; b64: string; fileName: string }>
  uploadedImages?: {
    character?: string  // base64
    product?: string
    moodboard?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SaveRequest
    const { dna, assets, uploadedImages } = body

    if (!dna?.brandName) {
      return NextResponse.json({ error: 'brandName required' }, { status: 400 })
    }

    // Save brand DNA JSON
    saveBrandDNA(dna)

    const brandDir = getBrandDir(dna.brandName)

    // Save reference images if provided
    if (uploadedImages) {
      const imageMap: Record<string, string> = {
        character: 'character.jpg',
        product: 'product.jpg',
        moodboard: 'moodboard.jpg',
      }
      for (const [key, filename] of Object.entries(imageMap)) {
        const b64 = uploadedImages[key as keyof typeof uploadedImages]
        if (b64) {
          fs.writeFileSync(path.join(brandDir, filename), Buffer.from(b64, 'base64'))
        }
      }
    }

    // Save generated asset PNGs
    if (assets?.length) {
      const assetsDir = path.join(brandDir, 'assets')
      fs.mkdirSync(assetsDir, { recursive: true })
      for (const asset of assets) {
        fs.writeFileSync(path.join(assetsDir, asset.fileName), Buffer.from(asset.b64, 'base64'))
      }
    }

    return NextResponse.json({ success: true, brandName: dna.brandName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brandName = searchParams.get('brand')

    if (brandName) {
      const dna = loadBrandDNA(brandName)
      if (!dna) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(dna)
    }

    const brands = listSavedBrands()
    return NextResponse.json({ brands })
  } catch {
    return NextResponse.json({ brands: [] })
  }
}
