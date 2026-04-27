export type Role = 'client' | 'admin'
export type OnboardingStatus = 'needs_plan' | 'needs_agreement' | 'needs_checkout' | 'needs_brand_brief' | 'completed'
export type BillingStatus = 'inactive' | 'active_mock' | 'past_due_mock' | 'canceled_mock'
export type SubscriptionStatus = 'none' | 'active_mock' | 'canceled_mock'
export type ContentStatus = 'in_production' | 'ready_for_review' | 'revision_requested' | 'approved' | 'delivered' | 'archived'
export type MediaType = 'photo' | 'video' | 'carousel' | 'graphic' | 'other'
export type RevisionStatus = 'open' | 'in_progress' | 'completed'
export type UploadStatus = 'submitted' | 'reviewed' | 'used' | 'archived'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  website: string | null
  owner_user_id: string
  plan_id: string | null
  onboarding_status: OnboardingStatus
  billing_status: BillingStatus
  subscription_status: SubscriptionStatus
  showcase_permission: boolean
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  slug: string
  price_monthly: number
  videos_per_month: number
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Agreement {
  id: string
  company_id: string
  user_id: string
  plan_id: string
  agreement_version: string
  contract_title: string
  contract_body: string
  signed_name: string
  signed_email: string
  accepted_checkbox: boolean
  showcase_rights_checkbox: boolean
  signed_at: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface BrandBrief {
  id: string
  company_id: string
  company_name: string
  website: string | null
  offer: string | null
  target_customer: string | null
  brand_voice: string | null
  video_styles: string | null
  examples: string | null
  notes: string | null
  assets_url: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ContentItem {
  id: string
  company_id: string
  title: string
  description: string | null
  week_label: string | null
  content_type: string | null
  media_type: MediaType
  status: ContentStatus
  file_url: string | null
  thumbnail_url: string | null
  file_name: string | null
  file_size: number | null
  uploaded_by: string
  uploaded_at: string
  approved_at: string | null
  delivered_at: string | null
  deleted_at: string | null
  can_showcase: boolean
  created_at: string
  updated_at: string
}

export interface ContentRevision {
  id: string
  content_item_id: string
  company_id: string
  requested_by: string
  revision_note: string
  status: RevisionStatus
  created_at: string
  completed_at: string | null
}

export interface Message {
  id: string
  company_id: string
  content_item_id: string | null
  sender_user_id: string
  sender_role: Role
  message: string
  attachment_url: string | null
  created_at: string
  read_at: string | null
}

export interface ClientUpload {
  id: string
  company_id: string
  uploaded_by: string
  file_url: string
  file_name: string
  file_type: string | null
  file_size: number | null
  upload_category: string
  title: string
  notes: string | null
  status: UploadStatus
  created_at: string
  reviewed_at: string | null
  archived_at: string | null
}

export interface BillingRecord {
  id: string
  company_id: string
  plan_id: string | null
  billing_status: BillingStatus
  subscription_status: SubscriptionStatus
  mock_mode: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  company_id: string | null
  actor_user_id: string | null
  actor_role: Role | null
  event_type: string
  event_message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: string
  company_id: string | null
  user_id: string | null
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}
