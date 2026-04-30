import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase env')
  return createClient(url, key)
}

const HIGH_VALUE_CATEGORIES = [
  'marketing agency', 'social media agency', 'digital marketing', 'advertising agency',
  'med spa', 'medical spa', 'medspa',
  'dentist', 'dental', 'orthodontist',
  'gym', 'fitness', 'personal trainer', 'crossfit',
  'restaurant', 'cafe', 'food',
  'real estate', 'realtor', 'mortgage',
  'roofing', 'roofer',
  'hvac', 'air conditioning', 'plumber', 'plumbing',
  'law firm', 'attorney', 'lawyer',
  'cosmetic surgeon', 'plastic surgery', 'dermatologist',
  'chiropractor', 'physical therapy',
  'auto dealer', 'car dealership',
]

function calcLeadScore(p: {
  website?: string; phone?: string; rating?: number; review_count?: number; category?: string
}): number {
  let score = 0
  if (p.website) score += 25
  if (p.phone) score += 20
  if ((p.rating ?? 0) >= 4.3) score += 20
  if ((p.review_count ?? 0) >= 25) score += 20
  const cat = (p.category ?? '').toLowerCase()
  if (HIGH_VALUE_CATEGORIES.some(c => cat.includes(c))) score += 15
  return Math.min(score, 100)
}

function extractCity(address?: string): string {
  if (!address) return ''
  const parts = address.split(',').map(s => s.trim())
  return parts[1] ?? parts[0] ?? ''
}

function inferCategory(primaryType?: string): string {
  if (!primaryType) return 'Business'
  return primaryType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function fetchPlacesPage(query: string, pageToken?: string): Promise<{ places: unknown[]; nextPageToken?: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured')

  const body: Record<string, unknown> = { textQuery: query, maxResultCount: 20 }
  if (pageToken) body.pageToken = pageToken

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.businessStatus',
        'places.primaryType',
        'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Places API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return { places: data.places ?? [], nextPageToken: data.nextPageToken }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePlaceRow(place: any) {
  const website: string = place.websiteUri ?? ''
  const phone: string = place.nationalPhoneNumber ?? ''
  const rating: number = place.rating ?? 0
  const review_count: number = place.userRatingCount ?? 0
  const category = inferCategory(place.primaryType)
  const address: string = place.formattedAddress ?? ''

  return {
    google_place_id: place.id ?? null,
    business_name: place.displayName?.text ?? 'Unknown',
    category,
    city: extractCity(address),
    phone: phone || null,
    website: website || null,
    address: address || null,
    google_maps_url: place.googleMapsUri ?? null,
    rating: rating || null,
    review_count: review_count || null,
    lead_score: calcLeadScore({ website, phone, rating, review_count, category }),
    status: 'New',
    source: 'Google Places',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const query: string = (body.query ?? '').trim()
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    let allPlaces: unknown[] = []
    let pageToken: string | undefined
    let pages = 0

    do {
      const result = await fetchPlacesPage(query, pageToken)
      allPlaces = [...allPlaces, ...result.places]
      pageToken = result.nextPageToken
      pages++
      if (pageToken && pages < 3) await new Promise(r => setTimeout(r, 300))
    } while (pageToken && pages < 3)

    let imported = 0
    let duplicatesSkipped = 0
    let errors = 0

    for (const place of allPlaces) {
      try {
        const row = normalizePlaceRow(place)

        // Try upsert by google_place_id (the unique key)
        const { error } = await supabase
          .from('leads')
          .upsert(row, { onConflict: 'google_place_id', ignoreDuplicates: true })

        if (error) {
          if (error.code === '23505') {
            duplicatesSkipped++
          } else {
            console.error('[leads/import] insert error:', error.message)
            errors++
          }
        } else {
          imported++
        }
      } catch (e) {
        console.error('[leads/import] row error:', e)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      found: allPlaces.length,
      imported,
      duplicatesSkipped,
      errors,
    })
  } catch (err) {
    console.error('[leads/import]', err)
    return NextResponse.json(
      { success: false, error: String((err as Error).message) },
      { status: 500 }
    )
  }
}
