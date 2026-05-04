'use client';

import Image from "next/image";
import React, { useState, useEffect, type CSSProperties } from "react";
import { Phone, Inbox, MessageSquare, CreditCard, Star, Building2, Users, Video, Brain, TrendingUp, Palmtree, Sun, Waves } from "lucide-react";
import HomeLeadBar from "@/components/HomeLeadBar";
import FireButton from "@/components/FireButton";

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1r9yLOh-Z6nt5dZAgnKaR9iXZ6ea-kOkrJxLqctzq_0C4uLmNgX2FpB6zTQl26FqmN21-zAquz?gv=true";
const SUPABASE_URL = "https://yawgvntvhpgittvntihx.supabase.co";

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
  {
    label: "Computer Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-casual-ugc-style-ve_2891981897.mp4",
  },
  {
    label: "Workout Gear Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-energetic-ugc-fitne_2891987468.mp4",
  },
  {
    label: "Soda Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-casual-ugcstyle-tes_2892041483.mp4",
  },
  {
    label: "Lotion Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_make-ugc-video-with-this-_2892034073.mp4",
  },
  {
    label: "Vacuum Cleaner Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-cinematic-ugc-testi_2892073891.mp4",
  },
  {
    label: "Chips Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-ugcstyle-vertical-s_2892334025.mp4",
  },
  {
    label: "Hot Sauce Brand",
    videoSrc: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC/magnific_style-casual-ugc-selfiest_2892474678.mp4",
  },
];

const TESTIMONIALS_NEW = [
  {
    quote: "UGCFire gives us a simple way to keep fresh creative moving every month without trying to hire and manage a full content team.",
    name: "Brand Founder",
    handle: "Ecommerce Brand",
    label: "Monthly subscriber",
    avatar: "https://i.pravatar.cc/96?img=68",
  },
  {
    quote: "The biggest win is consistency. We can keep testing hooks, angles, and short-form content without starting from scratch every week.",
    name: "Marketing Lead",
    handle: "Growth Team",
    label: "Monthly subscriber",
    avatar: "https://i.pravatar.cc/96?img=32",
  },
  {
    quote: "It feels like having a creative department on subscription. We get content ideas, scripts, and assets without the normal production headache.",
    name: "Agency Owner",
    handle: "Client Content Partner",
    label: "Monthly subscriber",
    avatar: "https://i.pravatar.cc/96?img=12",
  },
];

const PLANS = [
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 2500,
    yearlyMonthlyPrice: 2000,  // 20% off monthly
    tagline: "8 UGC-style videos per month",
    badge: null,
    salesOnly: false,
    desc: "Best for brands that want consistent weekly content without hiring creators, editors, or a full content team.",
    includes: [
      "8 UGC-style videos/month",
      "Brand voice onboarding",
      "Hook and script creation",
      "AI-assisted content production",
      "Captions and creative direction",
      "1 revision round included",
      "Cancel anytime",
    ],
    cta: "Book Growth Call",
  },
  {
    key: "scale",
    name: "Scale",
    monthlyPrice: 5000,
    yearlyMonthlyPrice: 4000,  // 20% off monthly
    tagline: "20 UGC-style videos per month",
    badge: "Most Popular",
    salesOnly: false,
    desc: "Best for brands that want daily content volume and more creative testing.",
    includes: [
      "20 UGC-style videos/month",
      "One fresh content asset every business day",
      "Brand voice onboarding",
      "Hook and script creation",
      "AI-assisted content production",
      "Captions and creative direction",
      "Priority delivery",
      "1 revision round included",
      "Cancel anytime",
    ],
    cta: "Book Scale Call",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyMonthlyPrice: null,
    tagline: "For brands that need higher volume, custom workflows, and priority support.",
    badge: null,
    salesOnly: true,
    desc: "For high-volume brands and agencies that need a dedicated creative partner, custom workflows, and priority support.",
    includes: [
      "Custom monthly deliverables",
      "Dedicated creative strategist",
      "Priority support",
      "Custom workflows",
      "Team collaboration",
      "Strategy support",
      "Priority delivery",
    ],
    cta: "Talk to Sales",
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

const REEL_VIDEO_URL = "https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runVArsopscz9I_slow_motion_pers_c2fb5354-bceb-4ae0-8069-d65e46035d16_1.mp4";

function ReelCard({
  label,
  videoSrc,
}: {
  views?: string;
  revenue?: string;
  delta?: string;
  label: string;
  videoSrc?: string;
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
      <div style={{ position: "relative", height: 320 }}>
        <video
          src={videoSrc ?? REEL_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
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
        }}>
          VIDEO
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{label}</div>
      </div>
    </div>
  );
}

