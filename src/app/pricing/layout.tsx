import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '套餐定价',
  description:
    'AI工具箱套餐定价方案 - 月度¥19.9、季度¥59、年度¥168，每日50-80次AI工具使用额度，支持支付宝支付，7天无理由退款。',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'AI工具箱套餐定价 - 灵活方案，低至¥0.46/天',
    description:
      '月度¥19.9、季度¥59、年度¥168，畅享全部12+款AI工具。支持支付宝支付，7天无理由退款。',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
