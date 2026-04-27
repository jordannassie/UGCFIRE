'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { isDemoMode, DEMO_AGREEMENTS } from '@/lib/demoData'

interface AgreementRow {
  id: string
  company_id: string
  company_name: string
  plan_name: string
  signed_name: string
  signed_email: string
  signed_at: string
  agreement_version: string
  showcase_rights_checkbox: boolean
  contract_body: string
  contract_title: string
  accepted_checkbox: boolean
}

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementRow[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        setAgreements(DEMO_AGREEMENTS.map(a => ({
          id: a.id,
          company_id: a.company_id,
          company_name: a.company_name,
          plan_name: a.plan_name,
          signed_name: a.signed_name,
          signed_email: a.signed_email,
          signed_at: a.signed_at,
          agreement_version: a.agreement_version,
          showcase_rights_checkbox: a.showcase_rights_checkbox,
          contract_body: a.contract_body,
          contract_title: a.contract_title,
          accepted_checkbox: true,
        })))
        setLoading(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('agreements')
        .select('*, companies(name), plans(name)')
        .order('signed_at', { ascending: false })

      const rows = (data ?? []).map((a: {
        id: string
        company_id: string
        signed_name: string
        signed_email: string
        signed_at: string
        agreement_version: string
        showcase_rights_checkbox: boolean
        contract_body: string
        contract_title: string
        accepted_checkbox: boolean
        companies?: { name?: string } | null
        plans?: { name?: string } | null
      }) => ({
        id: a.id,
        company_id: a.company_id,
        company_name: a.companies?.name ?? '—',
        plan_name: a.plans?.name ?? '—',
        signed_name: a.signed_name,
        signed_email: a.signed_email,
        signed_at: a.signed_at,
        agreement_version: a.agreement_version,
        showcase_rights_checkbox: a.showcase_rights_checkbox,
        contract_body: a.contract_body,
        contract_title: a.contract_title,
        accepted_checkbox: a.accepted_checkbox,
      }))
      setAgreements(rows)
      setLoading(false)
    }
    load()
  }, [])

  const showcaseGrantedCount = agreements.filter(a => a.showcase_rights_checkbox).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agreements</h1>
        <div className="flex gap-4 mt-2">
          <p className="text-white/40 text-sm">{agreements.length} signed agreements</p>
          {showcaseGrantedCount > 0 && (
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">
              {showcaseGrantedCount} showcase granted
            </span>
          )}
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading agreements...</div>
        ) : agreements.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No signed agreements found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Plan</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Signed Name</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Signed Email</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Date</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Version</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-center px-4 pt-5">Showcase</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Contract</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map(a => (
                  <>
                    <tr key={a.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      <td className="py-3 border-b border-white/5 text-white font-medium px-6">{a.company_name}</td>
                      <td className="py-3 border-b border-white/5 text-white/70 px-4 text-xs">
                        <span className="bg-white/10 px-2 py-0.5 rounded-full">{a.plan_name}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/70 px-4">{a.signed_name}</td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{a.signed_email}</td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(a.signed_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs">{a.agreement_version}</td>
                      <td className="py-3 border-b border-white/5 px-4 text-center">
                        {a.showcase_rights_checkbox ? (
                          <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">
                            <Check size={10} />
                            Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-white/10 text-white/40 text-xs px-2 py-0.5 rounded-full">
                            <X size={10} />
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-3 border-b border-white/5 px-6">
                        <button className="text-xs text-[#FF3B1A] hover:underline flex items-center gap-1" onClick={e => { e.stopPropagation(); setExpandedId(expandedId === a.id ? null : a.id) }}>
                          {expandedId === a.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {expandedId === a.id ? 'Collapse' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr key={`${a.id}-expanded`}>
                        <td colSpan={8} className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                          <div className="space-y-4">
                            <div className="flex gap-6 flex-wrap text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-white/40">Accepted Terms:</span>
                                {a.accepted_checkbox ? (
                                  <span className="flex items-center gap-1 text-green-400"><Check size={12} /> Yes</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-400"><X size={12} /> No</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/40">Showcase Rights:</span>
                                {a.showcase_rights_checkbox ? (
                                  <span className="flex items-center gap-1 text-green-400"><Check size={12} /> Granted</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-400"><X size={12} /> Not granted</span>
                                )}
                              </div>
                            </div>
                            {a.contract_body && (
                              <>
                                <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">{a.contract_title || 'Contract Text'}</p>
                                <div className="bg-[#080808] rounded-lg p-4 text-white/60 text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap border border-white/5">
                                  {a.contract_body}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
