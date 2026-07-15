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

export const metadata: Metadata = {
  title: "AI工具箱 - 开箱即用的AI应用服务平台",
  description: "集合12+款AI实用工具，涵盖智能写作、营销文案、文档处理、翻译、简历优化等，让AI为你的工作和创作赋能。",
  keywords: "AI工具,智能写作,AI文案,文档摘要,AI翻译,简历优化,周报生成",
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
