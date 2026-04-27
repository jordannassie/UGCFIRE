import Image from "next/image";

const metrics = [
  { label: "Creators onboarded", value: "1.8K" },
  { label: "Avg. deliverables/month", value: "4.2K" },
  { label: "Revenue tracked", value: "$42M" },
];

const showcase = [
  {
    title: "Stories that convert",
    description: "Bespoke UGC reels and shorts that tell a brand’s best life.",
    metric: "28K views",
  },
  {
    title: "Creator journeys",
    description: "Trend-proof directions that keep every upload on brand.",
    metric: "34 curated creators",
  },
  {
    title: "Rights-secure delivery",
    description: "Usage rights + reporting included with every campaign.",
    metric: "100% tracked",
  },
];

const logos = [
  "https://img.icons8.com/ios-filled/50/ffffff/triangle-logo.png",
  "https://img.icons8.com/ios-filled/50/ffffff/fast-cart.png",
  "https://img.icons8.com/ios-filled/50/ffffff/round-hexagon.png",
  "https://img.icons8.com/ios-filled/50/ffffff/diamond.png",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#040405] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="relative h-[80vh] min-h-[520px] w-full">
          <Image
            src="/images/hero-video.png"
            alt="UGC Fire hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
          <div className="absolute inset-0 flex flex-col">
            <nav className="flex items-center justify-between px-6 py-5 md:px-12">
              <div className="text-xl font-semibold tracking-tight">
                UGC<span className="text-orange-500">FIRE</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Platform
                </span>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Creators
                </span>
                <a
                  href="mailto:hello@ugcfire.com"
                  className="rounded-full border border-white/40 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/90 hover:border-orange-400 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </div>
            </nav>
            <div className="flex flex-1 flex-col justify-center px-6 text-center md:px-12">
              <p className="text-xs uppercase tracking-[0.4em] text-orange-400 mb-4">
                UGC · NEXT.JS · NETLIFY
              </p>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
                Next.js is connected and ready for Netlify.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 md:text-lg">
                UGC Fire captures raw creativity, ships it through automated
                briefs, and delivers brand-safe experiences every time. Built
                with modern React, Supabase, and ready to deploy to Netlify with
                no configuration fuss.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button className="rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-orange-400">
                  Launch Demo
                </button>
                <button className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white/80 hover:border-orange-400 hover:text-white transition-colors">
                  View Docs
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-6 right-6 bottom-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-3xl border border-white/10 bg-black/70 px-6 py-4 backdrop-blur"
            >
              <p className="text-3xl font-semibold">{metric.value}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60 mt-1">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className="px-6 py-16 md:px-12">
        <div className="max-w-6xl space-y-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl">
              The content stack for fire brands.
            </h2>
            <p className="text-white/70">
              Reimagine how UGC lands in your campaigns. Teams plan, creators
              deliver, and every file ships with rights, analytics, and clear
              approval steps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {showcase.map((card) => (
              <article
                key={card.title}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/70"
              >
                <div className="text-xs uppercase tracking-[0.4em] text-orange-400">
                  UGC
                </div>
                <p className="mt-6 text-2xl font-semibold">{card.title}</p>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  {card.description}
                </p>
                <p className="mt-6 text-xs uppercase tracking-[0.4em] text-white/50">
                  {card.metric}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-12">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-black/30 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Featured Reels</h3>
              <span className="text-sm uppercase tracking-[0.4em] text-white/60">
                Live
              </span>
            </div>
            <div className="mt-6 flex items-start gap-6">
              <Image
                src="/images/reels.png"
                alt="UGC reels grid"
                width={240}
                height={140}
                className="rounded-2xl border border-white/10 bg-black object-cover shadow-2xl shadow-black/80"
              />
              <div className="text-sm text-white/70">
                <p className="text-base font-semibold text-white">
                  Authentic creator drops
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/50">
                  32 reels | 12 creatives
                </p>
                <p className="mt-4 text-sm leading-relaxed">
                  Rapid approvals, rights tracking, and instant delivery to your
                  feeds and paid channels.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-xl font-semibold">Netlify ready.</h4>
            <p className="text-sm text-white/60">
              The project ships with Next.js 16, Turbopack, and Netlify
              middleware so every deploy runs from the same build command:
              <span className="font-semibold text-white"> npm run build</span>.
            </p>
            <ul className="space-y-3 text-xs uppercase tracking-[0.4em] text-white/50">
              <li>Build command: npm run build</li>
              <li>Publish dir: .next</li>
              <li>Plugin: @netlify/plugin-nextjs</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/60 px-6 py-12 md:px-12">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Trusted by fast-moving brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {logos.map((logo) => (
              <div key={logo} className="h-12 w-12 rounded-full bg-white/5 p-2">
                <Image
                  src={logo}
                  alt="Brand"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 pt-6 text-sm md:flex-row md:justify-between">
            <span className="font-semibold">UGC FIRE</span>
            <span className="text-white/60">© {new Date().getFullYear()}</span>
            <a href="mailto:hello@ugcfire.com" className="text-orange-500">
              hello@ugcfire.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
