'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import { FolderOpen } from 'lucide-react'

interface ClientRow {
  id: string
  name: string
  owner_name: string
  owner_email: string
  plan_name: string
  billing_status: string
  onboarding_status: string
  showcase_permission: boolean
  last_activity: string | null
  avatar_url?: string | null
}

function CompanyAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  if (avatarUrl) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
        <Image src={avatarUrl} alt={name} width={32} height={32} className="object-cover w-full h-full" unoptimized />
      </div>
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-white/10 text-white text-xs font-bold drop-shadow"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' }}
    >
      {initial}
    </div>
  )
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
    setLoading(true)
    const supabase = createClient()
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, owner_user_id, plan_id, billing_status, onboarding_status, showcase_permission')
      .order('created_at', { ascending: false })

    if (!companies) {
      setClients([])
      setLoading(false)
      return
    }

    const rows: ClientRow[] = await Promise.all(
      companies.map(async (company) => {
        const [{ data: profile }, { data: plan }, { data: lastLog }, { data: brief }] = await Promise.all([
          company.owner_user_id
            ? supabase
              .from('profiles')
              .select('email, full_name, avatar_url, updated_at')
              .eq('id', company.owner_user_id)
              .maybeSingle()
            : Promise.resolve({ data: null }),
          company.plan_id
            ? supabase.from('plans').select('name').eq('id', company.plan_id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from('activity_logs')
            .select('created_at')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('brand_briefs')
            .select('notes')
            .eq('company_id', company.id)
            .maybeSingle(),
        ])

        const ownerProfile = profile as { email?: string; full_name?: string | null; avatar_url?: string | null } | null
        let brandLogoUrl = null
        if (brief?.notes) {
          try {
            const notes = JSON.parse(brief.notes as string)
            brandLogoUrl = notes.logo_url
          } catch (e) {}
        }

        return {
          id: company.id,
          name: company.name,
          owner_name: ownerProfile?.full_name || 'No name saved',
          owner_email: ownerProfile?.email ?? 'No email',
          plan_name: (plan as { name?: string } | null)?.name ?? 'No Plan',
          billing_status: company.billing_status,
          onboarding_status: company.onboarding_status,
          showcase_permission: company.showcase_permission,
          last_activity: lastLog?.created_at ?? null,
          avatar_url: brandLogoUrl || ownerProfile?.avatar_url || null,
        }
      })
    )

    setClients(rows)
    setLoading(false)
  }

  async function toggleShowcase(id: string, current: boolean) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, showcase_permission: !current } : c))
    const supabase = createClient()
    await supabase.from('companies').update({ showcase_permission: !current }).eq('id', id)
  }

  const filtered = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    client.owner_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-white/40 text-sm mt-1">{clients.length} total companies synced from Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadClients}
            className="border border-white/10 text-white/60 px-4 py-3 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm"
          >
            Refresh
          </button>
          <input
            type="text"
            placeholder="Search company, owner, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none w-72"
          />
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading clients...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Owner Profile</th>
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
                  <tr key={client.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 border-b border-white/5 px-6">
                      <div className="flex items-center gap-2.5">
                        <CompanyAvatar name={client.name} avatarUrl={client.avatar_url} />
                        <span className="text-white font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm truncate">{client.owner_name}</p>
                        <p className="text-white/40 text-xs truncate">{client.owner_email}</p>
                      </div>
                    </td>
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
                      {client.last_activity ? new Date(client.last_activity).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 border-b border-white/5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}/studio`)}
                          className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white px-3 py-2 rounded-lg transition text-xs font-semibold"
                        >
                          <FolderOpen size={13} /> Studio Drive
                        </button>
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="border border-white/10 text-white/60 px-3 py-2 rounded-lg hover:border-white/30 hover:text-white transition text-xs"
                        >
                          Profile
                        </button>
                      </div>
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
