'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEMO_VIDEO_URL = 'https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runVArsopscz9I_slow_motion_pers_c2fb5354-bceb-4ae0-8069-d65e46035d16_1.mp4'
const PLACEHOLDER_URL = 'https://via.placeholder.com/400'

type Status = 'idle' | 'loading' | 'success' | 'error'
interface ActionState { status: Status; message: string }

function useActionState() {
  const [state, setState] = useState<ActionState>({ status: 'idle', message: '' })
  const run = async (fn: () => Promise<string>) => {
    setState({ status: 'loading', message: '' })
    try {
      const msg = await fn()
      setState({ status: 'success', message: msg })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
    }
  }
  return { state, run }
}

function SeedButton({ label, description, onRun }: { label: string; description: string; onRun: () => Promise<string> }) {
  const { state, run } = useActionState()
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-white font-semibold text-sm">{label}</h3>
          <p className="text-white/40 text-xs mt-1">{description}</p>
        </div>
        <button
          onClick={() => run(onRun)}
          disabled={state.status === 'loading'}
          className="shrink-0 bg-[#FF3B1A] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50 text-sm"
        >
          {state.status === 'loading' ? 'Running...' : 'Run'}
        </button>
      </div>
      {state.status !== 'idle' && (
        <div className={`text-xs px-3 py-2 rounded-lg ${state.status === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : state.status === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-white/5 text-white/40'}`}>
          {state.status === 'loading' ? 'Working...' : state.message}
        </div>
      )}
    </div>
  )
}

