'use client';

import React, { useState, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface StatCardProps {
  value: string;
  label: string;
  delta?: string;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

interface TestimonialProps {
  quote: string;
  name: string;
  handle: string;
  revenue: string;
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const BRANDS = [
  "ClickFunnels",
  "Shopify",
  "MindValley",
  "Kajabi",
  "GoHighLevel",
  "Teachable",
  "ActiveCampaign",
  "Thinkific",
];

const FEATURES: FeatureCardProps[] = [
  {
    icon: "🔥",
    title: "AI-Matched Creators",
    desc: "We pair your offer with creators whose audience already buys what you sell — no guesswork, no wasted budget.",
  },
  {
    icon: "⚡",
    title: "48-Hour Turnaround",
    desc: "From brief to deliverable in two days. Ship ads while the hook is still hot.",
  },
  {
    icon: "📈",
    title: "Performance Analytics",
    desc: "Real-time ROAS, hook rate, and scroll-stop data so you know exactly what's working.",
  },
  {
    icon: "🎬",
    title: "Unlimited Revisions",
    desc: "We don't stop until the creative converts. Your success is the only metric that matters.",
  },
  {
    icon: "🛡️",
    title: "Brand-Safe Guarantee",
    desc: "Every creator is vetted, contracted, and briefed on your brand voice before filming.",
  },
  {
    icon: "🔄",
    title: "Evergreen Pipeline",
    desc: "Monthly fresh content drops keep your ad account from fatiguing — stay ahead of the curve.",
  },
];

const TESTIMONIALS: TestimonialProps[] = [
  {
    quote: "We went from $4k/month to $47k in 60 days. The creators UGC Fire matched us with were insane.",
    name: "Jordan Rivera",
    handle: "@jordanbuilds",
    revenue: "$47K/mo",
  },
  {
    quote: "Our hook rate jumped from 22% to 61% after the first batch. I've never seen ads perform like this.",
    name: "Ava Chen",
    handle: "@avachen_",
    revenue: "61% hook rate",
  },
  {
    quote: "Finally — a UGC partner that understands direct response. Every video feels native AND converts.",
    name: "Marcus Bell",
    handle: "@marcusbell",
    revenue: "3.8x ROAS",
  },
];

const REEL_CARDS = [
  { views: "28.3K", revenue: "$27K", delta: "+95%", label: "Adorable trend ❤️ try it now" },
  { views: "15.1K", revenue: "$18K", delta: "+14%", label: "Build it. Own your style." },
  { views: "11.8K", revenue: "$19K", delta: "+17%", label: "POV: I uploaded one selfie..." },
  { views: "8K", revenue: "$12K", delta: "+38%", label: "Make your brand anything" },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
function StatCard({ value, label, delta }: StatCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "20px 28px",
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "var(--font-bebas)",
          letterSpacing: "0.02em",
          color: "#fff",
        }}
      >
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, marginBottom: 2 }}>{delta}</div>
      )}
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "28px 24px",
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,80,40,0.4)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,59,26,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          marginBottom: 8,
          color: "#fff",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
}

