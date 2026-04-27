import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEMO_VIDEO_URL = 'https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runVArsopscz9I_slow_motion_pers_c2fb5354-bceb-4ae0-8069-d65e46035d16_1.mp4'
const DEMO_PHOTO_URL = 'https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/images/1a75fdad-d79b-4df6-a855-d10aa65335c7.png'

const ADMIN_EMAIL = 'admin@ugcfire.com'
const ADMIN_PASSWORD = 'admin123456'
const CLIENT_EMAIL = 'demo@ugcfire.com'
const CLIENT_PASSWORD = 'demo123456'

function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { supabaseUrl, serviceRoleKey }
}

// GET /api/demo/seed — debug env check (never returns actual key values)
export async function GET() {
  const { supabaseUrl, serviceRoleKey } = getEnv()
  return NextResponse.json({
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    serviceRoleKeyLength: serviceRoleKey ? serviceRoleKey.length : 0,
    ready: Boolean(supabaseUrl && serviceRoleKey),
  })
}

export async function POST() {
  const { supabaseUrl, serviceRoleKey } = getEnv()

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required environment variables on the server.',
        debug: {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasServiceRoleKey: Boolean(serviceRoleKey),
          serviceRoleKeyLength: serviceRoleKey ? serviceRoleKey.length : 0,
        },
      },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const results: string[] = []
    const now = new Date()

    // ── 1. Plans ───────────────────────────────────────────────────────────
    const plans = [
      { name: 'Growth', slug: 'growth', price_monthly: 1497, videos_per_month: 8,  description: '8 content deliverables per month',  is_active: true },
      { name: 'Scale',  slug: 'scale',  price_monthly: 2497, videos_per_month: 16, description: '16 content deliverables per month', is_active: true },
    ]
    for (const plan of plans) {
      const { data: ex } = await supabase.from('plans').select('id').eq('slug', plan.slug).maybeSingle()
      if (!ex) await supabase.from('plans').insert(plan)
    }
    results.push('Plans ready')

    // ── 2. Auth users ──────────────────────────────────────────────────────
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingUsers = listData?.users ?? []

    async function ensureUser(email: string, password: string, fullName: string, role: string) {
      const existing = existingUsers.find(u => u.email === email)
      let uid: string
      if (existing) {
        uid = existing.id
        await supabase.auth.admin.updateUserById(uid, { password, email_confirm: true })
      } else {
        const { data: nu, error: ne } = await supabase.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { full_name: fullName, role },
        })
        if (ne) throw new Error(`User creation failed for ${email}: ${ne.message}`)
        uid = nu.user.id
      }
      await new Promise(r => setTimeout(r, 400))
      await supabase.from('profiles').upsert(
        { id: uid, email, full_name: fullName, role },
        { onConflict: 'id' }
      )
      return uid
    }

    const adminId  = await ensureUser(ADMIN_EMAIL,  ADMIN_PASSWORD,  'UGCFire Admin', 'admin')
    const clientId = await ensureUser(CLIENT_EMAIL, CLIENT_PASSWORD, 'Demo Client',   'client')
    results.push('Auth users ready')

    // ── 3. Fetch plans ─────────────────────────────────────────────────────
    const { data: growthPlan } = await supabase.from('plans').select('id').eq('slug', 'growth').maybeSingle()
    const { data: scalePlan  } = await supabase.from('plans').select('id').eq('slug', 'scale').maybeSingle()
    const growthId = growthPlan?.id ?? null
    const scaleId  = scalePlan?.id  ?? null

    // ── 4. Companies ───────────────────────────────────────────────────────
    interface CompanySpec {
      name: string
      ownerId: string
      planId: string | null
      billingStatus: string
      subscriptionStatus: string
      onboardingStatus: string
    }
    const companySpecs: CompanySpec[] = [
      { name: 'Demo Brand',       ownerId: clientId, planId: scaleId,  billingStatus: 'active_mock',   subscriptionStatus: 'active_mock',   onboardingStatus: 'completed' },
      { name: 'Apex Fitness Co.', ownerId: clientId, planId: growthId, billingStatus: 'active_mock',   subscriptionStatus: 'active_mock',   onboardingStatus: 'completed' },
      { name: 'Glow Skin Studio', ownerId: clientId, planId: scaleId,  billingStatus: 'active_mock',   subscriptionStatus: 'active_mock',   onboardingStatus: 'completed' },
      { name: 'NorthStar Roofing',ownerId: clientId, planId: growthId, billingStatus: 'past_due_mock', subscriptionStatus: 'past_due_mock', onboardingStatus: 'completed' },
    ]

    const companyIds: Record<string, string> = {}
    for (const spec of companySpecs) {
      const { data: ex } = await supabase.from('companies').select('id').eq('name', spec.name).maybeSingle()
      if (ex) {
        companyIds[spec.name] = ex.id
      } else {
        const { data: nc, error: ce } = await supabase.from('companies').insert({
          name: spec.name,
          owner_user_id: spec.ownerId,
          plan_id: spec.planId,
          onboarding_status: spec.onboardingStatus,
          billing_status: spec.billingStatus,
          subscription_status: spec.subscriptionStatus,
          showcase_permission: true,
          is_demo: true,
        }).select('id').single()
        if (ce) throw new Error(`Company creation failed for ${spec.name}: ${ce.message}`)
        companyIds[spec.name] = nc!.id
      }
    }
    results.push('Companies ready')

    // ── 5. Billing records ─────────────────────────────────────────────────
    const monthEnd = new Date(now); monthEnd.setMonth(monthEnd.getMonth() + 1)
    for (const spec of companySpecs) {
      const cid = companyIds[spec.name]
      await supabase.from('billing_records').upsert({
        company_id: cid,
        plan_id: spec.planId,
        billing_status: spec.billingStatus,
        subscription_status: spec.subscriptionStatus,
        mock_mode: true,
        current_period_start: now.toISOString(),
        current_period_end: monthEnd.toISOString(),
      }, { onConflict: 'company_id' })
    }
    results.push('Billing records ready')

    // ── 6. Brand Briefs ────────────────────────────────────────────────────
    const briefs: Record<string, object> = {
      'Demo Brand': {
        company_name: 'Demo Brand',
        website: 'https://demobrand.com',
        offer: 'Premium skincare products that transform your skin in 30 days',
        target_customer: 'Women 25-45, health-conscious, willing to invest in self-care',
        brand_voice: 'Confident, authentic, results-focused, warm',
        video_styles: 'Founder-style talking head, lifestyle B-roll, before/after reveals',
        examples: 'https://instagram.com/p/example1, https://tiktok.com/example2',
        notes: 'Avoid competitor mentions. Always show product in natural light.',
        assets_url: DEMO_PHOTO_URL,
        completed_at: now.toISOString(),
      },
      'Apex Fitness Co.': {
        company_name: 'Apex Fitness Co.',
        website: 'https://apexfitness.com',
        offer: 'Science-backed resistance training programs and premium supplements',
        target_customer: 'Men and women 22-40 serious about fitness transformation',
        brand_voice: 'Bold, motivational, no-BS, performance-driven',
        video_styles: 'Workout footage, transformation stories, supplement demos, talking head',
        examples: 'https://instagram.com/p/apex1, https://tiktok.com/apex2',
        notes: 'Always show real athletes. No stock footage. Include #ApexFit hashtag.',
        assets_url: DEMO_PHOTO_URL,
        completed_at: now.toISOString(),
      },
      'Glow Skin Studio': {
        company_name: 'Glow Skin Studio',
        website: 'https://glowskinstudio.com',
        offer: 'Luxury facial treatments and professional skincare products for radiant skin',
        target_customer: 'Women 30-55, upscale markets, disposable income, value self-care',
        brand_voice: 'Elegant, calming, expert, results-focused, aspirational',
        video_styles: 'Treatment ASMR, before/after reveals, testimonial-style, product close-up',
        examples: 'https://instagram.com/p/glow1',
        notes: 'Soft lighting only. Minimal text on screen. Let visuals speak.',
        assets_url: DEMO_PHOTO_URL,
        completed_at: now.toISOString(),
      },
      'NorthStar Roofing': {
        company_name: 'NorthStar Roofing',
        website: 'https://northstarroofing.com',
        offer: 'Premium residential roofing replacement and repair with lifetime warranty',
        target_customer: 'Homeowners 35-65, worried about storm damage, looking for trusted contractors',
        brand_voice: 'Trustworthy, authoritative, local-focused, community-driven',
        video_styles: 'Before/after roof replacement, customer testimonials, team intro, job-site footage',
        examples: 'https://instagram.com/p/ns1',
        notes: 'Always mention the lifetime warranty. Use local landmarks where possible.',
        assets_url: DEMO_PHOTO_URL,
        completed_at: now.toISOString(),
      },
    }
    for (const [name, brief] of Object.entries(briefs)) {
      const cid = companyIds[name]
      const { data: ex } = await supabase.from('brand_briefs').select('id').eq('company_id', cid).maybeSingle()
      if (!ex) await supabase.from('brand_briefs').insert({ company_id: cid, ...brief })
    }
    results.push('Brand briefs ready')

    // ── 7. Agreements ──────────────────────────────────────────────────────
    const CONTRACT_BODY = 'This agreement is entered into between UGCFire and the client company. By signing, the client agrees to the UGCFire terms of service, content ownership rights, revision policy, and showcase permissions. UGCFire retains the right to use produced content for portfolio and marketing purposes with showcase rights granted.'
    for (const spec of companySpecs) {
      const cid = companyIds[spec.name]
      const { data: ex } = await supabase.from('agreements').select('id').eq('company_id', cid).maybeSingle()
      if (!ex) {
        await supabase.from('agreements').insert({
          company_id: cid,
          user_id: spec.ownerId,
          plan_id: spec.planId,
          agreement_version: 'v1.0',
          contract_title: 'UGCFire Service Agreement',
          contract_body: CONTRACT_BODY,
          signed_name: `${spec.name} Owner`,
          signed_email: CLIENT_EMAIL,
          signed_at: now.toISOString(),
          accepted_checkbox: true,
          showcase_rights_checkbox: true,
          ip_address: '127.0.0.1',
          user_agent: 'Demo Seed Route',
        })
      }
    }
    results.push('Agreements ready')

    // ── 8. Content items ───────────────────────────────────────────────────
    interface ContentSpec { title: string; media_type: string; status: string; week_label: string; content_type: string }
    const contentByCompany: Record<string, ContentSpec[]> = {
      'Demo Brand': [
        { title: 'Founder-style UGC Video',  media_type: 'video',    status: 'ready_for_review', week_label: 'Week 1 - May 2026', content_type: 'Talking Head' },
        { title: 'Product Demo Video',        media_type: 'video',    status: 'approved',         week_label: 'Week 1 - May 2026', content_type: 'Product Demo' },
        { title: 'Problem/Solution Short',    media_type: 'video',    status: 'delivered',        week_label: 'Week 2 - May 2026', content_type: 'Hook/Problem' },
        { title: 'Product Lifestyle Photo',   media_type: 'photo',    status: 'ready_for_review', week_label: 'Week 2 - May 2026', content_type: 'Lifestyle' },
        { title: 'Social Ad Photo Creative',  media_type: 'photo',    status: 'approved',         week_label: 'Week 3 - May 2026', content_type: 'Ad Creative' },
        { title: 'Testimonial Graphic',       media_type: 'graphic',  status: 'delivered',        week_label: 'Week 3 - May 2026', content_type: 'Social Proof' },
        { title: 'Offer CTA Video',           media_type: 'video',    status: 'in_production',    week_label: 'Week 4 - May 2026', content_type: 'Direct Response' },
        { title: 'Carousel Image Set',        media_type: 'carousel', status: 'ready_for_review', week_label: 'Week 4 - May 2026', content_type: 'Carousel' },
      ],
      'Apex Fitness Co.': [
        { title: 'Transformation Story Video',    media_type: 'video', status: 'delivered',        week_label: 'Week 1 - May 2026', content_type: 'Testimonial' },
        { title: 'Supplement Stack Demo',         media_type: 'video', status: 'approved',         week_label: 'Week 1 - May 2026', content_type: 'Product Demo' },
        { title: 'Workout Highlights Reel',       media_type: 'video', status: 'ready_for_review', week_label: 'Week 2 - May 2026', content_type: 'Lifestyle' },
        { title: 'Gym Lifestyle Photo Set',       media_type: 'photo', status: 'approved',         week_label: 'Week 2 - May 2026', content_type: 'Lifestyle' },
        { title: 'Pre-Workout Offer Video',       media_type: 'video', status: 'in_production',    week_label: 'Week 3 - May 2026', content_type: 'Direct Response' },
        { title: 'Progress Before/After Photo',   media_type: 'photo', status: 'ready_for_review', week_label: 'Week 3 - May 2026', content_type: 'Before/After' },
      ],
      'Glow Skin Studio': [
        { title: 'Facial Treatment ASMR Video',   media_type: 'video', status: 'approved',         week_label: 'Week 1 - May 2026', content_type: 'ASMR/Process' },
        { title: 'Client Glow Transformation',    media_type: 'video', status: 'delivered',        week_label: 'Week 2 - May 2026', content_type: 'Testimonial' },
        { title: 'Product Close-Up Photo Set',    media_type: 'photo', status: 'ready_for_review', week_label: 'Week 2 - May 2026', content_type: 'Product Shot' },
        { title: 'Studio Ambiance Reel',          media_type: 'video', status: 'ready_for_review', week_label: 'Week 3 - May 2026', content_type: 'Brand Story' },
        { title: 'Skincare Routine Video',        media_type: 'video', status: 'in_production',    week_label: 'Week 4 - May 2026', content_type: 'Tutorial' },
      ],
      'NorthStar Roofing': [
        { title: 'Before/After Roof Reveal',      media_type: 'video', status: 'delivered',        week_label: 'Week 1 - May 2026', content_type: 'Before/After' },
        { title: 'Customer Testimonial Video',    media_type: 'video', status: 'revision_requested', week_label: 'Week 2 - May 2026', content_type: 'Testimonial' },
        { title: 'Roof Replacement Photo Set',    media_type: 'photo', status: 'approved',         week_label: 'Week 2 - May 2026', content_type: 'Project Photo' },
        { title: 'Team Introduction Video',       media_type: 'video', status: 'ready_for_review', week_label: 'Week 3 - May 2026', content_type: 'Brand Story' },
      ],
    }

    for (const [companyName, items] of Object.entries(contentByCompany)) {
      const cid = companyIds[companyName]
      for (const item of items) {
        const { data: ex } = await supabase.from('content_items').select('id').eq('company_id', cid).eq('title', item.title).maybeSingle()
        if (!ex) {
          await supabase.from('content_items').insert({
            company_id: cid,
            title: item.title,
            description: `Demo content: ${item.title}`,
            media_type: item.media_type,
            status: item.status,
            week_label: item.week_label,
            content_type: item.content_type,
            file_url: item.media_type === 'photo' ? DEMO_PHOTO_URL : DEMO_VIDEO_URL,
            can_showcase: true,
            uploaded_by: adminId,
            uploaded_at: now.toISOString(),
            ...(item.status === 'delivered'   ? { delivered_at: now.toISOString() }                              : {}),
            ...(item.status === 'approved' || item.status === 'delivered' ? { approved_at: now.toISOString() } : {}),
          })
        }
      }
    }
    results.push('Content items ready')

    // ── 9. Client uploads ──────────────────────────────────────────────────
    const uploadsByCompany: Record<string, { title: string; category: string; status: string }[]> = {
      'Demo Brand': [
        { title: 'Demo Brand Logo',         category: 'Logo/Brand Asset',  status: 'reviewed' },
        { title: 'Hero Product Photo',       category: 'Product Photo',     status: 'used' },
        { title: 'Raw Founder Clip',         category: 'Raw Video',         status: 'submitted' },
        { title: 'Competitor Ad Reference',  category: 'Reference Video',   status: 'submitted' },
        { title: 'Winning Ad Example',       category: 'Ad Example',        status: 'reviewed' },
      ],
      'Apex Fitness Co.': [
        { title: 'Apex Logo Files',          category: 'Logo/Brand Asset',  status: 'reviewed' },
        { title: 'Gym Location Photos',      category: 'Product Photo',     status: 'submitted' },
        { title: 'Athlete Raw Footage',      category: 'Raw Video',         status: 'used' },
      ],
      'Glow Skin Studio': [
        { title: 'Studio Logo',              category: 'Logo/Brand Asset',  status: 'reviewed' },
        { title: 'Treatment Room Photos',    category: 'Product Photo',     status: 'submitted' },
        { title: 'Client Consent Form',      category: 'Other',             status: 'submitted' },
      ],
      'NorthStar Roofing': [
        { title: 'Company Logo',             category: 'Logo/Brand Asset',  status: 'reviewed' },
        { title: 'Job Site Photos - Job 1',  category: 'Product Photo',     status: 'used' },
      ],
    }

    for (const [companyName, uploads] of Object.entries(uploadsByCompany)) {
      const cid = companyIds[companyName]
      for (const upload of uploads) {
        const { data: ex } = await supabase.from('client_uploads').select('id').eq('company_id', cid).eq('title', upload.title).maybeSingle()
        if (!ex) {
          await supabase.from('client_uploads').insert({
            company_id: cid,
            uploaded_by: clientId,
            file_url: DEMO_PHOTO_URL,
            file_name: `${upload.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
            file_type: 'image/jpeg',
            upload_category: upload.category,
            title: upload.title,
            notes: `Demo upload: ${upload.category}`,
            status: upload.status,
          })
        }
      }
    }
    results.push('Client uploads ready')

    // ── 10. Messages ───────────────────────────────────────────────────────
    const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('company_id', companyIds['Demo Brand'])
    if ((msgCount ?? 0) === 0) {
      await supabase.from('messages').insert([
        { company_id: companyIds['Demo Brand'], content_item_id: null, sender_role: 'client', sender_user_id: clientId, message: 'Can we make the next batch more direct-response focused?' },
        { company_id: companyIds['Demo Brand'], content_item_id: null, sender_role: 'admin',  sender_user_id: adminId,  message: "Yes — we'll strengthen the hooks and add a sharper CTA on Week 3." },
        { company_id: companyIds['Demo Brand'], content_item_id: null, sender_role: 'client', sender_user_id: clientId, message: 'Can we also include more product close-ups?' },
        { company_id: companyIds['Demo Brand'], content_item_id: null, sender_role: 'admin',  sender_user_id: adminId,  message: 'Absolutely — upload any product shots in My Uploads and we will use them.' },
      ])
    }

    for (const name of ['Apex Fitness Co.', 'Glow Skin Studio', 'NorthStar Roofing']) {
      const cid = companyIds[name]
      const { count: c } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('company_id', cid)
      if ((c ?? 0) === 0) {
        await supabase.from('messages').insert([
          { company_id: cid, content_item_id: null, sender_role: 'client', sender_user_id: clientId, message: 'Hey team, when will Week 3 content be ready?' },
          { company_id: cid, content_item_id: null, sender_role: 'admin',  sender_user_id: adminId,  message: 'Targeting end of this week — we will notify you as soon as it is uploaded.' },
        ])
      }
    }
    results.push('Messages ready')

    // ── 11. Revisions ──────────────────────────────────────────────────────
    const { data: founderVideo } = await supabase.from('content_items').select('id').eq('company_id', companyIds['Demo Brand']).eq('title', 'Founder-style UGC Video').maybeSingle()
    if (founderVideo) {
      const { data: exRev } = await supabase.from('content_revisions').select('id').eq('content_item_id', founderVideo.id).maybeSingle()
      if (!exRev) {
        await supabase.from('content_revisions').insert({
          content_item_id: founderVideo.id,
          company_id: companyIds['Demo Brand'],
          requested_by: clientId,
          revision_note: 'Can you make the first 3 seconds stronger and add a clearer CTA at the end?',
          status: 'open',
        })
      }
    }

    const { data: northStarVideo } = await supabase.from('content_items').select('id').eq('company_id', companyIds['NorthStar Roofing']).eq('title', 'Customer Testimonial Video').maybeSingle()
    if (northStarVideo) {
      const { data: exRev2 } = await supabase.from('content_revisions').select('id').eq('content_item_id', northStarVideo.id).maybeSingle()
      if (!exRev2) {
        await supabase.from('content_revisions').insert({
          content_item_id: northStarVideo.id,
          company_id: companyIds['NorthStar Roofing'],
          requested_by: clientId,
          revision_note: 'Audio quality is a bit low. Can we re-edit with background music removed?',
          status: 'open',
        })
      }
    }
    results.push('Revisions ready')

    // ── 12. Activity logs ──────────────────────────────────────────────────
    const allActivityEntries = [
      { company_id: companyIds['Demo Brand'],       actor_user_id: clientId, actor_role: 'client', event_type: 'onboarding_completed',    event_message: 'Demo Brand completed onboarding.' },
      { company_id: companyIds['Demo Brand'],       actor_user_id: adminId,  actor_role: 'admin',  event_type: 'content_uploaded',        event_message: 'Week 1 content uploaded for Demo Brand.' },
      { company_id: companyIds['Demo Brand'],       actor_user_id: clientId, actor_role: 'client', event_type: 'client_approved_video',   event_message: 'Client approved: Product Demo Video.' },
      { company_id: companyIds['Demo Brand'],       actor_user_id: clientId, actor_role: 'client', event_type: 'client_requested_revision', event_message: 'Revision requested on Founder-style UGC Video.' },
      { company_id: companyIds['Demo Brand'],       actor_user_id: clientId, actor_role: 'client', event_type: 'agreement_signed',        event_message: 'Service agreement signed.' },
      { company_id: companyIds['Demo Brand'],       actor_user_id: clientId, actor_role: 'client', event_type: 'mock_payment_completed',  event_message: 'Mock payment activated — Scale plan.' },
      { company_id: companyIds['Apex Fitness Co.'], actor_user_id: clientId, actor_role: 'client', event_type: 'onboarding_completed',    event_message: 'Apex Fitness Co. completed onboarding.' },
      { company_id: companyIds['Apex Fitness Co.'], actor_user_id: adminId,  actor_role: 'admin',  event_type: 'content_uploaded',        event_message: 'Week 1 content uploaded for Apex Fitness.' },
      { company_id: companyIds['Glow Skin Studio'], actor_user_id: clientId, actor_role: 'client', event_type: 'onboarding_completed',    event_message: 'Glow Skin Studio completed onboarding.' },
      { company_id: companyIds['Glow Skin Studio'], actor_user_id: adminId,  actor_role: 'admin',  event_type: 'content_uploaded',        event_message: 'Week 2 content uploaded for Glow Skin Studio.' },
      { company_id: companyIds['NorthStar Roofing'],actor_user_id: clientId, actor_role: 'client', event_type: 'client_requested_revision', event_message: 'NorthStar Roofing requested revision on testimonial video.' },
      { company_id: companyIds['NorthStar Roofing'],actor_user_id: adminId,  actor_role: 'admin',  event_type: 'content_uploaded',        event_message: 'Week 1 before/after content uploaded for NorthStar.' },
    ]

    for (const entry of allActivityEntries) {
      const { count } = await supabase.from('activity_logs').select('id', { count: 'exact', head: true })
        .eq('company_id', entry.company_id).eq('event_type', entry.event_type)
      if ((count ?? 0) === 0) await supabase.from('activity_logs').insert(entry)
    }
    results.push('Activity logs ready')

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[demo/seed]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
