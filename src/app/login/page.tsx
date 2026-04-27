'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        :root { --fire: #FF3B1A; --black: #080808; --font-bebas: 'Bebas Neue', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #F0EDE6; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        input { outline: none; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #161616 inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d0300 0%, #080808 60%)",
        padding: "24px 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,59,26,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <a href="/">
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGC Fire"
                width={140}
                height={56}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </a>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "36px 32px",
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 4,
              marginBottom: 28,
            }}>
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "background 0.2s, color 0.2s",
                    background: tab === t ? "#FF3B1A" : "transparent",
                    color: tab === t ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <h2 style={{
              fontFamily: "var(--font-bebas)",
              fontSize: 28,
              letterSpacing: "0.04em",
              color: "#fff",
              marginBottom: 6,
            }}>
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
              {tab === "signin"
                ? "Sign in to access your UGCFire client dashboard."
                : "Get access to your UGCFire content dashboard."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tab === "signup" && (
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 15,
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  EMAIL
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    placeholder="you@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: "12px 16px 12px 40px",
                      fontSize: 15,
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: "12px 44px 12px 40px",
                      fontSize: 15,
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPass
                      ? <EyeOff size={16} color="rgba(255,255,255,0.3)" />
                      : <Eye size={16} color="rgba(255,255,255,0.3)" />}
                  </button>
                </div>
              </div>

              {tab === "signin" && (
                <div style={{ textAlign: "right", marginTop: -8 }}>
                  <a href="#" style={{ fontSize: 12, color: "rgba(255,59,26,0.8)", textDecoration: "none" }}>Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  background: "#FF3B1A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  marginTop: 4,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FF5533")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FF3B1A")}
              >
                {tab === "signin" ? "Sign In to Dashboard" : "Create Account"}
              </button>
            </form>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 20 }}>
              {tab === "signin"
                ? <>Don&apos;t have an account?{" "}<button onClick={() => setTab("signup")} style={{ background: "none", border: "none", color: "#FF3B1A", cursor: "pointer", fontSize: 12, padding: 0 }}>Sign up</button></>
                : <>Already have an account?{" "}<button onClick={() => setTab("signin")} style={{ background: "none", border: "none", color: "#FF3B1A", cursor: "pointer", fontSize: 12, padding: 0 }}>Sign in</button></>}
            </p>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>← Back to ugcfire.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
