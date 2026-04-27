'use client';

import Image from "next/image";
import { useState, useEffect, type CSSProperties } from "react";

// Later: replace this with your Google Calendar appointment link.
const BOOKING_URL = "#booking";

interface StatCardProps {
  value: string;
  label?: string;
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

const BRANDS = [
  "ClickFunnels", "Shopify", "MindValley", "Kajabi",
  "GoHighLevel", "Teachable", "ActiveCampaign", "Thinkific",
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
  { views: "28.3K", revenue: "$27K", delta: "+95%", label: "Hook-driven product demo" },
  { views: "15.1K", revenue: "$18K", delta: "+14%", label: "Founder-style talking ad" },
  { views: "11.8K", revenue: "$19K", delta: "+17%", label: "Problem / solution short" },
  { views: "8K",   revenue: "$12K", delta: "+38%", label: "Offer-focused conversion video" },
];

const TESTIMONIALS_NEW = [
  {
    quote: "UGCFire gives us a simple way to keep fresh creative moving every month without trying to hire and manage a full content team.",
    name: "Brand Founder",
    handle: "Ecommerce Brand",
    label: "Monthly subscriber",
  },
  {
    quote: "The biggest win is consistency. We can keep testing hooks, angles, and short-form content without starting from scratch every week.",
    name: "Marketing Lead",
    handle: "Growth Team",
    label: "Monthly subscriber",
  },
  {
    quote: "It feels like having a creative department on subscription. We get content ideas, scripts, and assets without the normal production headache.",
    name: "Agency Owner",
    handle: "Client Content Partner",
    label: "Monthly subscriber",
  },
];

const PLANS = [
  {
    name: "Growth",
    price: "$2,500/month",
    tagline: "8 UGC-style videos per month",
    badge: null,
    desc: "Best for brands that want consistent weekly content without hiring creators, editors, or a full content team.",
    includes: [
      "8 UGC-style videos/month",
      "Brand voice onboarding",
      "Hook and script creation",
      "AI-assisted content production",
      "Captions and creative direction",
      "Revisions included",
      "Cancel anytime",
    ],
    cta: "Book Growth Call",
  },
  {
    name: "Scale",
    price: "$5,000/month",
    tagline: "20 UGC-style videos per month",
    badge: "Most Popular",
    desc: "Best for brands that want daily content volume and more creative testing.",
    includes: [
      "20 UGC-style videos/month",
      "One fresh content asset every business day",
      "Brand voice onboarding",
      "Hook and script creation",
      "AI-assisted content production",
      "Captions and creative direction",
      "Priority delivery",
      "Revisions included",
      "Cancel anytime",
    ],
    cta: "Book Scale Call",
  },
];

const FAQS = [
  {
    q: "How does UGCFire work?",
    a: "You book a discovery call, we learn your brand, offer, audience, voice, and content goals, then we create monthly AI-assisted UGC-style content for your brand.",
  },
  {
    q: "What do I get each month?",
    a: "Growth includes 8 UGC-style videos per month. Scale includes 20 UGC-style videos per month — roughly one fresh content asset every business day.",
  },
  {
    q: "Is the content made with AI?",
    a: "Yes. UGCFire uses AI-assisted production to move faster, create more content, and keep pricing simple. Every piece is guided by your brand voice, offer, audience, and creative direction.",
  },
  {
    q: "Do I need to manage creators?",
    a: "No. UGCFire is designed to remove creator management, editing bottlenecks, and inconsistent content production.",
  },
  {
    q: "Can I request revisions?",
    a: "Yes. Revisions are included so the content matches your brand voice and creative direction.",
  },
  {
    q: "What platforms can I use the videos on?",
    a: "TikTok, Instagram Reels, YouTube Shorts, Facebook, landing pages, organic posts, and paid ads.",
  },
  {
    q: "Can agencies use UGCFire for clients?",
    a: "Yes. Agencies can use UGCFire to create consistent short-form content for their clients without hiring a full production team.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. UGCFire is a monthly subscription and can be canceled anytime.",
  },
];

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
      <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, marginTop: 4 }}>{delta ?? label}</div>
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "22px 0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          textAlign: "left",
          padding: 0,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: "#FF3B1A", fontSize: 20, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginTop: 14 }}>{a}</p>
      )}
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

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fireStyle: CSSProperties = { color: "#FF3B1A" };
  const sectionHead: CSSProperties = {
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

        /* ── Mobile nav drawer ── */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: rgba(8,8,8,0.97);
          backdropFilter: blur(16px);
          padding: 24px 1.5rem 32px;
          z-index: 99;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-direction: column;
          gap: 20px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-weight: 500;
        }
        .mobile-menu a:hover { color: #fff; }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.2s;
        }

        @media (max-width: 768px) {
          /* Nav */
          .nav-links { display: none !important; }
          .nav-btns-desktop { display: none !important; }
          .hamburger { display: flex !important; }
          .hamburger-cta { display: inline-flex !important; }

          /* Hero */
          .hero-badge { display: none !important; }
          .hero-bottom { flex-direction: column !important; align-items: flex-start !important; }
          .hero-stats { width: 100% !important; justify-content: flex-start !important; }
          .stat-card { min-width: 0 !important; flex: 1 1 calc(33% - 12px) !important; }

          /* Section padding */
          .sec { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .sec-v { padding-top: 64px !important; padding-bottom: 64px !important; }

          /* Plans */
          .plans-grid { grid-template-columns: 1fr !important; }

          /* Booking */
          .booking-inner { flex-direction: column !important; gap: 40px !important; }
          .booking-left { flex: 1 1 100% !important; }
          .booking-right { flex: 1 1 100% !important; max-width: 100% !important; width: 100% !important; }

          /* Footer */
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-wrap { padding: 48px 1.5rem 24px !important; }

          /* Testimonials + FAQ */
          .proof-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

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
        <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Image
            src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
            alt="UGC Fire"
            width={160}
            height={64}
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </a>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {[
            { label: "How It Works", href: "#how-it-works" },
            { label: "Plans", href: "#plans" },
            { label: "Results", href: "#results" },
            { label: "FAQ", href: "#faq" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
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
              {label}
            </a>
          ))}
        </div>
        <div className="nav-btns-desktop" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="#login" className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            Sign In
          </a>
          <a href="#plans" className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            See Plans
          </a>
          <a href={BOOKING_URL} className="btn-fire" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            Book a Call
          </a>
        </div>
        {/* Mobile: Book a Call + Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href={BOOKING_URL} className="btn-fire hamburger-cta" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none", display: "none" }}>
            Book a Call
          </a>
          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {[
          { label: "How It Works", href: "#how-it-works" },
          { label: "Plans", href: "#plans" },
          { label: "Results", href: "#results" },
          { label: "FAQ", href: "#faq" },
        ].map(({ label, href }) => (
          <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <a href="#login" className="btn-ghost" style={{ textDecoration: "none", textAlign: "center" }}>Sign In</a>
          <a href={BOOKING_URL} className="btn-fire" style={{ textDecoration: "none", textAlign: "center" }} onClick={() => setMenuOpen(false)}>Book a Call</a>
        </div>
      </div>

      <section className="sec sec-v" style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-end",
        padding: "120px 3rem 5rem",
        overflow: "hidden",
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
            opacity: 0.55,
          }}
          src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runshB1JpuEK_8_Complete_slow_mo_420644a6-5c25-482d-8c3b-cec268a9fbf5_0.mp4"
        />
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "radial-gradient(ellipse 55% 60% at 72% 38%, rgba(255,59,26,0.22) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(to bottom, transparent 30%, rgba(8,8,8,0.95) 100%)",
        }} />
        <div className="hero-badge" style={{
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
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#FF3B1A",
            marginTop: 5,
            flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Discovery Call
            </div>
            <div style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.5,
            }}>
              See if UGCFire is the right content partner for your brand.
            </div>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              Monthly AI-Assisted Content For Brands
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(72px, 9vw, 130px)",
            lineHeight: 0.95,
            letterSpacing: "0.01em",
            color: "#fff",
            marginBottom: 32,
            maxWidth: 760,
          }}>
            Your Brand&apos;s<br />
            Content Team.<br />
            <span style={fireStyle}>On Subscription.</span>
          </h1>
          <div className="hero-bottom" style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 32,
          }}>
            <div style={{ maxWidth: 460 }}>
              <p style={{
                fontSize: "clamp(15px, 1.3vw, 18px)",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.7,
                marginBottom: 28,
              }}>
                Monthly AI-assisted UGC content for brands that need consistent short-form videos, creative direction, and done-for-you content production.
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <a href={BOOKING_URL} className="btn-fire" style={{ fontSize: 16, padding: "15px 36px", textDecoration: "none" }}>
                  Book a Call
                </a>
                <a href="#plans" className="btn-ghost" style={{ fontSize: 15, textDecoration: "none" }}>
                  See Plans →
                </a>
              </div>
            </div>
            <div className="hero-stats" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <StatCard value="8 VIDEOS" delta="Growth Plan" />
              <StatCard value="20 VIDEOS" delta="Scale Plan" />
              <StatCard value="MONTHLY" delta="Cancel Anytime" />
            </div>
          </div>
        </div>
      </section>

      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 0",
        overflow: "hidden",
        background: "rgba(255,255,255,0.015)",
      }}>
        <div className="brand-scroll">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>{b}</span>
          ))}
        </div>
      </section>

      <section className="sec-v" style={{ padding: "100px 0", overflow: "hidden" }}>
        <div className="sec" style={{ textAlign: "center", marginBottom: 56, padding: "0 3rem" }}>
          <div style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "#FF3B1A",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 12,
          }}>
            Content Examples
          </div>
          <h2 style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(48px, 5vw, 72px)",
            letterSpacing: "0.02em",
            color: "#fff",
          }}>
            UGC That Actually <span style={fireStyle}>Burns</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>
            Short-form content built for ads, organic posts, landing pages, and social media.
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

      <section id="plans" className="sec sec-v" style={{ padding: "100px 3rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={sectionHead}>
          <div style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "#FF3B1A",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 12,
          }}>
            Plans
          </div>
          <h2 style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(48px, 5vw, 72px)",
            letterSpacing: "0.02em",
            color: "#fff",
            lineHeight: 1,
          }}>
            One Subscription.<br />
            <span style={fireStyle}>Fresh UGC Every Month.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 16, maxWidth: 560, margin: "16px auto 0" }}>
            Choose the content volume that fits your brand. We handle the creative direction, hooks, scripts, and AI-assisted production.
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          alignItems: "start",
        }}>
          {PLANS.map((plan, i) => (
            <div
              key={i}
              style={{
                background: plan.badge ? "rgba(255,59,26,0.07)" : "rgba(255,255,255,0.03)",
                border: plan.badge ? "1px solid rgba(255,59,26,0.35)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: "36px 32px",
                position: "relative",
              }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute",
                  top: -14,
                  left: 32,
                  background: "#FF3B1A",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 14px",
                  borderRadius: 20,
                }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 48, color: "#fff", letterSpacing: "0.02em", lineHeight: 1, marginBottom: 4 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 15, color: "#FF3B1A", fontWeight: 600, marginBottom: 12 }}>
                {plan.tagline}
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 24 }}>
                {plan.desc}
              </p>
              <div style={{ marginBottom: 28 }}>
                {plan.includes.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: "#FF3B1A", fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={BOOKING_URL}
                className="btn-fire"
                style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 15, padding: "14px 24px" }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="sec sec-v" style={{
        padding: "100px 3rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(255,59,26,0.04) 50%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={sectionHead}>
            <div style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#FF3B1A",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}>
              Social Proof
            </div>
            <h2 style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(48px, 5vw, 72px)",
              letterSpacing: "0.02em",
              color: "#fff",
              lineHeight: 1,
            }}>
              Content Teams Are Expensive.<br />
              <span style={fireStyle}>UGCFire Makes It Simple.</span>
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }} className="proof-grid">
            {TESTIMONIALS_NEW.map((t, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "28px 24px",
                }}
              >
                <div style={{ fontSize: 32, color: "#FF3B1A", marginBottom: 12, lineHeight: 1 }}>&ldquo;</div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 20 }}>
                  {t.quote}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{t.handle}</div>
                  </div>
                  <div style={{
                    background: "rgba(255,59,26,0.15)",
                    border: "1px solid rgba(255,59,26,0.3)",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ff8060",
                  }}>
                    {t.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="sec sec-v" style={{ padding: "100px 3rem", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ ...sectionHead, textAlign: "left", marginBottom: 48 }}>
          <div style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "#FF3B1A",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 12,
          }}>
            FAQ
          </div>
          <h2 style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(48px, 5vw, 72px)",
            letterSpacing: "0.02em",
            color: "#fff",
          }}>
            Frequently Asked <span style={fireStyle}>Questions</span>
          </h2>
        </div>
        <div>
          {FAQS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <section id="booking" className="sec sec-v" style={{
        padding: "100px 3rem",
        background: "linear-gradient(135deg, rgba(255,59,26,0.08) 0%, rgba(255,59,26,0.02) 100%)",
        borderTop: "1px solid rgba(255,59,26,0.15)",
        borderBottom: "1px solid rgba(255,59,26,0.15)",
      }}>
        <div className="booking-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 64, flexWrap: "wrap", alignItems: "center" }}>
          {/* Left: copy */}
          <div className="booking-left" style={{ flex: "1 1 340px" }}>
            <div style={{ marginBottom: 16 }}>
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGC Fire"
                width={180}
                height={72}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </div>
            <h2 style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(48px, 5vw, 80px)",
              letterSpacing: "0.01em",
              color: "#fff",
              lineHeight: 1,
              marginBottom: 12,
            }}>
              Is the right fit<br />
              <span style={{ fontStyle: "italic", fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 3vw, 46px)", fontWeight: 400, color: "rgba(255,255,255,0.55)" }}>
                (it totally is)
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
              Book a quick 15-minute discovery call. We&apos;ll review your brand, content goals, voice, offer, and whether Growth or Scale is the right plan.
            </p>
            <a href={BOOKING_URL} className="btn-fire" style={{ fontSize: 16, padding: "15px 36px", textDecoration: "none", display: "inline-block" }}>
              Book a Discovery Call
            </a>
          </div>

          {/* Right: calendar mock */}
          <div className="booking-right" style={{
            flex: "1 1 320px",
            background: "rgba(20,20,20,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "28px 28px 24px",
            maxWidth: 400,
          }}>
            {/* Month header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>May 2026</span>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>‹</span>
                <span style={{ color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>›</span>
              </div>
            </div>
            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            {/* Date grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 20 }}>
              {[...Array(4).fill(null), 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map((d, i) => (
                <div key={i} style={{
                  textAlign: "center",
                  fontSize: 13,
                  padding: "6px 0",
                  borderRadius: 6,
                  color: d === 14 ? "#fff" : d === null ? "transparent" : "rgba(255,255,255,0.35)",
                  background: d === 14 ? "#FF3B1A" : "transparent",
                  fontWeight: d === 14 ? 700 : 400,
                  cursor: d !== null ? "pointer" : "default",
                }}>
                  {d ?? ""}
                </div>
              ))}
            </div>
            {/* Time slots */}
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em" }}>AVAILABLE TIMES — WED 14</div>
            {["10:00am","10:30am","11:00am","1:00pm"].map(t => (
              <div key={t} style={{
                padding: "10px 14px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                marginBottom: 8,
                fontSize: 14,
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                textAlign: "center",
                transition: "border-color 0.2s",
              }}>{t}</div>
            ))}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 12 }}>
              Google Calendar link coming soon.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer-wrap" style={{
        background: "#060606",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 3rem 32px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 56,
          }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <Image
                  src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                  alt="UGC Fire"
                  width={110}
                  height={44}
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
              </div>
              <p style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.8,
                maxWidth: 240,
              }}>
                UGCFire is a monthly AI-assisted UGC content subscription for brands that need consistent short-form videos without hiring a full content team.
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
                {["Instagram", "YouTube", "TikTok", "LinkedIn"].map((s) => (
                  <a key={s} href="#" style={{
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
            {[
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
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 600,
                  marginBottom: 18,
                }}>
                  {heading}
                </div>
                {links.map((l) => (
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
            ))}
          </div>
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} UGC Fire, Inc. All rights reserved.
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Built for performance marketers 🔥
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

