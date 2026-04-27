'use client'

import { use, useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demoData'
import StudioWorkspace from '@/components/studio/StudioWorkspace'
import { ArrowLeft, Flame, ChevronDown } from 'lucide-react'

function ClientStudioDrive({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [clientName, setClientName] = useState<string>('')
  const [allClients, setAllClients] = useState<{ id: string; name: string }[]>([])
  const [switchOpen, setSwitchOpen] = useState(false)

  useEffect(() => {
    if (isDemoMode()) {
      const match = DEMO_COMPANIES.find(c => c.id === clientId)
      setClientName(match?.name ?? 'Client')
      setAllClients(DEMO_COMPANIES.map(c => ({ id: c.id, name: c.name })))
      return
    }
    const supabase = createClient()
    supabase.from('companies').select('id, name').order('name').then(({ data }) => {
      if (data) {
        setAllClients(data)
        const match = data.find((c: { id: string }) => c.id === clientId)
        if (match) setClientName((match as { id: string; name: string }).name)
      }
    })
  }, [clientId])

  return (
    <div className="space-y-0">
      {/* Fire Creator context bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl px-4 py-3 mb-5">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-[#FF3B1A]" />
          <span className="text-[#FF3B1A] text-xs font-bold uppercase tracking-wide">Fire Creator Mode</span>
        </div>
        <span className="text-white/30 text-xs hidden sm:block">—</span>
        <span className="text-white/60 text-sm">
          You are working inside{' '}
          <span className="text-white font-semibold">{clientName || '...'}</span>
          {'\'s Studio Drive'}
        </span>

        <div className="flex-1" />

        {/* Client switcher */}
        {allClients.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setSwitchOpen(p => !p)}
              className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg transition"
            >
              Switch Client <ChevronDown size={12} />
            </button>
            {switchOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-2xl py-1.5 min-w-[180px] z-50">
                {allClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSwitchOpen(false); router.push(`/admin/clients/${c.id}/studio`) }}
                    className={`w-full text-left px-4 py-2 text-sm transition ${c.id === clientId ? 'text-white bg-[#FF3B1A]/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => router.push('/admin/studio')}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft size={12} /> Back to Admin
        </button>
      </div>

      {/* Studio Drive */}
      <StudioWorkspace
        role="admin"
        initialClientId={clientId}
        demoMode={isDemoMode()}
      />
    </div>
  )
}

export default function AdminClientStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Studio Drive</h1>
        <p className="text-white/40 text-sm mt-1">Upload, review, approve, and deliver content as Fire Creator.</p>
      </div>
      <Suspense>
        <ClientStudioDrive clientId={id} />
      </Suspense>
    </div>
  )
}
