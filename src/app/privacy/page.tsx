import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — UGCFire",
  description: "How UGCFire collects and uses your information.",
};

export default function PrivacyPage() {
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

        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, color: "#fff" }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>Last updated: April 2026</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Information We Collect</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            UGCFire collects booking and contact information including your name, email address, brand name,
            website, plan interest, notes, and selected booking time. This information is collected when you
            book a discovery call or communicate with our team through our website.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>How We Use Your Information</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            We use the information we collect to schedule discovery calls, communicate with leads and clients,
            and provide monthly UGC content subscription services. We do not sell, rent, or share your
            personal information with third parties for marketing purposes.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Google Calendar Data</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            UGCFire uses the Google Calendar API to check availability, create booked discovery call events,
            and generate Google Meet meeting details. We access only the calendar data necessary to schedule
            and confirm your booking. We do not sell, transfer, or share Google user data with any third party.
            Google Calendar data is used solely for scheduling purposes and is not retained beyond what is
            required to manage your booking.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Data Retention</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            Booking and contact information is retained for the duration of our business relationship and
            for a reasonable period thereafter for record-keeping purposes. You may request deletion of your
            data at any time by contacting us.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#FF3B1A" }}>Contact</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            If you have questions about this Privacy Policy or your data, please contact us at{" "}
            <a href="mailto:hello@ugcfire.com" style={{ color: "#FF3B1A" }}>hello@ugcfire.com</a>.
          </p>
        </section>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 32, display: "flex", gap: 24 }}>
          <Link href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Terms of Service</Link>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </main>
  );
}
