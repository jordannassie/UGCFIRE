export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight">
          UGC<span className="text-orange-500">FIRE</span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href="#waitlist"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#waitlist"
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 transition-colors"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-400 mb-8">
          🔥 Now in early access
        </div>

        <h1 className="max-w-3xl text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
          UGC at the{" "}
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            speed of fire
          </span>
        </h1>

        <p className="max-w-xl text-lg md:text-xl text-white/50 leading-relaxed mb-12">
          The all-in-one platform for UGC creators and brands. Manage briefs,
          deliver content, get paid — all in one blazing-fast workflow.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            id="waitlist"
            href="mailto:hello@ugcfire.com"
            className="rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
          >
            Get Early Access
          </a>
          <a
            href="#features"
            className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            See How It Works
          </a>
        </div>
      </main>

      {/* Features */}
      <section
        id="features"
        className="px-6 md:px-12 py-24 border-t border-white/10"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need
          </h2>
          <p className="text-center text-white/50 mb-16 max-w-lg mx-auto">
            From brief to delivery, UGCFIRE handles the entire creator workflow
            so you can focus on what matters.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-orange-500/30 hover:bg-orange-500/5 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-24 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to ignite your content?
          </h2>
          <p className="text-white/50 mb-8">
            Join hundreds of creators and brands already on the waitlist.
          </p>
          <a
            href="mailto:hello@ugcfire.com"
            className="inline-block rounded-full bg-orange-500 px-10 py-4 text-base font-semibold text-white hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
          >
            Join the Waitlist →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-bold tracking-tight">
          UGC<span className="text-orange-500">FIRE</span>
        </span>
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} UGCFIRE. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Instant Briefs",
    description:
      "Send detailed creative briefs to creators in seconds. No back-and-forth, no confusion.",
  },
  {
    icon: "🎬",
    title: "Content Delivery",
    description:
      "Creators upload directly to your dashboard. Review, approve, and download in one place.",
  },
  {
    icon: "💸",
    title: "Seamless Payments",
    description:
      "Pay creators automatically on approval. No invoices, no chasing — it just works.",
  },
  {
    icon: "📊",
    title: "Campaign Analytics",
    description:
      "Track performance across all your UGC campaigns. Know what content drives results.",
  },
  {
    icon: "🤝",
    title: "Creator Network",
    description:
      "Access a curated network of vetted UGC creators across every niche and platform.",
  },
  {
    icon: "🔒",
    title: "Rights Management",
    description:
      "Usage rights collected automatically. Your legal team will thank you.",
  },
];
