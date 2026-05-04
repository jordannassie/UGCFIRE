import fs from 'fs'
import path from 'path'
import type { BrandDNA } from './brandDna'

export function getBrandsDir(): string {
  return path.join(process.cwd(), 'public', 'data', 'brands')
}

export function getBrandDir(brandName: string): string {
  const safe = brandName.replace(/[^a-zA-Z0-9-_]/g, '_')
  return path.join(getBrandsDir(), safe)
}

export function saveBrandDNA(dna: BrandDNA): void {
  const dir = getBrandDir(dna.brandName)
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'brand-dna.json'), JSON.stringify(dna, null, 2))
}

export function loadBrandDNA(brandName: string): BrandDNA | null {
  try {
    const file = path.join(getBrandDir(brandName), 'brand-dna.json')
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as BrandDNA
  } catch {
    return null
  }
}

export function listSavedBrands(): string[] {
  try {
    const dir = getBrandsDir()
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => {
      try {
        return fs.statSync(path.join(dir, f)).isDirectory() &&
          fs.existsSync(path.join(dir, f, 'brand-dna.json'))
      } catch { return false }
    })
  } catch {
    return []
  }
}
