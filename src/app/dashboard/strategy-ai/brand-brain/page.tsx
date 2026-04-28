'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandBrainRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/strategy-ai') }, [router])
  return null
}
