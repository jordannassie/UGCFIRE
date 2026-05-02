'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { isDemoMode } from '@/lib/demoData'
import StudioWorkspace from '@/components/studio/StudioWorkspace'

function StudioInner() {
  const p = useSearchParams()
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    setDemoMode(isDemoMode())
  }, [])

  return (
    <StudioWorkspace
      role="client"
      demoMode={demoMode}
      initialView={p.get('view') ?? undefined}
      initialPanel={p.get('panel') ?? undefined}
    />
  )
}

export default function ClientStudioPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio</h1>
          <p className="text-white/40 text-sm mt-1">Review, approve, and manage your content.</p>
        </div>
      </div>
      <Suspense>
        <StudioInner />
      </Suspense>
    </div>
  )
}
