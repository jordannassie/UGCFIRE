'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan, Agreement } from '@/lib/types'
import { isDemoMode, DEMO_AGREEMENT, DEMO_COMPANY } from '@/lib/demoData'
import { FileText, CheckCircle, ChevronDown, ChevronUp, Shield, User, Mail, Calendar, Star } from 'lucide-react'

const CONTRACT_TITLE = 'UGCfire Service Agreement'

const CONTRACT_BODY = `UGCfire Service Agreement

This UGCfire Service Agreement is entered into between UGCfire and the client signing below.

1. Services
UGCfire provides monthly photo and video content creation services based on the selected plan. Services may include content concepts, scripts, AI-assisted production, editing, photo creative, video creative, review uploads, and final downloadable content files.

2. Selected Plan
The client agrees to the selected monthly plan shown during signup or inside the dashboard. The Growth Plan includes 8 content deliverables per month. The Scale Plan includes 20 content deliverables per month. Deliverables may include photos, videos, short-form ads, carousel images, or other approved content assets.

3. Monthly Subscription
The client understands this is a recurring monthly subscription. Billing begins after signup and payment authorization. For demo purposes, payment may be shown in test mode until Stripe is connected.

4. Client Responsibilities
The client agrees to provide accurate brand information, product details, website links, examples, creative direction, and any necessary assets. Delays in providing materials may delay production.

5. Revisions
The client may request reasonable revisions through the UGCFire dashboard. Revision requests must be submitted clearly through the review system, video comments, or team chat.

6. Approval and Delivery
Content marked Ready for Review may be approved, downloaded, or sent back for revision. Once approved or delivered, content will appear in the client's Content Bins.

7. Content Ownership
After payment is successfully completed, the client may use approved and delivered content for their own marketing, advertising, website, and social media channels.

8. AI-Assisted Production
The client understands UGCFire may use AI-assisted tools, creative software, editing tools, stock assets, avatars, voice tools, or other production systems to create content.

9. No Guaranteed Results
UGCFire does not guarantee specific advertising results, sales, leads, revenue, views, engagement, or platform performance. UGCFire provides content production services only.

10. Cancellation
The client may cancel according to the billing terms shown in their account. Cancellation stops future billing but does not automatically refund previous payments.

11. Confidentiality
UGCFire agrees to treat private client brand information, creative direction, and campaign details as confidential unless permission is given to share work publicly.

12. Marketing, Portfolio, and Showcase Rights
The client grants UGCFire permission to display, share, repost, publish, and use approved or delivered content created by UGCFire for UGCFire's own marketing, portfolio, case studies, social media, website, sales materials, advertising, and promotional purposes.

13. Agreement Acceptance
By typing their name, checking the agreement boxes, and clicking Sign Agreement & Continue, the client agrees to this Service Agreement electronically.

Signed electronically by the client.`

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AgreementPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [existingAgreement, setExistingAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [contractExpanded, setContractExpanded] = useState(false)

  const [signedName, setSignedName] = useState('')
  const [signedEmail, setSignedEmail] = useState('')
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false)
  const [showcaseCheckbox, setShowcaseCheckbox] = useState(false)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as Company)
        setExistingAgreement(DEMO_AGREEMENT as Agreement)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      if (co) {
        if (co.plan_id) {
          const { data: planData } = await supabase.from('plans').select('*').eq('id', co.plan_id).single()
          if (planData) setPlan(planData as Plan)
        }

        const { data: agreement } = await supabase
          .from('agreements')
          .select('*')
          .eq('company_id', co.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (agreement) setExistingAgreement(agreement as Agreement)

        // Pre-fill email from auth
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) setSignedEmail(user.email)
      }

      setLoading(false)
    }
    load()
  }, [])

  const canSubmit = signedName.trim().length > 1 && acceptedCheckbox && showcaseCheckbox

  async function handleSign() {
    if (!company || !canSubmit) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('agreements').insert({
        company_id: company.id,
        user_id: user.id,
        plan_id: company.plan_id,
        agreement_version: '1.0',
        contract_title: CONTRACT_TITLE,
        contract_body: CONTRACT_BODY,
        signed_name: signedName.trim(),
        signed_email: signedEmail.trim() || (user.email ?? ''),
        accepted_checkbox: acceptedCheckbox,
        showcase_rights_checkbox: showcaseCheckbox,
        signed_at: new Date().toISOString(),
      })

      await supabase.from('companies').update({ onboarding_status: 'needs_checkout' }).eq('id', company.id)

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: 'agreement_signed',
        event_message: 'Client signed the UGCfire Service Agreement',
        metadata: { signed_name: signedName.trim(), plan_id: company.plan_id },
      })

      router.push('/dashboard/checkout')
    } catch {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!company?.plan_id) {
    return (
      <div className="max-w-2xl">
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
          <FileText className="text-[#FF3B1A] mx-auto mb-4" size={32} />
          <p className="text-white/60 mb-4">You need to select a plan before signing the agreement.</p>
          <a href="/dashboard/plan" className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition inline-block">
            Choose a Plan
          </a>
        </div>
      </div>
    )
  }

  if (existingAgreement) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Service Agreement</h1>
            <p className="text-white/40 mt-1 text-sm">Your agreement is on file and legally binding.</p>
          </div>
          <span className="bg-green-500/20 text-green-300 text-sm font-bold px-4 py-1.5 rounded-full border border-green-500/20 flex items-center gap-2">
            <CheckCircle size={14} />
            Signed
          </span>
        </div>

        <div className="bg-[#111] border border-green-500/20 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <Shield className="text-[#FF3B1A]" size={18} />
            <span className="text-white font-bold">Agreement Details</span>
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm">
            <div className="flex items-start gap-3">
              <User className="text-[#FF3B1A] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-white/40 text-xs mb-0.5">Signed by</p>
                <p className="text-white font-medium">{existingAgreement.signed_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-[#FF3B1A] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-white/40 text-xs mb-0.5">Email</p>
                <p className="text-white font-medium break-all">{existingAgreement.signed_email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-[#FF3B1A] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-white/40 text-xs mb-0.5">Date signed</p>
                <p className="text-white font-medium">{formatDate(existingAgreement.signed_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="text-[#FF3B1A] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-white/40 text-xs mb-0.5">Plan</p>
                <p className="text-white font-medium">{plan?.name ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
              <span className="text-white/60">Accepted terms &amp; conditions</span>
            </div>
            {existingAgreement.showcase_rights_checkbox && (
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
                <span className="text-white/60">Granted portfolio &amp; showcase rights to UGCFire</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/30">
              <FileText size={14} />
              <span>Version {existingAgreement.agreement_version}</span>
            </div>
          </div>
        </div>

        {/* View contract expandable */}
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setContractExpanded(!contractExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="text-[#FF3B1A]" size={16} />
              <span className="text-white font-medium text-sm">View Contract</span>
            </div>
            {contractExpanded ? <ChevronUp className="text-white/40" size={16} /> : <ChevronDown className="text-white/40" size={16} />}
          </button>
          {contractExpanded && (
            <div className="border-t border-white/10 p-6">
              <pre className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">{CONTRACT_BODY}</pre>
            </div>
          )}
        </div>

        <a
          href="/dashboard/checkout"
          className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition inline-block"
        >
          Continue to Checkout
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sign Agreement</h1>
        <p className="text-white/40 mt-1 text-sm">Review and sign the UGCfire Service Agreement to continue.</p>
      </div>

      {plan && (
        <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider">Selected Plan</p>
            <p className="text-white font-bold mt-0.5">{plan.name}</p>
          </div>
          <p className="text-[#FF3B1A] font-bold text-xl">${plan.price_monthly.toLocaleString()}<span className="text-white/40 text-sm font-normal">/mo</span></p>
        </div>
      )}

      {/* Contract expandable */}
      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setContractExpanded(!contractExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2">
            <FileText className="text-[#FF3B1A]" size={16} />
            <span className="text-white font-medium">{CONTRACT_TITLE}</span>
          </div>
          {contractExpanded ? <ChevronUp className="text-white/40" size={16} /> : <ChevronDown className="text-white/40" size={16} />}
        </button>
        {contractExpanded && (
          <div className="border-t border-white/10 p-6">
            <div className="max-h-80 overflow-y-auto">
              <pre className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap font-sans">{CONTRACT_BODY}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
          <Shield className="text-[#FF3B1A]" size={18} />
          <span className="text-white font-bold">Electronic Signature</span>
          <span className="ml-auto bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20">Unsigned</span>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
                <User size={12} className="text-[#FF3B1A]" />
                Full legal name
              </label>
              <input
                type="text"
                value={signedName}
                onChange={e => setSignedName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
                <Mail size={12} className="text-[#FF3B1A]" />
                Email address
              </label>
              <input
                type="email"
                value={signedEmail}
                onChange={e => setSignedEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition">
            <input
              type="checkbox"
              checked={acceptedCheckbox}
              onChange={e => setAcceptedCheckbox(e.target.checked)}
              className="mt-0.5 accent-[#FF3B1A]"
            />
            <span className="text-white/60 text-sm">I have read and agree to the UGCfire Service Agreement and all terms outlined above.</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition">
            <input
              type="checkbox"
              checked={showcaseCheckbox}
              onChange={e => setShowcaseCheckbox(e.target.checked)}
              className="mt-0.5 accent-[#FF3B1A]"
            />
            <span className="text-white/60 text-sm">I grant UGCFire permission to use approved and delivered content for portfolio, marketing, and promotional purposes (Section 12).</span>
          </label>
        </div>

        <button
          onClick={handleSign}
          disabled={!canSubmit || submitting}
          className="mt-6 w-full bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Shield size={16} />
          {submitting ? 'Signing...' : 'Sign Agreement & Continue'}
        </button>

        <p className="text-white/25 text-xs text-center mt-3">
          Electronic signature is legally binding. Your IP and timestamp are recorded.
        </p>
      </div>
    </div>
  )
}
