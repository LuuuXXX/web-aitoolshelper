export interface PlanConfig {
  id: string
  name: string
  price: number
  originalPrice?: number
  duration: string
  durationDays: number
  dailyLimit: number
  features: string[]
  popular?: boolean
  alipaySubject: string
}

export const PLANS: PlanConfig[] = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 19.9,
    originalPrice: 39,
    duration: '30天',
    durationDays: 30,
    dailyLimit: 50,
    features: [
      '每日 50 次 AI 工具使用',
      '全部 12+ 款工具免费用',
      '优先响应速度',
      '历史记录保存',
    ],
    alipaySubject: 'AI工具箱-月度会员',
  },
  {
    id: 'quarterly',
    name: '季度会员',
    price: 59,
    originalPrice: 117,
    duration: '90天',
    durationDays: 90,
    dailyLimit: 50,
    features: [
      '每日 50 次 AI 工具使用',
      '全部 12+ 款工具免费用',
      '优先响应速度',
      '历史记录保存',
      '季度数据报告',
      '省 58 元（约 5 折）',
    ],
    popular: true,
    alipaySubject: 'AI工具箱-季度会员',
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 168,
    originalPrice: 468,
    duration: '365天',
    durationDays: 365,
    dailyLimit: 80,
    features: [
      '每日 80 次 AI 工具使用',
      '全部 12+ 款工具免费用',
      '最高优先级响应',
      '无限历史记录保存',
      '年度数据报告',
      '新工具优先体验',
      '省 300 元（约 3.6 折）',
    ],
    alipaySubject: 'AI工具箱-年度会员',
  },
]

export const FREE_PLAN = {
  id: 'free',
  name: '免费体验',
  price: 0,
  dailyLimit: 5,
  features: [
    '每日 5 次 AI 工具体验',
    '基础工具可用',
    '基础响应速度',
  ],
}

export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find((p) => p.id === id)
}

export function getDailyLimitByPlan(plan: string): number {
  if (plan === 'free') return FREE_PLAN.dailyLimit
  const p = getPlanById(plan)
  return p?.dailyLimit ?? FREE_PLAN.dailyLimit
}

export function getPlanLabel(plan: string, expired: boolean = false): string {
  if (plan === 'free' || expired) return '免费用户'
  const labels: Record<string, string> = {
    monthly: '月度会员',
    quarterly: '季度会员',
    yearly: '年度会员',
  }
  return labels[plan] || '免费用户'
}
