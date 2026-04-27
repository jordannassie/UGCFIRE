'use client'

import { use, useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demoData'
import StudioWorkspace, { type FireCreatorProfile } from '@/components/studio/StudioWorkspace'
import { ArrowLeft, Flame, ChevronDown } from 'lucide-react'

const PROFILE_KEY = 'ugcfire_fc_profile'

const DEFAULT_FC: FireCreatorProfile = {
  displayName: 'UGC Fire Team',
  title: 'Fire Creator',
  bio: 'Your UGC Fire creator helping produce and deliver your monthly content.',
}

function fcInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function ClientStudioDrive({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [clientName, setClientName] = useState<string>('')
  const [allClients, setAllClients] = useState<{ id: string; name: string }[]>([])
  const [switchOpen, setSwitchOpen] = useState(false)
  const [fcProfile, setFcProfile] = useState<FireCreatorProfile>(DEFAULT_FC)

  useEffect(() => {
    // Load Fire Creator profile from localStorage
    try {
      const stored = localStorage.getItem(PROFILE_KEY)
      if (stored) setFcProfile({ ...DEFAULT_FC, ...JSON.parse(stored) })
    } catch {}

    // Load client list
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

  const initials = fcInitials(fcProfile.displayName || 'UGC Fire Team')

  return (
    <div>
      {/* Fire Creator context bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl px-4 py-3 mb-5">
        {/* FC Avatar + identity */}
        <div className="flex items-center gap-2.5">
          {fcProfile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fcProfile.avatarUrl} alt={fcProfile.displayName} className="w-7 h-7 rounded-full object-cover border border-[#FF3B1A]/40" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#FF3B1A]/20 border border-[#FF3B1A]/30 flex items-center justify-center shrink-0">
              <span className="text-[#FF3B1A] text-[10px] font-bold">{initials}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <Flame size={11} className="text-[#FF3B1A]" />
              <span className="text-[#FF3B1A] text-[10px] font-bold uppercase tracking-wide">Fire Creator Mode</span>
            </div>
            <p className="text-white/50 text-xs leading-none mt-0.5">
              {fcProfile.displayName}
            </p>
          </div>
        </div>

        <span className="text-white/25 text-xs hidden sm:block">·</span>

        <span className="text-white/60 text-sm">
          Working inside{' '}
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
              Switch Client <ChevronDown size={11} />
            </button>
            {switchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitchOpen(false)} />
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
              </>
            )}
          </div>
        )}

        <button
          onClick={() => router.push('/admin/studio')}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft size={11} /> Back to Admin
        </button>
      </div>

      {/* Shared Studio Drive — same component the client uses */}
      <StudioWorkspace
        role="admin"
        initialClientId={clientId}
        fireCreatorProfile={fcProfile}
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
