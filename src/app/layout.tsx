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
  description: "AI가 당신의 얼굴에서 운명을 읽어드립니다. 얼굴 사진을 업로드하고 관상학적 해석과 운세를 확인해보세요.",
  keywords: ["관상", "AI 관상", "운세", "얼굴 분석", "FaceFortune"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FaceFortune",
  },
  openGraph: {
    title: "FaceFortune.ai - AI 관상 분석",
    description: "AI가 당신의 얼굴에서 운명을 읽어드립니다",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
