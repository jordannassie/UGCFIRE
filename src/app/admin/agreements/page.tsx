'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agreements</h1>
        <p className="text-white/40 text-sm mt-1">{agreements.length} signed agreements</p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading agreements...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Plan</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Signed Name</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Signed Email</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Signed Date</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Version</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-center px-4 pt-5">Showcase</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Contract</th>
                </tr>
              </thead>
              <tbody>
                {agreements.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-white/30">No agreements found</td></tr>
                )}
                {agreements.map(a => (
                  <>
                    <tr key={a.id} className="hover:bg-white/2 cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      <td className="py-3 border-b border-white/5 text-white font-medium px-6">{a.company_name}</td>
                      <td className="py-3 border-b border-white/5 text-white/70 px-4">{a.plan_name}</td>
                      <td className="py-3 border-b border-white/5 text-white/70 px-4">{a.signed_name}</td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{a.signed_email}</td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(a.signed_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs">{a.agreement_version}</td>
                      <td className="py-3 border-b border-white/5 px-4 text-center">
                        {a.showcase_rights_checkbox ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                      <td className="py-3 border-b border-white/5 px-6">
                        <button className="text-xs text-[#FF3B1A] hover:underline">
                          {expandedId === a.id ? 'Collapse ↑' : 'View ↓'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr key={`${a.id}-expanded`}>
                        <td colSpan={8} className="px-6 py-4 bg-white/5 border-b border-white/5">
                          <div className="space-y-3">
                            <div className="flex gap-6 flex-wrap text-xs">
                              <span className="text-white/40">Accepted Terms: <span className={a.accepted_checkbox ? 'text-green-400' : 'text-red-400'}>{a.accepted_checkbox ? '✓ Yes' : '✗ No'}</span></span>
                              <span className="text-white/40">Showcase Rights: <span className={a.showcase_rights_checkbox ? 'text-green-400' : 'text-red-400'}>{a.showcase_rights_checkbox ? '✓ Yes' : '✗ No'}</span></span>
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
