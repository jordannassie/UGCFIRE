-- Campaign image generation jobs
CREATE TABLE IF NOT EXISTS generation_jobs (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid REFERENCES auth.users ON DELETE CASCADE,
  session_id           text NOT NULL,
  prompt               text,
  asset_number         int,
  asset_label          text,
  size                 text DEFAULT '1024x1024',
  status               text DEFAULT 'pending',
  image_url            text,
  error                text,
  reference_paths      text[],
  created_at           timestamptz DEFAULT now(),
  completed_at         timestamptz
);

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs (required for Realtime)
CREATE POLICY "users_select_own_jobs" ON generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "users_insert_own_jobs" ON generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can update any job (for process-job API)
CREATE POLICY "service_update_jobs" ON generation_jobs
  FOR UPDATE USING (true);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_generation_jobs_session ON generation_jobs (session_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user ON generation_jobs (user_id);

-- Storage bucket for generated images and reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload reference images
CREATE POLICY "auth_upload_refs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'campaign-assets' AND auth.role() = 'authenticated'
  );

-- Allow public read of campaign assets
CREATE POLICY "public_read_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-assets');

-- Allow service role to upload generated images
CREATE POLICY "service_upload_assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'campaign-assets');