function ReelCard({
  views,
  revenue,
  delta,
  label,
}: {
  views: string;
  revenue: string;
  delta: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        overflow: "hidden",
        width: 200,
        flexShrink: 0,
      }}
    >
      {/* Simulated video thumbnail */}
      <div
        style={{
          height: 280,
          background: "linear-gradient(145deg, #1f0a00, #2d1200, #1a1a1a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,59,26,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ▶
        </div>
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "#22c55e",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            letterSpacing: "0.05em",
          }}
        >
          ACTIVE
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Views</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{views}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Revenue</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{revenue}</div>
            <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>{delta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, handle, revenue }: TestimonialProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "28px 24px",
      }}
    >
      <div style={{ fontSize: 32, color: "var(--fire)", marginBottom: 12, lineHeight: 1 }}>&ldquo;</div>
      <p
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.7,
          marginBottom: 20,
        }}
      >
        {quote}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{handle}</div>
        </div>
        <div
          style={{
            background: "rgba(255,59,26,0.15)",
            border: "1px solid rgba(255,59,26,0.3)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            color: "#ff8060",
          }}
        >
          {revenue}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const fireStyle: React.CSSProperties = { color: "#FF3B1A" };
  const sectionHead: React.CSSProperties = {
    textAlign: "center",
    marginBottom: 64,
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        :root {
          --fire: #FF3B1A;
          --black: #080808;
          --font-bebas: 'Bebas Neue', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--black);
          color: #F0EDE6;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }
        ::selection { background: rgba(255,59,26,0.3); }
        .brand-scroll {
          display: flex;
          gap: 64px;
          animation: scroll-left 22s linear infinite;
          width: max-content;
        }
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .reel-scroll {
          display: flex;
          gap: 16px;
          animation: scroll-left 20s linear infinite;
          width: max-content;
        }
        .btn-fire {
          background: #FF3B1A;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .btn-fire:hover { background: #FF5533; transform: translateY(-2px); }
        .btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 12px 24px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
      `}</style>

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 3rem",
          height: 68,
          background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "background 0.3s, backdrop-filter 0.3s",
        }}
      >
        {/* Logo */}
        <a
          href="#"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
        >
          <span
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "2rem",
              color: "#fff",
              letterSpacing: "0.04em",
            }}
          >
            UGC<span style={fireStyle}>FIRE</span>
          </span>
          <span style={{ fontSize: 22, marginTop: -2 }}>🔥</span>
        </a>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {["How It Works", "Pricing", "Results", "Creators"].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 400,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px" }}>
            Sign In
          </button>
          <button className="btn-fire" style={{ fontSize: 13, padding: "9px 18px" }}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 3rem 5rem",
          overflow: "hidden",
        }}
      >
        {/* Background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #120500 0%, #1f0800 25%, #0d0d0d 60%, #080808 100%)",
            zIndex: 0,
          }}
        />

        {/* Overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "radial-gradient(ellipse 55% 60% at 72% 38%, rgba(255,59,26,0.22) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "linear-gradient(to bottom, transparent 30%, rgba(8,8,8,0.95) 100%)",
          }}
        />

        {/* Live workshop badge */}
        <div
          style={{
            position: "absolute",
            top: 90,
            right: "3rem",
            zIndex: 3,
            background: "rgba(20,20,20,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            maxWidth: 280,
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#FF3B1A",
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Live Workshop
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.5,
              }}
            >
              How to scale UGC ads to $100K/month — join us live.
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <span style={{ color: "#facc15", fontSize: 18 }}>★</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              4.9 on G2 ·{" "}
              <span style={{ textDecoration: "underline", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                1,200+ brands
              </span>
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(72px, 9vw, 130px)",
              lineHeight: 0.95,
              letterSpacing: "0.01em",
              color: "#fff",
              marginBottom: 32,
              maxWidth: 760,
            }}
          >
            Turn Creators
            <br />
            Into <span style={fireStyle}>Conversions.</span>
          </h1>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
            <div style={{ maxWidth: 460 }}>
              <p
                style={{
                  fontSize: "clamp(15px, 1.3vw, 18px)",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}
              >
                The UGC platform built for performance marketers — AI-matched creators, 48-hour turnaround,
                and ads that actually convert.
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <button className="btn-fire" style={{ fontSize: 16, padding: "15px 36px" }}>
                  Start Free Trial
                </button>
                <button className="btn-ghost" style={{ fontSize: 15 }}>
                  See Results →
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <StatCard value="4.8x" label="Average ROAS" delta="+112% vs industry" />
              <StatCard value="48hr" label="First delivery" />
              <StatCard value="1,200+" label="Brands served" />
            </div>
          </div>
        </div>
      </section>

      {/* ── BRAND LOGO MARQUEE ── */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
          overflow: "hidden",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div className="brand-scroll">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ── REEL SHOWCASE ── */}
      <section style={{ padding: "100px 0", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: 56, padding: "0 3rem" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#FF3B1A",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Live results
          </div>
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(48px, 5vw, 72px)",
              letterSpacing: "0.02em",
              color: "#fff",
            }}
          >
            Ads That Actually <span style={fireStyle}>Burn</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>
            Real campaigns. Real numbers.
          </p>
        </div>
        <div style={{ overflow: "hidden", padding: "0 0 16px" }}>
          <div className="reel-scroll" style={{ padding: "8px 3rem" }}>
            {[...REEL_CARDS, ...REEL_CARDS].map((card, i) => (
              <ReelCard key={i} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 3rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={sectionHead}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#FF3B1A",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            The platform
          </div>
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(48px, 5vw, 72px)",
              letterSpacing: "0.02em",
              color: "#fff",
            }}
          >
            Everything You Need to <span style={fireStyle}>Scale</span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        style={{
          padding: "100px 3rem",
          background: "linear-gradient(180deg, transparent 0%, rgba(255,59,26,0.04) 50%, transparent 100%)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={sectionHead}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "#FF3B1A",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Social proof
            </div>
            <h2
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "clamp(48px, 5vw, 72px)",
                letterSpacing: "0.02em",
                color: "#fff",
              }}
            >
              They <span style={fireStyle}>Scaled.</span> You&apos;re Next.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 3rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={sectionHead}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#FF3B1A",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Process
          </div>
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(48px, 5vw, 72px)",
              letterSpacing: "0.02em",
              color: "#fff",
            }}
          >
            Live in <span style={fireStyle}>3 Steps</span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            position: "relative",
          }}
        >
          {[
            {
              step: "01",
              title: "Brief Your Offer",
              desc: "Fill out a 5-minute creative brief. Tell us your product, target audience, and goals.",
            },
            {
              step: "02",
              title: "We Match Creators",
              desc: "Our AI cross-references 12,000+ creators to find your perfect match in under 24 hours.",
            },
            {
              step: "03",
              title: "Ship & Scale",
              desc: "Receive polished UGC videos, plug them into your ad account, and watch ROAS climb.",
            },
          ].map(({ step, title, desc }, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                padding: "32px 28px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: 72,
                  color: "rgba(255,59,26,0.15)",
                  lineHeight: 1,
                  position: "absolute",
                  top: 16,
                  right: 20,
                  letterSpacing: "-0.02em",
                }}
              >
                {step}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#FF3B1A",
                  fontWeight: 600,
                  marginBottom: 12,
                  letterSpacing: "0.04em",
                }}
              >
                Step {step}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: "#fff",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        style={{
          padding: "80px 3rem",
          background: "linear-gradient(135deg, rgba(255,59,26,0.12) 0%, rgba(255,59,26,0.04) 100%)",
          borderTop: "1px solid rgba(255,59,26,0.2)",
          borderBottom: "1px solid rgba(255,59,26,0.2)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(52px, 6vw, 88px)",
            letterSpacing: "0.01em",
            color: "#fff",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Ready to <span style={fireStyle}>Ignite</span>
          <br />
          Your Ad Account?
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Join 1,200+ brands already scaling with UGC Fire. No contracts. Cancel anytime.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <button className="btn-fire" style={{ fontSize: 17, padding: "16px 44px" }}>
            Start Free Trial
          </button>
          <button className="btn-ghost" style={{ fontSize: 16, padding: "16px 32px" }}>
            Talk to Sales
          </button>
        </div>
        <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#060606",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 3rem 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: "1.8rem",
                  color: "#fff",
                  letterSpacing: "0.04em",
                  marginBottom: 14,
                }}
              >
                UGC<span style={fireStyle}>FIRE</span> 🔥
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.8,
                  maxWidth: 240,
                }}
              >
                The AI-powered UGC platform turning creator content into performance marketing gold.
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
                {["Instagram", "YouTube", "TikTok", "LinkedIn"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {[...Array(3)].map((_, colIndex) => {
              const columns = [
                {
                  heading: "Product",
                  links: ["How It Works", "Pricing", "Creator Network", "Integrations", "API"],
                },
                {
                  heading: "Resources",
                  links: ["Blog", "Case Studies", "Creator Hub", "Help Center", "Affiliate Program"],
                },
                {
                  heading: "Legal",
                  links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "AI Terms", "Creator Agreement"],
                },
              ];
              const column = columns[colIndex];
              return (
                <div key={column.heading}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 600,
                      marginBottom: 18,
                    }}
                  >
                    {column.heading}
                  </div>
                  {column.links.map((l) => (
                    <a
                      key={l}
                      href="#"
                      style={{
                        display: "block",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                        textDecoration: "none",
                        marginBottom: 12,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} UGC Fire, Inc. All rights reserved.
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Built for performance marketers 🔥</span>
          </div>
        </div>
      </footer>
    </>
  );
}
