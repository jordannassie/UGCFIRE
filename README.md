# UGCFIRE

UGC at the speed of fire. A platform for UGC creators and brands to manage briefs, deliver content, and get paid — all in one blazing-fast workflow.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **Deployment:** [Netlify](https://netlify.com)

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/jordannassie/UGCFIRE.git
cd UGCFIRE
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase credentials from the [Supabase dashboard](https://supabase.com/dashboard/project/_/settings/api):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before uploading to Netlify or making branches ready for review, run `npm run build` locally to make sure the production bundle succeeds and mirrors Netlify’s build step.

## Supabase Setup (optional)

1. Create a project at [supabase.com](https://supabase.com) if you need auth or database features.
2. Copy your **Project URL** and **anon public key** from **Project Settings → API**.
3. Paste them into `.env.local`. Without them, the helpers and proxy simply skip Supabase calls so the UI stays live.

## Netlify Deployment

1. Push this repo to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**.
3. Connect your GitHub repo.
4. Netlify reads `netlify.toml` + `_redirects` and wires `@netlify/plugin-nextjs` automatically.
5. Add these environment variables when ready (they can stay blank until you have them):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy! Every request rewrites to Netlify’s Next.js handler via `_redirects`.

### Netlify build settings

- **Build command:** `npm run build`
- **Publish directory:** `.next`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout + metadata
│   ├── page.tsx         # Landing page
│   └── globals.css
├── lib/
│   └── supabase/
│       ├── client.ts    # Browser Supabase client
│       └── server.ts    # Server Supabase client (RSC / API routes)
└── middleware.ts         # Session refresh middleware
```
