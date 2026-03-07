import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: "FaceFortune.ai - AI 관상 분석",
  description:
    "AI가 당신의 얼굴에서 운명을 읽어드립니다. 마의상법, 신상전편 등 5대 고전 기반 정통 관상 분석.",
  keywords: [
    "관상",
    "AI 관상",
    "운세",
    "얼굴 분석",
    "FaceFortune",
    "관상학",
    "마의상법",
    "진로",
    "적성",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FaceFortune",
    startupImage: "/icon.svg",
  },
  openGraph: {
    title: "FaceFortune.ai - AI 관상 분석",
    description: "마의상법 등 5대 고전 기반, AI가 당신의 운명을 읽어드립니다",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="FaceFortune" />
        <link rel="apple-touch-startup-image" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
