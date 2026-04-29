'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { isDemoMode } from '@/lib/demoData'
import StudioWorkspace from '@/components/studio/StudioWorkspace'

function StudioInner() {
  const p = useSearchParams()
  return (
    <StudioWorkspace
      role="client"
      demoMode={isDemoMode()}
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
        <a
          href="mailto:hello@ugcfire.com"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/10 bg-white/4 text-white/55 hover:text-white hover:border-white/22 hover:bg-white/7 transition text-xs font-medium whitespace-nowrap"
        >
          <Mail size={12} className="shrink-0" />
          Need help? hello@ugcfire.com
        </a>
      </div>
      <Suspense>
        <StudioInner />
      </Suspense>
    </div>
  )
}
