import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeWrapper } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "海龟汤 - 情境推理游戏",
  description: "在线多人海龟汤游戏，通过提问是/否问题来推理出完整的故事",
  keywords: ["海龟汤", "情境推理", "推理游戏", "多人游戏", "在线游戏", "益智游戏", "Lateral Thinking Puzzle"],
  authors: [{ name: "Puzzle Games" }],
  creator: "Puzzle Games",
  publisher: "Puzzle Games",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://puzzle-games.example.com'),
  openGraph: {
    title: "海龟汤 - 情境推理游戏",
    description: "在线多人海龟汤游戏，通过提问是/否问题来推理出完整的故事",
    type: "website",
    locale: "zh_CN",
    siteName: "海龟汤",
  },
  twitter: {
    card: "summary",
    title: "海龟汤 - 情境推理游戏",
    description: "在线多人海龟汤游戏，通过提问是/否问题来推理出完整的故事",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
