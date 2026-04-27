import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — UGCFire",
  description: "UGCFire Terms of Service for monthly UGC content subscriptions.",
};

export default function TermsPage() {
  return (
    <main style={{
      background: "#080808",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      padding: "80px 2rem",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 40 }}>
          ← Back to UGCFire
        </Link>

        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, color: "#fff" }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>Last updated: April 2026</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Services</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            UGCFire provides monthly AI-assisted UGC content subscription services. Subscribers receive
            short-form video content, creative direction, hook and script creation, captions, and revisions
            according to the selected plan (Growth or Scale). Service begins following a completed discovery
            call and onboarding.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Booking & Discovery Calls</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            Users may book discovery calls through the UGCFire website. By booking a call, you agree to
            provide accurate contact and brand information. Discovery calls are used to determine whether
            UGCFire is the right fit for your brand and to select an appropriate subscription plan.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Subscriptions & Billing</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            UGCFire subscriptions are billed monthly. Subscriptions may be cancelled at any time. Cancellation
            takes effect at the end of the current billing period. No refunds are provided for partial months
            unless otherwise agreed in writing.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Acceptable Use</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            Users agree not to misuse the UGCFire website or submit false booking information. Content
            delivered by UGCFire is licensed to the subscriber for use in their marketing and advertising.
            Users may not resell or redistribute UGCFire content without written permission.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Limitation of Liability</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            UGCFire is not liable for indirect, incidental, or consequential damages arising from the use of
            our services. Our total liability for any claim shall not exceed the amount paid by the subscriber
            in the month in which the claim arose.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Contact</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            Questions about these terms? Contact us at{" "}
            <a href="mailto:hello@ugcfire.com" style={{ color: "#FF3B1A" }}>hello@ugcfire.com</a>.
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 32, display: "flex", gap: 24 }}>
          <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </main>
  );
}
