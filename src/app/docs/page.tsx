import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TOOLS, CATEGORIES } from '@/config/tools'

export const metadata = {
  title: '使用文档',
  description: 'AI工具箱完整使用指南 - 快速开始、注册登录、工具使用、套餐订阅、支付说明及常见问题解答。',
  alternates: {
    canonical: '/docs',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '生成的内容质量不好怎么办？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '建议提供更详细的输入信息，或多次尝试不同的输入组合。AI 生成的内容可作为参考和灵感，结合个人修改效果更佳。',
      },
    },
    {
      '@type': 'Question',
      name: '每日额度用完了怎么办？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '可升级到付费套餐获得更多额度（月度50次/天、季度50次/天、年度80次/天），额度每天 00:00 重置。',
      },
    },
    {
      '@type': 'Question',
      name: '我的数据安全吗？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '所有数据传输使用 HTTPS 加密，密码使用 bcrypt 哈希存储，API 密钥安全保管，绝不泄露。',
      },
    },
    {
      '@type': 'Question',
      name: '可以退款吗？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '付费套餐为一次性付款，有效期满后自动恢复免费方案。如需退款（购买后未使用且 24 小时内），请联系客服处理。',
      },
    },
  ],
}

export default function DocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">使用文档</h1>
          <p style={{ color: 'var(--muted)' }} className="mb-8">快速了解 AI工具箱 的功能和使用方法</p>

          <nav className="card p-4 mb-8 sticky top-20">
            <h3 className="text-sm font-bold mb-2">目录</h3>
            <ul className="text-sm space-y-1">
              <li><a href="#start" className="text-brand-500 hover:underline">1. 快速开始</a></li>
              <li><a href="#register" className="text-brand-500 hover:underline">2. 注册与登录</a></li>
              <li><a href="#tools" className="text-brand-500 hover:underline">3. 使用工具</a></li>
              <li><a href="#plan" className="text-brand-500 hover:underline">4. 套餐与订阅</a></li>
              <li><a href="#payment" className="text-brand-500 hover:underline">5. 支付说明</a></li>
              <li><a href="#faq" className="text-brand-500 hover:underline">6. 常见问题</a></li>
            </ul>
          </nav>

          <section id="start" className="mb-10">
            <h2 className="text-xl font-bold mb-3">1. 快速开始</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              <p>AI工具箱提供 {TOOLS.length}+ 款开箱即用的 AI 工具，涵盖以下分类：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {CATEGORIES.map((c) => {
                  const count = TOOLS.filter((t) => t.category === c.id).length
                  return <li key={c.id}><strong>{c.name}</strong> - {count} 款工具</li>
                })}
              </ul>
              <p>使用步骤：注册账号 → 选择工具 → 填写表单 → 一键生成。</p>
            </div>
          </section>

          <section id="register" className="mb-10">
            <h2 className="text-xl font-bold mb-3">2. 注册与登录</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p><strong>注册：</strong>支持邮箱注册。填写邮箱后点击「发送验证码」，输入收到的验证码即可完成注册。</p>
              <p><strong>登录：</strong>使用注册时的邮箱 + 密码登录。登录状态保持 7 天。</p>
              <p><strong>找回密码：</strong>在登录页点击「忘记密码?」，通过邮箱验证码重置密码。</p>
              <p><strong>安全提示：</strong>密码至少 8 位，建议使用字母、数字和特殊字符组合。</p>
            </div>
          </section>

          <section id="tools" className="mb-10">
            <h2 className="text-xl font-bold mb-3">3. 使用工具</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p><strong>选择工具：</strong>在工具库页面浏览所有工具，点击工具卡片进入工具详情页。</p>
              <p><strong>填写表单：</strong>根据工具要求填写相关信息。带 <span className="text-red-500">*</span> 的为必填项。</p>
              <p><strong>生成内容：</strong>点击「生成内容」按钮，AI 将在数秒内为你生成结果。</p>
              <p><strong>复制结果：</strong>生成结果后，点击右上角的「复制」按钮即可复制到剪贴板。</p>
              <p><strong>使用记录：</strong>所有生成的内容都会保存在「历史记录」中，方便随时查看。</p>
            </div>
          </section>

          <section id="plan" className="mb-10">
            <h2 className="text-xl font-bold mb-3">4. 套餐与订阅</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>我们提供以下套餐：</p>
              <table className="w-full text-sm card">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <th className="p-3 text-left">套餐</th>
                    <th className="p-3 text-left">价格</th>
                    <th className="p-3 text-left">每日额度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <td className="p-3">免费体验</td>
                    <td className="p-3">¥0</td>
                    <td className="p-3">5 次/天</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <td className="p-3">月度会员</td>
                    <td className="p-3">¥19.9/月</td>
                    <td className="p-3">50 次/天</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <td className="p-3">季度会员</td>
                    <td className="p-3">¥59/季</td>
                    <td className="p-3">50 次/天</td>
                  </tr>
                  <tr>
                    <td className="p-3">年度会员</td>
                    <td className="p-3">¥168/年</td>
                    <td className="p-3">80 次/天</td>
                  </tr>
                </tbody>
              </table>
              <p>每日额度在每天 00:00 重置。未使用的额度不会累积。</p>
            </div>
          </section>

          <section id="payment" className="mb-10">
            <h2 className="text-xl font-bold mb-3">5. 支付说明</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>目前支持<strong>支付宝</strong>支付。选择套餐后点击「支付宝支付」即可跳转到支付宝收银台完成付款。</p>
              <p>支付成功后，会员权益将立即生效。如遇支付问题，请联系客服。</p>
              <p>支持特殊情况退款（购买后未使用且在 24 小时内），请联系客服处理。</p>
            </div>
          </section>

          <section id="faq" className="mb-10">
            <h2 className="text-xl font-bold mb-3">6. 常见问题</h2>
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="card p-4">
                <h4 className="font-medium mb-1">Q: 生成的内容质量不好怎么办？</h4>
                <p style={{ color: 'var(--muted)' }}>A: 建议提供更详细的输入信息，或多次尝试不同的输入组合。AI 生成的内容可作为参考和灵感。</p>
              </div>
              <div className="card p-4">
                <h4 className="font-medium mb-1">Q: 每日额度用完了怎么办？</h4>
                <p style={{ color: 'var(--muted)' }}>A: 可升级到付费套餐获得更多额度，额度每天 00:00 重置。</p>
              </div>
              <div className="card p-4">
                <h4 className="font-medium mb-1">Q: 我的数据安全吗？</h4>
                <p style={{ color: 'var(--muted)' }}>A: 所有数据传输使用 HTTPS 加密，密码使用 bcrypt 哈希存储，API 密钥安全保管，绝不泄露。</p>
              </div>
              <div className="card p-4">
                <h4 className="font-medium mb-1">Q: 可以退款吗？</h4>
                <p style={{ color: 'var(--muted)' }}>A: 付费套餐为一次性付款，有效期满后自动恢复免费方案。如需退款（购买后未使用且 24 小时内），请联系客服处理。</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
