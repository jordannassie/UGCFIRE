alter table leads
  add column if not exists main_contact   text,
  add column if not exists contact_title  text,
  add column if not exists contact_email  text,
  add column if not exists contact_phone  text,
  add column if not exists business_notes text;

-- Update the default General Business Script
update lead_call_scripts
set script = 'Hey, is this the owner or manager?

My name is Jordan with UGC Fire. We help businesses like yours create creator-style content for social media so more people discover you, trust you, and take action on your product or service.

I was looking at your business and thought you could probably use more short-form content for Instagram, TikTok, Facebook, and ads.

Are you currently creating short-form video content every week?

[If yes:]
That''s great. Are you happy with the amount of content you''re getting each month, or would it help to have a content creation team creating fresh videos for you every week?

[If no:]
That''s exactly why I''m reaching out. Most businesses know they need more content, but they don''t have the time, team, or system to create it consistently.

UGC Fire becomes your content creation team. We help with strategy, creator-style videos, captions, ads, and an organized Studio where your content can be reviewed, approved, and managed in one place.

Would it make sense to book a quick call so I can show you how it works?',
  updated_at = now()
where name = 'General Business Script';
