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

const ICON_URL = "https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/icon/UGCfire.png";

export const metadata: Metadata = {
  title: "UGCFire — Monthly AI-Assisted UGC Content for Brands",
  description:
    "A monthly AI-assisted UGC content subscription for brands that need consistent short-form videos without hiring a full content team.",
  icons: {
    icon: ICON_URL,
    apple: ICON_URL,
    shortcut: ICON_URL,
  },
  openGraph: {
    title: "UGCFire — Monthly AI-Assisted UGC Content for Brands",
    description: "Your brand's content team. On subscription.",
    type: "website",
    url: "https://ugcfire.com",
    images: [
      {
        url: ICON_URL,
        width: 1024,
        height: 1024,
        alt: "UGCFire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UGCFire — Monthly AI-Assisted UGC Content for Brands",
    description: "Your brand's content team. On subscription.",
    images: [ICON_URL],
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
