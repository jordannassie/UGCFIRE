'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demoData'

interface ClientRow {
  id: string
  name: string
  owner_email: string
  plan_name: string
  billing_status: string
  onboarding_status: string
  showcase_permission: boolean
  last_activity: string | null
}

export default function AdminClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    if (isDemoMode()) {
      setClients(DEMO_COMPANIES.map(c => ({
        id: c.id,
        name: c.name,
        owner_email: c.owner_email,
        plan_name: c.plan_name,
        billing_status: c.billing_status,
        onboarding_status: c.onboarding_status,
        showcase_permission: c.showcase_permission,
        last_activity: c.last_activity,
      })))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, owner_user_id, plan_id, billing_status, onboarding_status, showcase_permission')
      .order('created_at', { ascending: false })

    if (!companies) { setLoading(false); return }

    const rows: ClientRow[] = await Promise.all(
      companies.map(async (c) => {
        const [{ data: profile }, { data: plan }, { data: lastLog }] = await Promise.all([
          supabase.from('profiles').select('email').eq('id', c.owner_user_id).single(),
          c.plan_id ? supabase.from('plans').select('name').eq('id', c.plan_id).single() : Promise.resolve({ data: null }),
          supabase.from('activity_logs').select('created_at').eq('company_id', c.id).order('created_at', { ascending: false }).limit(1).single(),
        ])
        return {
          id: c.id,
          name: c.name,
          owner_email: profile?.email ?? '—',
          plan_name: (plan as { name?: string } | null)?.name ?? 'No Plan',
          billing_status: c.billing_status,
          onboarding_status: c.onboarding_status,
          showcase_permission: c.showcase_permission,
          last_activity: lastLog?.created_at ?? null,
        }
      })
    )

    setClients(rows)
    setLoading(false)
  }

  async function toggleShowcase(id: string, current: boolean) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, showcase_permission: !current } : c))
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('companies').update({ showcase_permission: !current }).eq('id', id)
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-white/40 text-sm mt-1">{clients.length} total companies</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none w-72"
        />
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading clients...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="px-6">
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Email</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Plan</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Billing</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Onboarding</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-center px-4 pt-5">Showcase</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Last Activity</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-white/30">No clients found</td></tr>
                )}
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-white/2">
                    <td className="py-3 border-b border-white/5 text-white font-medium px-6">{client.name}</td>
                    <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{client.owner_email}</td>
                    <td className="py-3 border-b border-white/5 text-white/70 px-4">{client.plan_name}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(client.billing_status)}`}>
                        {client.billing_status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${client.onboarding_status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {client.onboarding_status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4 text-center">
                      <button
                        onClick={() => toggleShowcase(client.id, client.showcase_permission)}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${client.showcase_permission ? 'bg-[#FF3B1A]' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${client.showcase_permission ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">
                      {client.last_activity ? new Date(client.last_activity).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 border-b border-white/5 px-6">
                      <button
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                        className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
