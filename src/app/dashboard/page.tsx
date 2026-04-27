'use client';

import Image from "next/image";
import React, { useState } from "react";
import {
  Inbox, MessageSquare, CreditCard, LogOut, Bell,
  CheckCircle, Clock, Eye, Truck, FilePlus, Play, Download,
  ChevronRight, Star,
} from "lucide-react";

/* ─── Demo data ─────────────────────────────────── */

const BRAND = { name: "Demo Brand", plan: "Scale Plan", videos: 20 };

type Status = "Requested" | "In Production" | "Ready for Review" | "Approved" | "Delivered";

const CONTENT_BINS: { id: number; title: string; status: Status; week: string }[] = [
  { id: 1,  title: "Hook-driven product demo",          status: "Delivered",          week: "Week 1" },
  { id: 2,  title: "Founder-style talking ad",          status: "Delivered",          week: "Week 1" },
  { id: 3,  title: "Problem / solution short",          status: "Approved",           week: "Week 2" },
  { id: 4,  title: "Offer-focused conversion video",   status: "Approved",           week: "Week 2" },
  { id: 5,  title: "Lifestyle brand reel",              status: "Ready for Review",   week: "Week 3" },
  { id: 6,  title: "Unboxing-style short",              status: "Ready for Review",   week: "Week 3" },
  { id: 7,  title: "Testimonial-style UGC",             status: "In Production",      week: "Week 3" },
  { id: 8,  title: "Before & after transformation",    status: "In Production",      week: "Week 3" },
  { id: 9,  title: "Social proof montage",              status: "Requested",          week: "Week 4" },
  { id: 10, title: "CTA-heavy ad creative",             status: "Requested",          week: "Week 4" },
];

const MESSAGES = [
  { from: "UGCFire Team", time: "Today 9:14am", text: "Hey! Your Week 3 content is uploading now — 2 videos are ready for review. Let us know if you want any hook tweaks.", me: false },
  { from: "You",          time: "Today 9:32am", text: "Awesome! I'll review them today. The Week 2 videos were great by the way.", me: true },
  { from: "UGCFire Team", time: "Today 9:35am", text: "Thanks! We used the same hook angle — glad it landed. Week 4 briefs are drafted and will start production Monday.", me: false },
];

const INVOICES = [
  { id: "INV-001", date: "Apr 1, 2026",  amount: "$5,000", status: "Paid" },
  { id: "INV-002", date: "Mar 1, 2026",  amount: "$5,000", status: "Paid" },
  { id: "INV-003", date: "Feb 1, 2026",  amount: "$5,000", status: "Paid" },
];

/* ─── Status config ──────────────────────────────── */

const STATUS_CONFIG: Record<Status, { color: string; bg: string; icon: React.ElementType }> = {
  "Requested":        { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)", icon: FilePlus    },
  "In Production":    { color: "#facc15",               bg: "rgba(250,204,21,0.1)",  icon: Clock        },
  "Ready for Review": { color: "#60a5fa",               bg: "rgba(96,165,250,0.1)",  icon: Eye          },
  "Approved":         { color: "#4ade80",               bg: "rgba(74,222,128,0.1)",  icon: CheckCircle  },
  "Delivered":        { color: "#FF3B1A",               bg: "rgba(255,59,26,0.12)",  icon: Truck        },
};

const TABS = [
  { id: "bins",    label: "Content Bins",    icon: Inbox         },
  { id: "uploads", label: "Weekly Uploads",  icon: Play          },
  { id: "chat",    label: "Team Chat",       icon: MessageSquare },
  { id: "billing", label: "Billing",         icon: CreditCard    },
] as const;

type Tab = typeof TABS[number]["id"];

