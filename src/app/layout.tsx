import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const OG_IMAGE = "https://ugcfire.com/og-image.png";

export const metadata: Metadata = {
  title: "UGCFire — Monthly AI-Assisted UGC Content for Brands",
  description:
    "UGC content without hiring a content team. A monthly AI-assisted UGC subscription for brands that need consistent short-form videos.",
  icons: {
    icon: [{ url: "/favicon.png?v=2" }],
    shortcut: [{ url: "/favicon.png?v=2" }],
    apple: [{ url: "/apple-touch-icon.png?v=2" }],
  },
  openGraph: {
    title: "UGCFire",
    description: "UGC content without hiring a content team.",
    type: "website",
    url: "https://ugcfire.com",
    siteName: "UGCFire",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "UGCFire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UGCFire",
    description: "UGC content without hiring a content team.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
      </body>
    </html>
  );
}
