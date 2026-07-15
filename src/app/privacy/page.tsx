import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = { title: '隐私政策 - AI工具箱' }

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">隐私政策</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>最后更新：2026年7月15日</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold mb-2">一、信息收集</h2>
              <p>我们收集以下类型的用户信息：</p>
              <p>1. <strong>注册信息</strong>：邮箱、昵称、加密后的密码。</p>
              <p>2. <strong>使用记录</strong>：工具使用历史、生成内容记录。</p>
              <p>3. <strong>订单信息</strong>：订阅记录、支付订单号（不存储完整支付凭证）。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">二、信息使用</h2>
              <p>收集的信息仅用于：</p>
              <p>1. 提供和改进 AI 工具服务；</p>
              <p>2. 用户身份验证和账号管理；</p>
              <p>3. 订阅和支付处理；</p>
              <p>4. 服务优化和问题排查。</p>
              <p>我们绝不会将用户信息出售给第三方。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">三、数据安全</h2>
              <p>1. 用户密码使用 bcrypt 算法加密存储，无法逆向破解。</p>
              <p>2. 所有数据传输使用 HTTPS 加密。</p>
              <p>3. API 密钥等敏感信息独立存储，不暴露在前端代码中。</p>
              <p>4. 数据库定期备份，确保数据安全。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">四、数据保留</h2>
              <p>1. 用户账号数据在账号存续期间保留。</p>
              <p>2. 工具使用记录保留以便用户查看历史。</p>
              <p>3. 用户可随时联系我们删除账号和相关数据。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">五、第三方服务</h2>
              <p>本服务使用以下第三方服务：</p>
              <p>1. <strong>DeepSeek AI</strong>：提供 AI 文本生成能力。用户输入的内容将发送至 DeepSeek API 进行处理。</p>
              <p>2. <strong>支付宝</strong>：处理支付交易。我们不接触用户的支付凭证信息。</p>
              <p>3. <strong>邮件服务</strong>：发送验证码通知。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">六、Cookie 使用</h2>
              <p>本服务使用 Cookie 维持用户登录状态。Cookie 不包含明文密码等敏感信息。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">七、未成年人保护</h2>
              <p>本服务不面向 13 岁以下未成年人。如发现未成年人未经监护人同意使用本服务，我们将采取措施删除相关信息。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">八、联系我们</h2>
              <p>如有隐私相关问题，请通过以下方式联系我们。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