const PHOTO_CARDS = [
  {
    label: "Soap Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/02952be0-8ac1-4d5d-98b6-daa52cb4fd08.png",
  },
  {
    label: "Face Beauty Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/010aa1e6-c801-4299-85c5-62b7c7462e31.png",
  },
  {
    label: "Trail Mix Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/6038b54b-e507-44e5-a160-691b1788f55a.png",
  },
  {
    label: "Soda Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/9491597e-5c30-40cc-92cb-e606b4d0a037.png",
  },
  {
    label: "Toothpaste Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/df522445-4f8c-4c49-9dba-76b8131f0ada.png",
  },
  {
    label: "Hot Sauce Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/6dacd0a5-e10c-4eaa-b6c2-ab1fae07726e.png",
  },
  {
    label: "Detergent Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/164bdc38-cd6d-4917-b5e7-26a973a03ab1.png",
  },
  {
    label: "Chip Brand",
    src: "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/Brands/Home%20UGC%20images/4b29686e-366c-4163-9549-6e371e81ca1a.png",
  },
];

function PhotoCard({ label, src }: { label: string; src: string }) {
  return (
    <div style={{
      background: "#141414",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      width: 220,
      flexShrink: 0,
    }}>
      <div style={{ position: "relative", height: 280 }}>
        <Image
          src={src}
          alt={label}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
        />
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "#FF3B1A",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 20,
          letterSpacing: "0.05em",
        }}>
          PHOTO
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{label}</div>
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

