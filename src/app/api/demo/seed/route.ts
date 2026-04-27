import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEMO_VIDEO_URL = 'https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runVArsopscz9I_slow_motion_pers_c2fb5354-bceb-4ae0-8069-d65e46035d16_1.mp4'
const PLACEHOLDER_URL = 'https://via.placeholder.com/400'

const ADMIN_EMAIL = 'admin@ugcfire.com'
const ADMIN_PASSWORD = 'admin123456'
const CLIENT_EMAIL = 'demo@ugcfire.com'
const CLIENT_PASSWORD = 'demo123456'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your environment variables (never in browser code).')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST() {
  try {
    const supabase = getAdminClient()
    const results: string[] = []

    // ── 1. Ensure plans ────────────────────────────────────────────────────
    const plans = [
      { name: 'Growth', slug: 'growth', price_monthly: 1497, videos_per_month: 8, description: '8 content deliverables per month', is_active: true },
      { name: 'Scale', slug: 'scale', price_monthly: 2497, videos_per_month: 16, description: '16 content deliverables per month', is_active: true },
    ]
    for (const plan of plans) {
      const { data: existing } = await supabase.from('plans').select('id').eq('slug', plan.slug).maybeSingle()
      if (!existing) await supabase.from('plans').insert(plan)
    }
    results.push('Plans ready')

    // ── 2. List existing auth users once ───────────────────────────────────
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingUsers = listData?.users ?? []

    // ── 3. Ensure demo admin auth user ─────────────────────────────────────
    let adminUserId: string
    const existingAdmin = existingUsers.find(u => u.email === ADMIN_EMAIL)
    if (existingAdmin) {
      adminUserId = existingAdmin.id
      await supabase.auth.admin.updateUserById(adminUserId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      })
    } else {
      const { data: newAdmin, error: adminErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'UGCFire Admin', role: 'admin' },
      })
      if (adminErr) throw new Error(`Admin user creation failed: ${adminErr.message}`)
      adminUserId = newAdmin.user.id
    }

    // Give the profile trigger a moment to fire, then upsert
    await new Promise(r => setTimeout(r, 600))
    await supabase.from('profiles').upsert(
      { id: adminUserId, email: ADMIN_EMAIL, full_name: 'UGCFire Admin', role: 'admin' },
      { onConflict: 'id' }
    )
    results.push('Admin user ready')

    // ── 4. Ensure demo client auth user ────────────────────────────────────
    let clientUserId: string
    const existingClient = existingUsers.find(u => u.email === CLIENT_EMAIL)
    if (existingClient) {
      clientUserId = existingClient.id
      await supabase.auth.admin.updateUserById(clientUserId, {
        password: CLIENT_PASSWORD,
        email_confirm: true,
      })
    } else {
      const { data: newClient, error: clientErr } = await supabase.auth.admin.createUser({
        email: CLIENT_EMAIL,
        password: CLIENT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Demo Client', role: 'client' },
      })
      if (clientErr) throw new Error(`Client user creation failed: ${clientErr.message}`)
      clientUserId = newClient.user.id
    }

    await new Promise(r => setTimeout(r, 600))
    await supabase.from('profiles').upsert(
      { id: clientUserId, email: CLIENT_EMAIL, full_name: 'Demo Client', role: 'client' },
      { onConflict: 'id' }
    )
    results.push('Client user ready')

    // ── 5. Ensure Demo Brand company ───────────────────────────────────────
    const { data: scalePlan } = await supabase.from('plans').select('id').eq('slug', 'scale').maybeSingle()
    const planId = scalePlan?.id ?? null

    let companyId: string
    const { data: existingCompany } = await supabase.from('companies').select('id').eq('name', 'Demo Brand').maybeSingle()
    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany, error: compErr } = await supabase.from('companies').insert({
        name: 'Demo Brand',
        owner_user_id: clientUserId,
        plan_id: planId,
        onboarding_status: 'completed',
        billing_status: 'active_mock',
        subscription_status: 'active_mock',
        showcase_permission: true,
        is_demo: true,
      }).select('id').single()
      if (compErr) throw new Error(`Company creation failed: ${compErr.message}`)
      companyId = newCompany!.id
    }
    results.push('Demo Brand ready')

    // ── 6. Billing record ──────────────────────────────────────────────────
    const now = new Date()
    const monthEnd = new Date(now)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    await supabase.from('billing_records').upsert({
      company_id: companyId,
      plan_id: planId,
      billing_status: 'active_mock',
      subscription_status: 'active_mock',
      mock_mode: true,
      current_period_start: now.toISOString(),
      current_period_end: monthEnd.toISOString(),
    }, { onConflict: 'company_id' })
    results.push('Billing ready')

    // ── 7. Brand Brief ─────────────────────────────────────────────────────
    const { data: existingBrief } = await supabase.from('brand_briefs').select('id').eq('company_id', companyId).maybeSingle()
    if (!existingBrief) {
      await supabase.from('brand_briefs').insert({
        company_id: companyId,
        company_name: 'Demo Brand',
        website: 'https://demobrand.com',
        offer: 'Premium skincare products that transform your skin in 30 days',
        target_customer: 'Women 25-45, health-conscious, willing to invest in self-care',
        brand_voice: 'Confident, authentic, results-focused, warm',
        video_styles: 'Founder-style talking head, lifestyle B-roll, before/after reveals',
        examples: 'https://instagram.com/p/example1, https://tiktok.com/example2',
        notes: 'Avoid competitor mentions. Always show product in natural light.',
        assets_url: PLACEHOLDER_URL,
        completed_at: now.toISOString(),
      })
    }
    results.push('Brand brief ready')

    // ── 8. Agreement ───────────────────────────────────────────────────────
    const { data: existingAgreement } = await supabase.from('agreements').select('id').eq('company_id', companyId).maybeSingle()
    if (!existingAgreement) {
      await supabase.from('agreements').insert({
        company_id: companyId,
        user_id: clientUserId,
        plan_id: planId,
        agreement_version: 'v1.0',
        contract_title: 'UGCFire Service Agreement',
        contract_body: 'This agreement is entered into between UGCFire and Demo Brand. By signing, Demo Brand agrees to the UGCFire terms of service, content ownership rights, and showcase permissions as outlined. UGCFire retains the right to use produced content for portfolio and marketing purposes with showcase rights granted.',
        signed_name: 'Demo User',
        signed_email: CLIENT_EMAIL,
        signed_at: now.toISOString(),
        accepted_checkbox: true,
        showcase_rights_checkbox: true,
        ip_address: '127.0.0.1',
        user_agent: 'Demo Seed Route',
      })
    }
    results.push('Agreement ready')

    // ── 9. Content items ───────────────────────────────────────────────────
    const contentItems = [
      { title: 'Founder-style UGC Video',   media_type: 'video',    status: 'ready_for_review', week_label: 'Week 1 - May 2026' },
      { title: 'Product Demo Video',         media_type: 'video',    status: 'approved',         week_label: 'Week 1 - May 2026' },
      { title: 'Problem/Solution Short',     media_type: 'video',    status: 'delivered',        week_label: 'Week 2 - May 2026' },
      { title: 'Product Lifestyle Photo',    media_type: 'photo',    status: 'ready_for_review', week_label: 'Week 2 - May 2026' },
      { title: 'Social Ad Photo Creative',   media_type: 'photo',    status: 'approved',         week_label: 'Week 3 - May 2026' },
      { title: 'Testimonial Graphic',        media_type: 'graphic',  status: 'delivered',        week_label: 'Week 3 - May 2026' },
      { title: 'Offer CTA Video',            media_type: 'video',    status: 'in_production',    week_label: 'Week 4 - May 2026' },
      { title: 'Carousel Image Set',         media_type: 'carousel', status: 'ready_for_review', week_label: 'Week 4 - May 2026' },
    ]
    for (const item of contentItems) {
      const { data: existing } = await supabase.from('content_items').select('id').eq('company_id', companyId).eq('title', item.title).maybeSingle()
      if (!existing) {
        await supabase.from('content_items').insert({
          company_id: companyId,
          title: item.title,
          description: `Demo content: ${item.title}`,
          media_type: item.media_type,
          status: item.status,
          week_label: item.week_label,
          content_type: 'Demo UGC',
          file_url: DEMO_VIDEO_URL,
          can_showcase: true,
          uploaded_by: adminUserId,
          uploaded_at: now.toISOString(),
          ...(item.status === 'delivered' ? { delivered_at: now.toISOString() } : {}),
          ...(item.status === 'approved' || item.status === 'delivered' ? { approved_at: now.toISOString() } : {}),
        })
      }
    }
    results.push('Content items ready')

    // ── 10. Messages ───────────────────────────────────────────────────────
    const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
    if ((msgCount ?? 0) === 0) {
      await supabase.from('messages').insert([
        { company_id: companyId, content_item_id: null, sender_role: 'client', sender_user_id: clientUserId, message: 'Can we make the next batch more direct response focused?' },
        { company_id: companyId, content_item_id: null, sender_role: 'admin', sender_user_id: adminUserId, message: "Yes — we'll strengthen the hook and add a sharper CTA on Week 3." },
      ])
    }
    results.push('Messages ready')

    // ── 11. Revision request ───────────────────────────────────────────────
    const { data: founderVideo } = await supabase.from('content_items').select('id').eq('company_id', companyId).eq('title', 'Founder-style UGC Video').maybeSingle()
    if (founderVideo) {
      const { data: existingRev } = await supabase.from('content_revisions').select('id').eq('content_item_id', founderVideo.id).maybeSingle()
      if (!existingRev) {
        await supabase.from('content_revisions').insert({
          content_item_id: founderVideo.id,
          company_id: companyId,
          requested_by: clientUserId,
          revision_note: 'Can you make the first 3 seconds stronger and add a clearer CTA?',
          status: 'open',
        })
      }
    }
    results.push('Revision ready')

    // ── 12. Client uploads ─────────────────────────────────────────────────
    const clientUploads = [
      { title: 'Demo Brand Logo',         upload_category: 'Logo/Brand Asset' },
      { title: 'Hero Product Photo',      upload_category: 'Product Photo' },
      { title: 'Raw Founder Clip',        upload_category: 'Raw Video' },
      { title: 'Competitor Ad Reference', upload_category: 'Reference Video' },
      { title: 'Winning Ad Example',      upload_category: 'Ad Example' },
    ]
    for (const upload of clientUploads) {
      const { data: existing } = await supabase.from('client_uploads').select('id').eq('company_id', companyId).eq('title', upload.title).maybeSingle()
      if (!existing) {
        await supabase.from('client_uploads').insert({
          company_id: companyId,
          uploaded_by: clientUserId,
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
    results.push('Client uploads ready')

    // ── 13. Activity logs ──────────────────────────────────────────────────
    const { count: logCount } = await supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
    if ((logCount ?? 0) === 0) {
      await supabase.from('activity_logs').insert([
        { company_id: companyId, actor_user_id: clientUserId, actor_role: 'client', event_type: 'onboarding_completed', event_message: 'Demo Brand completed onboarding.' },
        { company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'content_uploaded', event_message: 'Week 1 content uploaded for Demo Brand.' },
      ])
    }
    results.push('Activity logs ready')

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[demo/seed]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
