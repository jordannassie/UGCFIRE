create table if not exists lead_call_scripts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  script      text not null,
  is_default  boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table lead_call_scripts enable row level security;

create policy "service role full access lead_call_scripts"
  on lead_call_scripts for all using (true) with check (true);

insert into lead_call_scripts (name, category, script, is_default) values
(
  'General Business Script',
  'General',
  'Hey, is this the owner or manager?

My name is Jordan with UGC Fire. We help local businesses turn their business into a content machine by creating short-form videos, UGC ads, and social content every month without them needing to hire a full content team.

I was looking at your business and thought you could use more video content for Instagram, TikTok, Facebook, and ads.

Are you currently creating short-form content every week?

[If yes:]
That''s great. Are you happy with the amount of content you''re getting each month, or would it help to have a team creating fresh content for you every week?

[If no:]
That''s exactly why I''m reaching out. Most businesses know they need more content, but they don''t have the time, team, or system to create it consistently.

UGC Fire gives you a monthly content team without hiring employees. We help with strategy, UGC-style videos, ads, captions, and content delivery.

Would it make sense to book a quick call so I can show you how it works?',
  true
),
(
  'Marketing Agency Script',
  'Marketing Agency',
  'Hey, is this the owner or team lead?

My name is Jordan with UGC Fire. We work with marketing agencies to add UGC video content production to their client deliverables.

I saw your agency and wanted to ask — are you currently offering short-form video or UGC content as a service for your clients?

[If yes:]
That''s great. Are you producing it in-house or outsourcing it? A lot of agencies partner with us to white-label UGC content so they can offer more without hiring a production team.

[If no:]
A lot of agencies are starting to add video content to their packages because clients are asking for it. We can be your behind-the-scenes production team.

Would it make sense to hop on a quick call to explore what a partnership would look like?',
  false
),
(
  'Med Spa Script',
  'Med Spa',
  'Hey, is this the owner or manager of the spa?

My name is Jordan with UGC Fire. We help med spas and aesthetics businesses create short-form video content for Instagram, TikTok, and ads — without them needing to film it themselves.

Most of your competitors are posting video content every week showing before and afters, treatments, and client reactions.

Are you currently posting short-form video content consistently?

[If yes:]
That''s great. Are you happy with how much content you''re getting and the results, or would it help to have a team doing it for you every month?

[If no:]
That''s actually a huge opportunity. Video content is the number one way med spas are getting new clients right now — especially on TikTok and Instagram Reels.

UGC Fire creates monthly video content your team can use for organic posts, paid ads, and retargeting.

Would it make sense to book a quick 15-minute call to show you what it looks like?',
  false
),
(
  'Restaurant Script',
  'Restaurant',
  'Hey, is this the owner or manager?

My name is Jordan with UGC Fire. We help restaurants get more customers by creating short-form food content for Instagram, TikTok, and Facebook ads.

The top restaurants in DFW are posting food videos, behind-the-scenes clips, and daily specials on social media every week — and it''s driving real foot traffic.

Are you currently posting video content on social media consistently?

[If yes:]
Great. Are you happy with the engagement and the new customers it''s bringing in, or could you use more consistent content?

[If no:]
That''s a big opportunity right now. Video content for restaurants converts really well — especially close-ups of the food, behind-the-scenes kitchen clips, and customer reactions.

We handle all the content creation for you every month — strategy, video production, captions, and delivery.

Would it make sense to book a quick call to show you how it works?',
  false
),
(
  'Gym Script',
  'Gym',
  'Hey, is this the owner or manager?

My name is Jordan with UGC Fire. We help gyms and fitness studios get more members by creating short-form video content for Instagram, TikTok, and Facebook ads.

Gyms that are growing right now are posting transformation content, workout clips, and facility tours consistently every week.

Are you currently posting video content to attract new members?

[If yes:]
Great. Is that bringing in leads consistently, or could you use more volume and variety in the content?

[If no:]
That''s a big opportunity. Short-form video is the number one way gyms are getting new sign-ups right now — especially on TikTok and Instagram.

UGC Fire creates monthly content for your gym including member transformation clips, trainer highlights, and facility reels.

Would it make sense to book a quick call to show you examples?',
  false
),
(
  'Dentist Script',
  'Dentist',
  'Hey, is this the owner or office manager?

My name is Jordan with UGC Fire. We help dental practices get more patients by creating short-form video content for Instagram, TikTok, and Facebook ads.

Most practices are using video to show smile transformations, practice tours, and patient testimonials — and it''s bringing in consistent new patients.

Are you currently posting video content to attract new patients?

[If yes:]
Great. Are you happy with the leads that''s bringing in, or would more consistent content help?

[If no:]
That''s a real opportunity. Dental content — especially smile transformations and patient stories — performs really well on social media.

We handle the strategy, video creation, captions, and monthly delivery.

Would it make sense to book a quick 15-minute call?',
  false
),
(
  'Real Estate Script',
  'Real Estate',
  'Hey, is this [Name]?

My name is Jordan with UGC Fire. We help realtors and real estate teams create short-form video content for Instagram, TikTok, and Facebook to attract buyers and sellers.

Top agents right now are posting property tours, market updates, and lifestyle content consistently — and it''s building their brand and generating inbound leads.

Are you currently doing video content for social media?

[If yes:]
Great. Is it bringing in consistent leads, or could you use more content volume without having to produce it yourself?

[If no:]
That''s a real opportunity. Realtors who post consistently on video are getting leads without cold calling.

We handle the entire content production — strategy, video, captions, and monthly delivery.

Would a quick call make sense to show you what other agents are getting?',
  false
),
(
  'Home Services Script',
  'Home Services',
  'Hey, is this the owner?

My name is Jordan with UGC Fire. We help home service businesses like roofing, HVAC, and plumbing companies get more jobs by creating short-form video content for Facebook, Instagram, and ads.

Most of the top home service companies in DFW are posting before and after job clips, customer testimonials, and process videos — and it''s bringing in consistent leads.

Are you currently posting video content to attract new customers?

[If yes:]
Great. Is that bringing in consistent leads, or could you use more volume?

[If no:]
That''s a big opportunity. Video content for home services — especially before and afters and customer reviews — converts really well for ads and organic.

We handle the strategy, video production, and monthly delivery.

Would it make sense to book a quick call?',
  false
)
on conflict do nothing;