function StarRating() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} color="#FF3B1A" fill="#FF3B1A" strokeWidth={0} />
        ))}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>4.9</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>on G2 · 1,200+ brands</span>
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVideo, setHeroVideo] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Calendar booking state
  interface CalSlot { iso: string; label: string }
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [calDay, setCalDay] = useState<number | null>(null);
  const [calSlots, setCalSlots] = useState<CalSlot[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calApiError, setCalApiError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalSlot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookName, setBookName] = useState("");
  const [bookEmail, setBookEmail] = useState("");
  const [bookBrand, setBookBrand] = useState("");
  const [bookStatus, setBookStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookMeetLink, setBookMeetLink] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

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

  // Auto-rotate hero video every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => setHeroVideo((v) => (v + 1) % 2), 8000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real slots from Edge Function for a given date string (YYYY-MM-DD)
  function fetchSlotsForDate(year: number, month: number, day: number) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    setCalLoading(true);
    setCalSlots([]);
    setCalApiError(false);
    fetch(`${SUPABASE_URL}/functions/v1/calendar-availability?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setCalApiError(true); setCalSlots([]); }
        else setCalSlots(data.slots ?? []);
        setCalLoading(false);
      })
      .catch(() => { setCalApiError(true); setCalSlots([]); setCalLoading(false); });
  }

  async function handleBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !bookName || !bookEmail) return;
    setBookStatus("loading");
    setBookError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/book-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotIso: selectedSlot.iso,
          name: bookName,
          email: bookEmail,
          brandName: bookBrand,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setBookMeetLink(data.meetLink ?? null);
      setBookStatus("success");
    } catch (err) {
      setBookError((err as Error).message);
      setBookStatus("error");
    }
  }

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
        .photo-scroll {
          display: flex;
          gap: 16px;
          animation: scroll-right 24s linear infinite;
          width: max-content;
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
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
          .hero-top-label { padding-top: 40px !important; }
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
          <a href="/login" className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            Sign In
          </a>
          <a href="#plans" className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            See Plans
          </a>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-fire" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none" }}>
            Book a Call
          </a>
        </div>
        {/* Mobile: Book a Call + Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FireButton href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-fire hamburger-cta" style={{ fontSize: 13, padding: "9px 18px", textDecoration: "none", display: "none" }}>
            Book a Call
          </FireButton>
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
          <a href="/login" className="btn-ghost" style={{ textDecoration: "none", textAlign: "center" }}>Sign In</a>
          <FireButton href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-fire" style={{ textDecoration: "none", textAlign: "center" }} onClick={() => setMenuOpen(false)}>Book a Call</FireButton>
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
        {/* Rotating hero videos */}
        {[
          "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/video/hf_20260423_175314_87422d76-6d45-43ac-838b-1f9fc7175cdd.mp4",
          "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/video/hf_20260423_181257_b777a1c9-586e-4548-8c89-0dd1db1f3887.mp4",
        ].map((src, i) => (
          <video
            key={src}
            autoPlay
            muted
            loop
            playsInline
            onEnded={() => setHeroVideo((v) => (v + 1) % 2)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              opacity: heroVideo === i ? 0.55 : 0,
              transition: "opacity 1s ease",
            }}
            src={src}
          />
        ))}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "radial-gradient(ellipse 55% 60% at 72% 38%, rgba(255,59,26,0.22) 0%, transparent 70%)",
        }} />
        {/* Video dot toggle */}
        <div style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}>
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => setHeroVideo(i)}
              aria-label={`Hero video ${i + 1}`}
              style={{
                width: heroVideo === i ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: heroVideo === i ? "#FF3B1A" : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
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
          <div className="hero-top-label" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <StarRating />
            </div>
            <span style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
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
                <FireButton href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-fire" style={{ fontSize: 16, padding: "15px 36px", textDecoration: "none" }}>
                  Book a Call
                </FireButton>
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



      <section id="results" className="sec-v" style={{ padding: "100px 0", overflow: "hidden" }}>
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
        {/* Video row — scrolls left */}
        <div style={{ overflow: "hidden", padding: "0 0 16px" }}>
          <div className="reel-scroll" style={{ padding: "8px 0" }}>
            {[...REEL_CARDS, ...REEL_CARDS].map((card, i) => (
              <ReelCard key={i} {...card} />
            ))}
          </div>
        </div>
        {/* Photo row — scrolls right (opposite direction) */}
        <div style={{ overflow: "hidden", padding: "8px 0 0" }}>
          <div className="photo-scroll" style={{ padding: "8px 0" }}>
            {[...PHOTO_CARDS, ...PHOTO_CARDS].map((card, i) => (
              <PhotoCard key={i} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Video + Product Image Showcase ── */}
      <section style={{ background: "#f2f1ee", padding: "48px 2rem" }}>
        <style>{`
          .showcase-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          @media (max-width: 768px) {
            .showcase-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div style={{
          maxWidth: 1160,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 28,
          padding: 16,
          boxShadow: "0 8px 48px rgba(0,0,0,0.10)",
        }}>
          <div className="showcase-grid">

            {/* Left — Video */}
            <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#0a0a0a", minHeight: 520 }}>
              <div style={{
                position: "absolute", top: 14, left: 14, zIndex: 10,
                background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999,
                padding: "5px 14px", display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF3B1A", flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#fff", textTransform: "uppercase" }}>
                  Watch the Commercial
                </span>
              </div>
              <video
                autoPlay muted loop playsInline controls
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 520 }}
                src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/video/hf_20260429_020651_1d9ae862-a0c1-498e-9296-651fb43dc88c.mp4"
              />
            </div>

            {/* Right — Product image with floating product circles */}
            <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#f7f5f2", minHeight: 520 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/brands/Makeup%201/e285ae04-724a-43a6-9cc7-759f8fa80ac3.png"
                alt="UGC Fire products in action"
                style={{ width: "100%", height: "100%", minHeight: 520, objectFit: "cover", objectPosition: "center top", display: "block" }}
              />

              {/* Product circle 1 — bottom left */}
              <div style={{
                position: "absolute", bottom: 28, left: 24, zIndex: 10,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                {/* Connector dot + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                  <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.6)" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                </div>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                  border: "3px solid #fff",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/brands/Makeup%201/3c6a9dc3-024e-4fa3-9760-4be5f53ac0ec.png"
                    alt="Fire Serum Dropper"
                    style={{ width: "85%", height: "85%", objectFit: "contain" }}
                  />
                </div>
                <div style={{
                  background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
                  borderRadius: 999, padding: "4px 12px",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  Product 1
                </div>
              </div>

              {/* Product circle 2 — bottom right */}
              <div style={{
                position: "absolute", bottom: 28, right: 24, zIndex: 10,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.6)" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                </div>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                  border: "3px solid #fff",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/brands/Makeup%201/fcf24658-8edb-45a6-ad4f-29a2c1e46c6a.png"
                    alt="Fire Gloss Tube"
                    style={{ width: "85%", height: "85%", objectFit: "contain" }}
                  />
                </div>
                <div style={{
                  background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
                  borderRadius: 999, padding: "4px 12px",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  Product 2
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (merged) ── */}
      <section id="how-it-works" className="sec sec-v" style={{
        padding: "100px 3rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(255,59,26,0.03) 50%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={sectionHead}>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", color: "#FF3B1A", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
              How It Works
            </div>
            <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(48px, 5vw, 72px)", letterSpacing: "0.02em", color: "#fff", lineHeight: 1 }}>
              Everything in <span style={fireStyle}>one place.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 16, maxWidth: 560, margin: "16px auto 0" }}>
              From discovery call to weekly content uploads, UGCFire gives your brand one simple place to manage content, feedback, and billing.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 64 }}>
            {([
              {
                step: "01",
                Icon: Phone,
                title: "Discovery Call",
                desc: "Start with a call so we can learn your brand, goals, offer, voice, and content needs.",
              },
              {
                step: "02",
                Icon: Inbox,
                title: "Weekly Uploads",
                desc: "Fresh videos are uploaded each week into your dashboard, organized and ready for review.",
              },
              {
                step: "03",
                Icon: MessageSquare,
                title: "Review & Team Chat",
                desc: "Approve content, request edits, and message our team in one place so nothing gets lost.",
              },
              {
                step: "04",
                Icon: CreditCard,
                title: "Billing & Invoices",
                desc: "View your subscription, invoices, and billing details from your client dashboard anytime.",
              },
            ] as { step: string; Icon: React.ElementType; title: string; desc: string }[]).map(({ step, Icon, title, desc }, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18,
                  padding: "36px 28px 32px",
                  transition: "border-color 0.2s, background 0.2s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,80,40,0.35)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,59,26,0.045)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)";
                }}
              >
                {/* Ghost step number */}
                <div style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: 96,
                  color: "rgba(255,59,26,0.08)",
                  lineHeight: 1,
                  position: "absolute",
                  bottom: -8,
                  right: 16,
                  letterSpacing: "-0.02em",
                  userSelect: "none",
                  pointerEvents: "none",
                }}>
                  {step}
                </div>
                {/* Icon */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,59,26,0.12)",
                  border: "1px solid rgba(255,59,26,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Icon size={20} color="#FF3B1A" strokeWidth={1.75} />
                </div>
                {/* Step label */}
                <div style={{ fontSize: 11, color: "#FF3B1A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Step {step}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
                  {title}
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>{desc}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            Your dashboard also includes content bins so videos stay organized by status.
          </p>
        </div>
      </section>

      {/* UGCFire Process Section — simplified strategy funnel */}
      <section style={{ position: "relative", overflow: "hidden", background: "#FF3B1A", padding: "80px 0 72px" }}>
        {/* Subtle dark gradient at top and bottom edges for premium feel */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.18) 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>

          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#000", borderRadius: 999, padding: "6px 16px", marginBottom: 22 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF3B1A", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#fff", textTransform: "uppercase" }}>
              Our Process
            </span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: "var(--font-bebas)", fontSize: "clamp(42px, 9vw, 78px)",
            letterSpacing: "0.01em", color: "#fff", lineHeight: 0.95, marginBottom: 18,
          }}>
            We Build Your Content Strategy With AI
          </h2>

          {/* Subheadline */}
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", lineHeight: 1.65, marginBottom: 52, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            We learn your brand, study your competitors, and build a smarter content plan before we create.
          </p>

          {/* Funnel */}
          <div style={{ margin: "0 auto", maxWidth: 440 }}>
            {/* Input arrows */}
            <div style={{ display: "flex", justifyContent: "space-around", width: "100%", marginBottom: 6 }}>
              {[0,1,2,3,4].map(i => (
                <svg key={i} width="16" height="30" viewBox="0 0 16 30" fill="none">
                  <line x1="8" y1="0" x2="8" y2="19" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 14 L8 22 L14 14" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ))}
            </div>

            {/* Funnel layers */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
              {([
                { label: "BRAND",       icon: Building2,  tl:  0, tr: 100, bl:  7, br: 93, bg: "linear-gradient(180deg,#ffffff 0%,#ebebeb 100%)" },
                { label: "COMPETITORS", icon: Users,       tl:  7, tr:  93, bl: 14, br: 86, bg: "linear-gradient(180deg,#f5f5f5 0%,#e2e2e2 100%)" },
                { label: "CONTENT",     icon: Video,       tl: 14, tr:  86, bl: 21, br: 79, bg: "linear-gradient(180deg,#eeeeee 0%,#d8d8d8 100%)" },
                { label: "STRATEGY",    icon: Brain,       tl: 21, tr:  79, bl: 28, br: 72, bg: "linear-gradient(180deg,#e6e6e6 0%,#d0d0d0 100%)" },
                { label: "GROWTH",      icon: TrendingUp,  tl: 28, tr:  72, bl: 35, br: 65, bg: "linear-gradient(180deg,#dedede 0%,#c8c8c8 100%)" },
              ] as { label: string; icon: React.ElementType; tl: number; tr: number; bl: number; br: number; bg: string }[]).map(({ label, icon: Icon, tl, tr, bl, br, bg }, i) => (
                <div key={label} style={{ filter: `drop-shadow(0px ${8 - i}px ${10 - i}px rgba(0,0,0,${(0.20 - i * 0.02).toFixed(2)}))` }}>
                  <div style={{
                    clipPath: `polygon(${tl}% 0,${tr}% 0,${br}% 100%,${bl}% 100%)`,
                    background: bg, height: 70,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 11,
                  }}>
                    <Icon size={16} color="#CC2D0F" />
                    <span style={{ fontFamily: "var(--font-bebas)", fontSize: 21, letterSpacing: "0.06em", color: "#1a1a1a" }}>
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Output glow */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 54, height: 24, background: "linear-gradient(180deg, rgba(200,200,200,0.80) 0%, rgba(255,255,255,0) 100%)" }} />
              <div style={{ width: 120, height: 16, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, transparent 70%)", filter: "blur(5px)", marginTop: -5 }} />
            </div>
          </div>

          {/* Process line */}
          <p style={{
            marginTop: 28, fontSize: 11, color: "rgba(255,255,255,0.48)",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            Brand → Competitors → Content → Strategy → Growth
          </p>

        </div>
      </section>
      {/* ── End Process Section ── */}

      {/* UGCFire Pricing Section — 3 plans + monthly/yearly toggle */}
      <section id="plans" className="sec sec-v" style={{ padding: "100px 2rem", maxWidth: 1400, margin: "0 auto" }}>
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

        {/* Billing cycle toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48, marginTop: 8 }}>
          <div style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 40,
            padding: 4,
            gap: 4,
          }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                background: billingCycle === "monthly" ? "#FF3B1A" : "transparent",
                color: billingCycle === "monthly" ? "#fff" : "rgba(255,255,255,0.45)",
                border: "none",
                borderRadius: 32,
                padding: "8px 22px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.03em",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              style={{
                background: billingCycle === "yearly" ? "#22c55e" : "transparent",
                color: billingCycle === "yearly" ? "#fff" : "rgba(255,255,255,0.45)",
                border: "none",
                borderRadius: 32,
                padding: "8px 22px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.03em",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              Yearly
              <span style={{
                background: billingCycle === "yearly" ? "rgba(255,255,255,0.25)" : "rgba(34,197,94,0.20)",
                color: billingCycle === "yearly" ? "#fff" : "#22c55e",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 20,
                letterSpacing: "0.05em",
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* plans grid — 3 fixed columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" style={{ maxWidth: 1280, margin: "0 auto" }}>
          {PLANS.map((plan, i) => {
            const isScale = plan.key === "scale";

            const isYearly = billingCycle === "yearly" && !plan.salesOnly;

            return (
              <div
                key={i}
                style={{
                  background: isScale ? "rgba(255,59,26,0.07)" : "rgba(255,255,255,0.03)",
                  border: isScale ? "1px solid rgba(255,59,26,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18,
                  padding: "36px 28px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: "absolute",
                    top: -14,
                    left: 28,
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

                {/* Plan name */}
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 4 }}>
                  {plan.salesOnly ? (
                    <span style={{ fontFamily: "var(--font-bebas)", fontSize: 36, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>
                      Custom
                    </span>
                  ) : (
                    <>
                      {/* Slashed original price — only on yearly */}
                      {isYearly && (
                        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", fontWeight: 600, textDecoration: "line-through", marginBottom: 2 }}>
                          ${plan.monthlyPrice!.toLocaleString()}/mo
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 44, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>
                          ${(isYearly ? plan.yearlyMonthlyPrice! : plan.monthlyPrice!).toLocaleString()}
                        </span>
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 20, color: "rgba(255,255,255,0.5)" }}>
                          /mo
                        </span>
                      </div>
                      {isYearly && (
                        <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, marginTop: 3 }}>
                          billed annually
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ fontSize: 14, color: "#FF3B1A", fontWeight: 600, marginBottom: 10, marginTop: 2 }}>
                  {plan.tagline}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 20 }}>
                  {plan.desc}
                </p>

                {/* Features */}
                <div style={{ marginBottom: 24, flex: 1 }}>
                  {plan.includes.map((item, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                      <span style={{ color: "#FF3B1A", fontSize: 13, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.62)" }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {plan.salesOnly ? (
                  <a
                    href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      fontSize: 14,
                      padding: "13px 20px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      color: "#fff",
                      fontWeight: 700,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,59,26,0.4)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.15)";
                    }}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <FireButton
                    href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
                    className="btn-fire"
                    style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 14, padding: "13px 20px" }}
                  >
                    {plan.cta}
                  </FireButton>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="sec sec-v" style={{
        padding: "100px 3rem",
        background: "linear-gradient(180deg, transparent 0%, rgba(255,59,26,0.04) 50%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={sectionHead}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <StarRating />
            </div>
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
            alignItems: "start",
          }} className="proof-grid">
            {TESTIMONIALS_NEW.map((t, i) => (
              <div key={i} style={{ position: "relative", paddingTop: 52 }}>
                {/* Avatar circle — elevated above the card */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}>
                  <div style={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    border: "3px solid #FF3B1A",
                    boxShadow: "0 0 0 4px rgba(255,59,26,0.15), 0 0 28px rgba(255,59,26,0.35)",
                    overflow: "hidden",
                    background: "#1a1a1a",
                    flexShrink: 0,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.avatar}
                      alt={t.name}
                      width={84}
                      height={84}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                </div>

                {/* Testimonial card */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "52px 24px 28px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 28, color: "#FF3B1A", marginBottom: 10, lineHeight: 1 }}>&ldquo;</div>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 20 }}>
                    {t.quote}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{t.handle}</div>
                    <div style={{
                      background: "rgba(255,59,26,0.15)",
                      border: "1px solid rgba(255,59,26,0.3)",
                      borderRadius: 20,
                      padding: "3px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#ff8060",
                      marginTop: 2,
                    }}>
                      {t.label}
                    </div>
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
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,59,26,0.15)",
        borderBottom: "1px solid rgba(255,59,26,0.15)",
      }}>
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0, opacity: 0.6,
          }}
          src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128__--ar_9151_--bs_1_--motion_high_--video_1_9a3a1ff2-5c55-4a2a-bc02-824ad4a0d14d_0.mp4"
        />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,8,8,0.41) 0%, rgba(8,8,8,0.36) 100%)", zIndex: 1 }} />
        <div className="booking-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 64, flexWrap: "wrap", alignItems: "center", position: "relative", zIndex: 2 }}>
          {/* Left: copy */}
          <div className="booking-left" style={{ flex: "1 1 340px" }}>
            {/* Line 1: SEE IF */}
            <div style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(52px, 5.5vw, 88px)",
              letterSpacing: "0.01em",
              color: "#fff",
              lineHeight: 1,
              marginBottom: 2,
            }}>
              See if
            </div>
            {/* Line 2: [logo] IS THE RIGHT FIT inline */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGC Fire"
                width={240}
                height={96}
                style={{ objectFit: "contain", flexShrink: 0 }}
                unoptimized
              />
              <span style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "clamp(52px, 5.5vw, 88px)",
                letterSpacing: "0.01em",
                color: "#fff",
                lineHeight: 1,
              }}>
                Is the right fit
              </span>
            </div>
            {/* Italic sub */}
            <div style={{
              fontStyle: "italic",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(20px, 2vw, 30px)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 24,
            }}>
              (it totally is)
            </div>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
              Book a quick 20-minute discovery call. We&apos;ll review your brand, content goals, voice, offer, and whether Growth or Scale is the right plan.
            </p>
            <FireButton href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-fire" style={{ fontSize: 16, padding: "15px 36px", textDecoration: "none", display: "inline-block" }}>
              Book a Discovery Call
            </FireButton>
          </div>

          {/* Right: interactive calendar UI */}
          {(() => {
            const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const todayY = todayDate.getFullYear();
            const todayM = todayDate.getMonth();
            const todayD = todayDate.getDate();

            const cells: (number | null)[] = [
              ...Array(firstDayOfWeek).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];

            function isSelectable(d: number) {
              const dow = new Date(calYear, calMonth, d).getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isPast = calYear < todayY || (calYear === todayY && calMonth < todayM) || (calYear === todayY && calMonth === todayM && d < todayD);
              return !isWeekend && !isPast;
            }

            function isToday(d: number) {
              return calYear === todayY && calMonth === todayM && d === todayD;
            }

            function prevMonth() {
              if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
              else setCalMonth(m => m - 1);
              setCalDay(null); setCalSlots([]); setCalApiError(false);
            }
            function nextMonth() {
              if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
              else setCalMonth(m => m + 1);
              setCalDay(null); setCalSlots([]); setCalApiError(false);
            }
            function selectDay(d: number) {
              setCalDay(d);
              fetchSlotsForDate(calYear, calMonth, d);
            }

            const dayLabel = calDay
              ? new Date(calYear, calMonth, calDay).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
              : null;

            return (
              <div className="booking-right" style={{
                flex: "1 1 320px",
                maxWidth: 420,
                position: "relative",
                paddingTop: 48, // space for avatar overflow
              }}>
                {/* Profile avatar — half outside the card top edge */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #FF3B1A",
                  boxShadow: "0 0 20px rgba(255,59,26,0.4)",
                }}>
                  <Image
                    src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/images/Profile%20Jordan.jpg"
                    alt="Jordan"
                    width={80}
                    height={80}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    unoptimized
                  />
                </div>
              <div style={{
                background: "rgba(14,14,14,0.98)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20,
                padding: "52px 24px 24px",
                boxShadow: "0 0 48px rgba(255,59,26,0.06)",
              }}>
                {/* Month header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: 16, width: 30, height: 30, cursor: "pointer", lineHeight: 1 }}>‹</button>
                    <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: 16, width: 30, height: 30, cursor: "pointer", lineHeight: 1 }}>›</button>
                  </div>
                </div>

                {/* Day labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, paddingBottom: 4 }}>{d}</div>
                  ))}
                </div>

                {/* Date grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 20 }}>
                  {cells.map((d, i) => {
                    if (d === null) return <div key={i} />;
                    const selectable = isSelectable(d);
                    const selected = d === calDay;
                    const today = isToday(d);
                    return (
                      <button
                        key={i}
                        onClick={() => selectable && selectDay(d)}
                        style={{
                          textAlign: "center",
                          fontSize: 13,
                          padding: "7px 0",
                          borderRadius: 7,
                          border: today && !selected ? "1px solid rgba(255,59,26,0.7)" : "1px solid transparent",
                          color: selected ? "#fff" : selectable ? "#fff" : "rgba(255,255,255,0.25)",
                          background: selected ? "#FF3B1A" : selectable ? "rgba(255,255,255,0.08)" : "transparent",
                          fontWeight: selected ? 700 : selectable ? 500 : 400,
                          cursor: selectable ? "pointer" : "default",
                          transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => { if (selectable && !selected) { (e.currentTarget as HTMLButtonElement).style.background = "#FF3B1A"; } }}
                        onMouseLeave={(e) => { if (selectable && !selected) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; } }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                {/* Time slots area */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    {!calDay
                      ? "Pick a date above"
                      : calLoading
                      ? `Loading ${dayLabel}…`
                      : calApiError
                      ? "Calendar unavailable"
                      : calSlots.length > 0
                      ? `Available — ${dayLabel}`
                      : `No slots — ${dayLabel}`}
                  </div>

                  {!calDay && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "16px 0" }}>
                      Select a weekday to see open times.
                    </p>
                  )}

                  {calDay && calLoading && (
                    <div style={{ textAlign: "center", padding: "16px 0", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                      Checking calendar…
                    </div>
                  )}

                  {calDay && !calLoading && calApiError && (
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", padding: "11px 14px", border: "1px solid rgba(255,59,26,0.5)", borderRadius: 10, marginBottom: 8, fontSize: 14, color: "#FF3B1A", textAlign: "center", textDecoration: "none", fontWeight: 600 }}>
                      Book via Google Calendar →
                    </a>
                  )}

                  {calDay && !calLoading && !calApiError && calSlots.length === 0 && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "10px 0" }}>
                      No open slots this day. Try another.
                    </p>
                  )}

                  {calDay && !calLoading && !calApiError && calSlots.map((slot) => (
                    <button
                      key={slot.iso}
                      onClick={() => { setSelectedSlot(slot); setShowModal(true); setBookStatus("idle"); setBookName(""); setBookEmail(""); setBookBrand(""); setBookMeetLink(null); setBookError(null); }}
                      style={{
                        display: "block", width: "100%", padding: "11px 14px",
                        border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, marginBottom: 8,
                        fontSize: 14, color: "#fff", textAlign: "center", fontWeight: 600,
                        background: "rgba(255,255,255,0.06)", cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF3B1A"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,26,0.15)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Booking Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111", border: "1px solid rgba(255,59,26,0.2)",
              borderRadius: 20, padding: "36px 32px", maxWidth: 440, width: "100%",
              boxShadow: "0 0 80px rgba(255,59,26,0.15)",
            }}
          >
            {bookStatus === "success" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
                <h3 style={{ fontFamily: "var(--font-bebas)", fontSize: 32, color: "#fff", marginBottom: 8 }}>You&apos;re Booked!</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 8, lineHeight: 1.6 }}>
                  Your 20-minute discovery call is confirmed. Check your email for the invite.
                </p>
                {bookMeetLink && (
                  <a
                    href={bookMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 8, padding: "12px 24px", background: "#FF3B1A", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14 }}
                  >
                    Open Google Meet Link
                  </a>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  style={{ display: "block", margin: "20px auto 0", background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "var(--font-bebas)", fontSize: 28, color: "#fff", marginBottom: 4 }}>
                  Book Your Discovery Call
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                  {selectedSlot?.label} — 20 min via Google Meet
                </p>
                <form onSubmit={handleBookSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="Jane Smith"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={bookEmail}
                      onChange={(e) => setBookEmail(e.target.value)}
                      placeholder="you@brand.com"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Brand Name</label>
                    <input
                      type="text"
                      value={bookBrand}
                      onChange={(e) => setBookBrand(e.target.value)}
                      placeholder="Your brand or company"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  {bookError && (
                    <p style={{ color: "#FF3B1A", fontSize: 13, marginBottom: 14, textAlign: "center" }}>{bookError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={bookStatus === "loading"}
                    style={{
                      width: "100%", padding: "14px", background: bookStatus === "loading" ? "rgba(255,59,26,0.5)" : "#FF3B1A",
                      color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: bookStatus === "loading" ? "not-allowed" : "pointer",
                    }}
                  >
                    {bookStatus === "loading" ? "Booking…" : "Confirm Discovery Call"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ display: "block", margin: "14px auto 0", background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="footer-wrap" style={{
        background: "#060606",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 3rem 32px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
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
              <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "center" }}>
                <a
                  href="https://www.instagram.com/ugcfire"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="UGCFire on Instagram"
                  style={{ color: "rgba(255,255,255,0.4)", transition: "color 0.2s", display: "flex" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FF3B1A")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                  <InstagramIcon size={28} />
                </a>
              </div>
              <a
                href="tel:9497361560"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 16,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.40)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FF3B1A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}
              >
                <Phone size={13} strokeWidth={2} />
                (949) 736-1560
              </a>
            </div>
            {([
              {
                heading: "Product",
                links: [
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Plans", href: "#plans" },
                  { label: "Results", href: "#results" },
                  { label: "FAQ", href: "#faq" },
                ],
              },
              {
                heading: "Account",
                links: [
                  { label: "Sign In", href: "/signup" },
                  { label: "Book a Call", href: BOOKING_URL },
                ],
              },
              {
                heading: "Legal",
                links: [
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                ],
              },
            ] as { heading: string; links: { label: string; href: string }[] }[]).map(({ heading, links }) => (
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
                    key={l.label}
                    href={l.href}
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
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
            {/* Office Locations */}
            <div>
              <div style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                fontWeight: 600,
                marginBottom: 18,
              }}>
                Office Locations
              </div>
              {[
                { icon: <Building2 size={18} />, label: "Dallas, TX" },
                { icon: <Palmtree size={18} />, label: "Newport Beach, CA" },
                { icon: <Sun size={18} />, label: "Miami, FL" },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  color: "rgba(255,255,255,0.45)",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13 }}>{label}</span>
                </div>
              ))}
            </div>
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
              © 2026 Only Good, LLC. All rights reserved.
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Built for performance marketers 🔥
            </span>
          </div>
        </div>
      </footer>

      {/* Extra bottom padding on mobile so the fixed LeadBar never covers footer content */}
      <div className="lg:hidden" style={{ height: 64 }} aria-hidden="true" />

      <HomeLeadBar />
    </>
  );
}