/* ─── Component ─────────────────────────────────── */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("bins");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(MESSAGES);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setChatMessages(prev => [...prev, { from: "You", time: "Just now", text: message, me: true }]);
    setMessage("");
  };

  const delivered  = CONTENT_BINS.filter(c => c.status === "Delivered").length;
  const inReview   = CONTENT_BINS.filter(c => c.status === "Ready for Review").length;
  const inProd     = CONTENT_BINS.filter(c => c.status === "In Production").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        :root { --fire: #FF3B1A; --black: #080808; --font-bebas: 'Bebas Neue', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #F0EDE6; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        textarea { outline: none; resize: none; }
        input { outline: none; }
        @media (max-width: 768px) {
          .dash-layout { flex-direction: column !important; }
          .dash-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; overflow-x: auto !important; padding: 12px 16px !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; position: relative !important; }
          .dash-sidebar-logo { display: none !important; }
          .dash-sidebar-footer { display: none !important; }
          .dash-tab-btn span.tab-label { display: none !important; }
          .dash-tab-btn { padding: 10px 14px !important; gap: 0 !important; }
          .dash-main { padding: 20px 16px !important; }
          .stat-row { flex-wrap: wrap !important; }
          .stat-box { flex: 1 1 calc(50% - 8px) !important; }
        }
      `}</style>

      <div className="dash-layout" style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar" style={{
          width: 240,
          flexShrink: 0,
          background: "#0d0d0d",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}>
          <div className="dash-sidebar-logo" style={{ marginBottom: 32, paddingLeft: 4 }}>
            <a href="/">
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGC Fire"
                width={110}
                height={44}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </a>
          </div>

          {/* Plan badge */}
          <div className="dash-sidebar-logo" style={{
            background: "rgba(255,59,26,0.1)",
            border: "1px solid rgba(255,59,26,0.25)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 11, color: "#FF3B1A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Active Plan</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{BRAND.plan}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{BRAND.videos} videos / month</div>
          </div>

          {/* Nav tabs */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className="dash-tab-btn"
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: activeTab === id ? 600 : 400,
                  background: activeTab === id ? "rgba(255,59,26,0.12)" : "transparent",
                  color: activeTab === id ? "#FF3B1A" : "rgba(255,255,255,0.5)",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (activeTab !== id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (activeTab !== id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <Icon size={16} />
                <span className="tab-label">{label}</span>
                {id === "uploads" && inReview > 0 && (
                  <span style={{ marginLeft: "auto", background: "#FF3B1A", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                    {inReview}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div className="dash-sidebar-footer" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <a href="/login" style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: 8,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              <LogOut size={14} />
              Sign out
            </a>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="dash-main" style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 32, letterSpacing: "0.04em", color: "#fff", lineHeight: 1 }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                Welcome back, {BRAND.name}
              </p>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px",
              cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>
              <Bell size={14} /> Notifications
            </button>
          </div>

          {/* ── CONTENT BINS ── */}
          {activeTab === "bins" && (
            <div>
              {/* Stats */}
              <div className="stat-row" style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
                {[
                  { label: "Delivered",        value: delivered, color: "#FF3B1A" },
                  { label: "Ready to Review",  value: inReview,  color: "#60a5fa" },
                  { label: "In Production",    value: inProd,    color: "#facc15" },
                  { label: "Total This Month", value: CONTENT_BINS.length, color: "rgba(255,255,255,0.7)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="stat-box" style={{
                    flex: "1 1 140px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    padding: "20px 20px",
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-bebas)", color, letterSpacing: "0.02em" }}>{value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CONTENT_BINS.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: "14px 18px",
                      flexWrap: "wrap",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: cfg.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={16} color={cfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.week}</div>
                      </div>
                      <div style={{
                        background: cfg.bg, borderRadius: 20, padding: "4px 12px",
                        fontSize: 12, fontWeight: 600, color: cfg.color, whiteSpace: "nowrap",
                      }}>
                        {item.status}
                      </div>
                      {(item.status === "Ready for Review" || item.status === "Approved" || item.status === "Delivered") && (
                        <button style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(255,59,26,0.1)", border: "1px solid rgba(255,59,26,0.2)",
                          borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                          fontSize: 12, color: "#FF3B1A", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                        }}>
                          <Download size={12} /> {item.status === "Ready for Review" ? "Review" : "Download"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── WEEKLY UPLOADS ── */}
          {activeTab === "uploads" && (
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                New content drops every week. Videos marked <span style={{ color: "#60a5fa" }}>Ready for Review</span> are waiting for your approval.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                {CONTENT_BINS.filter(c => ["Ready for Review", "Approved", "Delivered"].includes(c.status)).map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <div key={item.id} style={{
                      background: "#141414",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: 200,
                        background: "linear-gradient(145deg, #1a0800, #2a1200, #111)",
                        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "rgba(255,59,26,0.85)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Play size={16} color="#fff" fill="#fff" />
                        </div>
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          background: cfg.bg, borderRadius: 20,
                          padding: "3px 9px", fontSize: 10, fontWeight: 700, color: cfg.color,
                        }}>
                          {item.status === "Ready for Review" ? "REVIEW" : item.status.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, marginBottom: 8 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{item.week}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TEAM CHAT ── */}
          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxHeight: 600 }}>
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 16,
              }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.me ? "flex-end" : "flex-start",
                  }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                      {msg.from} · {msg.time}
                    </div>
                    <div style={{
                      maxWidth: "75%",
                      background: msg.me ? "rgba(255,59,26,0.15)" : "rgba(255,255,255,0.05)",
                      border: msg.me ? "1px solid rgba(255,59,26,0.25)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 14,
                      color: msg.me ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)",
                      lineHeight: 1.6,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} style={{ display: "flex", gap: 10 }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message the UGCFire team…"
                  rows={2}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button type="submit" style={{
                  background: "#FF3B1A", border: "none", borderRadius: 12,
                  padding: "0 20px", cursor: "pointer", color: "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
                  flexShrink: 0,
                }}>Send</button>
              </form>
            </div>
          )}

          {/* ── BILLING ── */}
          {activeTab === "billing" && (
            <div>
              {/* Plan card */}
              <div style={{
                background: "rgba(255,59,26,0.07)",
                border: "1px solid rgba(255,59,26,0.25)",
                borderRadius: 18,
                padding: "28px 28px",
                marginBottom: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#FF3B1A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Current Plan</div>
                  <div style={{ fontFamily: "var(--font-bebas)", fontSize: 36, color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>{BRAND.plan}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>$5,000 / month · {BRAND.videos} UGC-style videos · Renews May 1, 2026</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} color="#FF3B1A" fill="#FF3B1A" strokeWidth={0} />)}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>Active subscription</span>
                  </div>
                </div>
                <a href="#" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,59,26,0.15)", border: "1px solid rgba(255,59,26,0.3)",
                  borderRadius: 10, padding: "10px 18px", textDecoration: "none",
                  fontSize: 13, fontWeight: 600, color: "#FF3B1A",
                }}>
                  Manage Plan <ChevronRight size={14} />
                </a>
              </div>

              {/* Invoices */}
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: "0.06em", color: "#fff", marginBottom: 14 }}>
                Invoice History
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {INVOICES.map((inv) => (
                  <div key={inv.id} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "14px 18px",
                    flexWrap: "wrap",
                  }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{inv.id}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{inv.date}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{inv.amount}</div>
                    <div style={{
                      background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                      borderRadius: 20, padding: "4px 12px",
                      fontSize: 12, fontWeight: 600, color: "#4ade80",
                    }}>
                      {inv.status}
                    </div>
                    <button style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                      fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <Download size={12} /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
