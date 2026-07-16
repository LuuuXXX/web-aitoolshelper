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

const APP_URL = process.env.APP_URL || "https://luuux.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AI工具箱 - 开箱即用的AI应用服务平台",
    template: "%s | AI工具箱",
  },
  description:
    "集合12+款AI实用工具，涵盖智能写作、营销文案、文档处理、AI翻译、简历优化、周报生成等，让AI为你的工作和创作赋能。免费体验，无需安装。",
  keywords: [
    "AI工具",
    "AI工具箱",
    "智能写作",
    "AI文案生成",
    "小红书文案",
    "广告文案",
    "文档摘要",
    "AI翻译",
    "简历优化",
    "周报生成器",
    "商业计划书",
    "AI起名",
    "邮件助手",
    "诗词创作",
    "电商文案",
    "免费AI工具",
    "在线AI工具",
  ],
  authors: [{ name: "AI工具箱" }],
  creator: "AI工具箱",
  publisher: "AI工具箱",
  applicationName: "AI工具箱",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: APP_URL,
    siteName: "AI工具箱",
    title: "AI工具箱 - 开箱即用的AI应用服务平台",
    description:
      "集合12+款AI实用工具，涵盖智能写作、营销文案、文档处理、翻译、简历优化等，让AI为你的工作和创作赋能。",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI工具箱 - 开箱即用的AI应用服务平台",
    description:
      "集合12+款AI实用工具，涵盖智能写作、营销文案、文档处理、翻译、简历优化等。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