export default function AdminDemoPage() {
  const [resetConfirm, setResetConfirm] = useState(false)
  const { state: resetState, run: runReset } = useActionState()

  async function seedPlans(): Promise<string> {
    const supabase = createClient()
    const plans = [
      { name: 'Growth', slug: 'growth', price_monthly: 1497, videos_per_month: 8, description: '8 videos per month', is_active: true },
      { name: 'Scale', slug: 'scale', price_monthly: 2497, videos_per_month: 16, description: '16 videos per month', is_active: true },
    ]
    for (const plan of plans) {
      const { data: existing } = await supabase.from('plans').select('id').eq('slug', plan.slug).single()
      if (!existing) {
        const { error } = await supabase.from('plans').insert(plan)
        if (error) throw new Error(error.message)
      }
    }
    return 'Plans seeded (Growth + Scale)'
  }

  async function seedDemoAdmin(): Promise<string> {
    const supabase = createClient()
    const email = 'admin@ugcfire.com'
    const password = 'admin123456'
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError && !signUpError.message.includes('already')) throw new Error(signUpError.message)
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (profile) {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id)
      return `Admin profile updated to role=admin for ${email}. If email confirmation is enabled in Supabase, confirm the email manually in the Auth dashboard.`
    }
    return `Signup attempted for ${email}. The profile trigger will create a profile — then run this again to set role=admin. Disable email confirmation in Supabase Auth settings for demo.`
  }

  async function seedDemoClient(): Promise<string> {
    const supabase = createClient()
    const email = 'demo@ugcfire.com'
    const password = 'demo123456'

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError && !signUpError.message.includes('already')) throw new Error(signUpError.message)

    const userId = authData?.user?.id
    if (!userId) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single()
      if (!profile) throw new Error('Could not get user ID. Try disabling email confirmation in Supabase.')
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single()
    const uid = profile?.id ?? userId

    const { data: scalePlan } = await supabase.from('plans').select('id').eq('slug', 'scale').single()
    const planId = scalePlan?.id ?? null

    const { data: existing } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').single()
    if (!existing) {
      const { error: compError } = await supabase.from('companies').insert({
        name: 'Demo Brand',
        owner_user_id: uid,
        plan_id: planId,
        onboarding_status: 'completed',
        billing_status: 'active_mock',
        subscription_status: 'active_mock',
        showcase_permission: true,
        is_demo: true,
      })
      if (compError) throw new Error(compError.message)
    }
    return `Demo client seeded: ${email} / ${password}. Company "Demo Brand" created with Scale plan.`
  }

  async function seedDemoBrandBrief(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: existing } = await supabase.from('brand_briefs').select('id').eq('company_id', company.id).single()
    if (!existing) {
      const { error } = await supabase.from('brand_briefs').insert({
        company_id: company.id,
        company_name: 'Demo Brand',
        website: 'https://demobrand.com',
        offer: 'Premium skincare products that transform your skin in 30 days',
        target_customer: 'Women 25-45, health-conscious, willing to invest in self-care',
        brand_voice: 'Confident, authentic, results-focused, warm',
        video_styles: 'Founder-style talking head, lifestyle B-roll, before/after reveals',
        examples: 'https://instagram.com/p/example1, https://tiktok.com/example2',
        notes: 'Avoid competitor mentions. Always show product in natural light.',
        assets_url: PLACEHOLDER_URL,
        completed_at: new Date().toISOString(),
      })
      if (error) throw new Error(error.message)
    }
    return 'Brand brief seeded for Demo Brand'
  }

  async function seedDemoAgreement(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id, owner_user_id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'scale').single()
    const { data: existing } = await supabase.from('agreements').select('id').eq('company_id', company.id).single()
    if (!existing) {
      const { error } = await supabase.from('agreements').insert({
        company_id: company.id,
        user_id: company.owner_user_id,
        plan_id: plan?.id ?? null,
        agreement_version: 'v1.0',
        contract_title: 'UGCFire Service Agreement',
        contract_body: 'This agreement is entered into between UGCFire and Demo Brand. By signing this agreement, Demo Brand agrees to the UGCFire terms of service, content ownership rights, and showcase permissions as outlined in this document. UGCFire retains the right to use produced content for portfolio and marketing purposes with showcase rights granted.',
        signed_name: 'Demo User',
        signed_email: 'demo@ugcfire.com',
        signed_at: new Date().toISOString(),
        accepted_checkbox: true,
        showcase_rights_checkbox: true,
        ip_address: '127.0.0.1',
        user_agent: 'Demo Seed Tool',
      })
      if (error) throw new Error(error.message)
    }
    return 'Agreement seeded for Demo Brand'
  }

  async function seedDemoBilling(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'scale').single()
    const start = new Date()
    const end = new Date()
    end.setMonth(end.getMonth() + 1)
    const { error } = await supabase.from('billing_records').upsert({
      company_id: company.id,
      plan_id: plan?.id ?? null,
      billing_status: 'active_mock',
      subscription_status: 'active_mock',
      mock_mode: true,
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
    }, { onConflict: 'company_id' })
    if (error) throw new Error(error.message)
    return 'Billing record upserted for Demo Brand (active_mock)'
  }

  async function seedDemoContent(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: { user } } = await supabase.auth.getUser()

    const items = [
      { title: 'Founder-style UGC Video', media_type: 'video', status: 'ready_for_review', week_label: 'Week 1 - May 2026' },
      { title: 'Product Demo Video', media_type: 'video', status: 'approved', week_label: 'Week 1 - May 2026' },
      { title: 'Problem/Solution Short', media_type: 'video', status: 'delivered', week_label: 'Week 2 - May 2026' },
      { title: 'Product Lifestyle Photo', media_type: 'photo', status: 'ready_for_review', week_label: 'Week 2 - May 2026' },
      { title: 'Social Ad Photo Creative', media_type: 'photo', status: 'approved', week_label: 'Week 3 - May 2026' },
      { title: 'Testimonial Graphic', media_type: 'graphic', status: 'delivered', week_label: 'Week 3 - May 2026' },
      { title: 'Offer CTA Video', media_type: 'video', status: 'in_production', week_label: 'Week 4 - May 2026' },
      { title: 'Carousel Image Set', media_type: 'carousel', status: 'ready_for_review', week_label: 'Week 4 - May 2026' },
    ]

    for (const item of items) {
      const { data: existing } = await supabase.from('content_items').select('id').eq('company_id', company.id).eq('title', item.title).single()
      if (!existing) {
        await supabase.from('content_items').insert({
          company_id: company.id,
          title: item.title,
          description: `Demo content: ${item.title}`,
          media_type: item.media_type,
          status: item.status,
          week_label: item.week_label,
          content_type: 'Demo UGC',
          file_url: DEMO_VIDEO_URL,
          can_showcase: true,
          uploaded_by: user?.id ?? '',
          uploaded_at: new Date().toISOString(),
          ...(item.status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
          ...(item.status === 'approved' || item.status === 'delivered' ? { approved_at: new Date().toISOString() } : {}),
        })
      }
    }
    return '8 demo content items seeded for Demo Brand'
  }

  async function seedDemoMessages(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id, owner_user_id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: { user } } = await supabase.auth.getUser()

    const msgs = [
      { sender_role: 'client', sender_user_id: company.owner_user_id, message: 'Can we make the next batch more direct response focused?' },
      { sender_role: 'admin', sender_user_id: user?.id ?? '', message: 'Yes, we\'ll strengthen the hook and CTA.' },
    ]
    for (const msg of msgs) {
      await supabase.from('messages').insert({ ...msg, company_id: company.id, content_item_id: null })
    }
    return '2 demo messages seeded for Demo Brand'
  }

  async function seedDemoRevision(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id, owner_user_id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')
    const { data: contentItem } = await supabase.from('content_items').select('id').eq('company_id', company.id).eq('title', 'Founder-style UGC Video').single()
    if (!contentItem) throw new Error('Demo content not found. Run "Seed Demo Content" first.')
    const { data: existing } = await supabase.from('content_revisions').select('id').eq('content_item_id', contentItem.id).single()
    if (!existing) {
      await supabase.from('content_revisions').insert({
        content_item_id: contentItem.id,
        company_id: company.id,
        requested_by: company.owner_user_id,
        revision_note: 'Can you make the first 3 seconds stronger and add a clearer CTA?',
        status: 'open',
      })
    }
    return '1 demo revision request seeded'
  }

  async function seedDemoClientUploads(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id, owner_user_id').eq('name', 'Demo Brand').single()
    if (!company) throw new Error('Demo Brand not found. Run "Seed Demo Client" first.')

    const uploads = [
      { title: 'Demo Brand Logo', upload_category: 'Logo/Brand Asset' },
      { title: 'Hero Product Photo', upload_category: 'Product Photo' },
      { title: 'Raw Founder Clip', upload_category: 'Raw Video' },
      { title: 'Competitor Ad Reference', upload_category: 'Reference Video' },
      { title: 'Winning Ad Example', upload_category: 'Ad Example' },
    ]
    for (const upload of uploads) {
      const { data: existing } = await supabase.from('client_uploads').select('id').eq('company_id', company.id).eq('title', upload.title).single()
      if (!existing) {
        await supabase.from('client_uploads').insert({
          company_id: company.id,
          uploaded_by: company.owner_user_id,
          file_url: PLACEHOLDER_URL,
          file_name: `${upload.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          file_type: 'image/jpeg',
          upload_category: upload.upload_category,
          title: upload.title,
          notes: `Demo upload for ${upload.upload_category}`,
          status: 'submitted',
        })
      }
    }
    return '5 client upload records seeded for Demo Brand'
  }

  async function resetDemoData(): Promise<string> {
    const supabase = createClient()
    const { data: company } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').single()
    if (!company) return 'Demo Brand not found — nothing to reset.'

    const id = company.id
    await supabase.from('content_revisions').delete().eq('company_id', id)
    await supabase.from('messages').delete().eq('company_id', id)
    await supabase.from('client_uploads').delete().eq('company_id', id)
    await supabase.from('content_items').delete().eq('company_id', id)
    await supabase.from('brand_briefs').delete().eq('company_id', id)
    await supabase.from('agreements').delete().eq('company_id', id)
    await supabase.from('billing_records').delete().eq('company_id', id)
    await supabase.from('activity_logs').delete().eq('company_id', id)
    await supabase.from('companies').delete().eq('id', id)

    setResetConfirm(false)
    return 'Demo Brand and all related data deleted.'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Demo Tools</h1>
        <p className="text-white/40 text-sm mt-1">Seed & Reset Data</p>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
        ℹ️ Demo login from the login page now auto-seeds all data automatically via <code className="bg-white/10 px-1 rounded text-xs">/api/demo/seed</code>. Use these tools only to <strong>reset or re-seed</strong> demo data after you are already logged in as admin.
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-300 text-sm">
        ⚠️ These tools create/reset demo data. Use only in development/demo environments.
        <br />
        <span className="text-yellow-400/70 text-xs mt-1 block">Requires <code className="bg-white/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in your environment (handled server-side — never in browser code).</span>
      </div>

      {/* Seed buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <SeedButton
          label="1. Seed Plans"
          description="Insert Growth ($1,497/mo) and Scale ($2,497/mo) plans if not existing"
          onRun={seedPlans}
        />
        <SeedButton
          label="2. Seed Demo Admin"
          description="Create/update admin@ugcfire.com profile with role=admin"
          onRun={seedDemoAdmin}
        />
        <SeedButton
          label="3. Seed Demo Client"
          description="Create demo@ugcfire.com user + Demo Brand company with Scale plan"
          onRun={seedDemoClient}
        />
        <SeedButton
          label="4. Seed Demo Brand Brief"
          description="Fill in brand brief for Demo Brand company"
          onRun={seedDemoBrandBrief}
        />
        <SeedButton
          label="5. Seed Demo Agreement"
          description="Insert signed service agreement for Demo Brand"
          onRun={seedDemoAgreement}
        />
        <SeedButton
          label="6. Seed Demo Billing"
          description="Upsert billing record (active_mock) for Demo Brand"
          onRun={seedDemoBilling}
        />
        <SeedButton
          label="7. Seed Demo Content"
          description="Insert 8 demo content items across statuses for Demo Brand"
          onRun={seedDemoContent}
        />
        <SeedButton
          label="8. Seed Demo Messages"
          description="Insert 2 demo messages (client + admin) for Demo Brand"
          onRun={seedDemoMessages}
        />
        <SeedButton
          label="9. Seed Demo Revision"
          description="Insert 1 open revision request on Founder-style UGC Video"
          onRun={seedDemoRevision}
        />
        <SeedButton
          label="10. Seed Demo Client Uploads"
          description="Insert 5 client upload records (logo, photos, videos) for Demo Brand"
          onRun={seedDemoClientUploads}
        />
      </div>

      {/* Reset */}
      <div className="bg-[#111] border border-red-500/20 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm">11. Reset Demo Data</h3>
            <p className="text-white/40 text-xs mt-1">Delete ALL records for Demo Brand (content, messages, revisions, uploads, billing, agreements, company)</p>
          </div>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="shrink-0 border border-red-500/40 text-red-400 font-bold px-4 py-2 rounded-lg hover:border-red-500 hover:bg-red-500/10 transition text-sm"
            >
              Reset
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => runReset(resetDemoData)}
                disabled={resetState.status === 'loading'}
                className="shrink-0 bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
              >
                {resetState.status === 'loading' ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button onClick={() => setResetConfirm(false)} className="border border-white/10 text-white/60 px-4 py-2 rounded-lg text-sm hover:border-white/30 transition">
                Cancel
              </button>
            </div>
          )}
        </div>
        {resetState.status !== 'idle' && (
          <div className={`text-xs px-3 py-2 rounded-lg ${resetState.status === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : resetState.status === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-white/5 text-white/40'}`}>
            {resetState.status === 'loading' ? 'Deleting all demo data...' : resetState.message}
          </div>
        )}
      </div>

      {/* Credentials reference */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Demo Credentials Reference</h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-white/40 uppercase tracking-wider font-semibold">Admin Account</p>
            <p className="text-white/70">Email: <span className="text-white font-mono">admin@ugcfire.com</span></p>
            <p className="text-white/70">Password: <span className="text-white font-mono">admin123456</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-white/40 uppercase tracking-wider font-semibold">Demo Client Account</p>
            <p className="text-white/70">Email: <span className="text-white font-mono">demo@ugcfire.com</span></p>
            <p className="text-white/70">Password: <span className="text-white font-mono">demo123456</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
