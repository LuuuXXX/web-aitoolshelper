import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: '隐私政策',
  description: 'AI工具箱隐私政策 — 遵循《个人信息保护法》，详细说明信息收集、使用、留存、第三方共享及用户权利。',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">隐私政策</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>最后更新：2026年7月16日</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <p>
                AI工具箱（以下简称&quot;本服务&quot;）深知个人信息对您的重要性。本政策遵循
                <strong>《中华人民共和国个人信息保护法》（以下简称&quot;PIPL&quot;）</strong>、
                《网络安全法》、《数据安全法》及《生成式人工智能服务管理暂行办法》等相关法律法规，
                详细说明我们如何收集、使用、存储、共享和保护您的个人信息。
              </p>
              <p className="mt-2">
                请您在使用本服务前，仔细阅读并充分理解本政策的全部内容。一旦您开始使用本服务，即表示您已同意本政策。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">一、我们收集的个人信息</h2>
              <p>在您使用本服务的过程中，我们会收集以下信息：</p>
              <p>1. <strong>注册信息</strong>：邮箱地址、昵称、密码（经 bcrypt 不可逆加密存储）。</p>
              <p>2. <strong>AI 工具使用记录</strong>：您在使用 AI 工具时输入的文本内容及生成结果。</p>
              <p>3. <strong>订单信息</strong>：订阅套餐类型、支付订单号、支付宝交易号、支付金额（不存储您的支付凭证或银行卡信息）。</p>
              <p>4. <strong>日志信息</strong>：访问时间、IP 地址、浏览器类型等技术日志，用于安全防护和故障排查。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">二、信息使用目的</h2>
              <p>我们收集的个人信息仅用于以下目的：</p>
              <p>1. 提供和维护 AI 工具服务；</p>
              <p>2. 用户身份验证和账号管理；</p>
              <p>3. 处理订阅支付和订单管理；</p>
              <p>4. 保存您的历史使用记录，方便您查阅；</p>
              <p>5. 服务安全防护、反欺诈和故障排查；</p>
              <p>6. 服务优化和功能改进。</p>
              <p>我们不会将您的个人信息用于上述目的以外的任何用途，也<strong>不会向任何第三方出售您的个人信息</strong>。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">三、AI 处理专项告知与同意</h2>
              <p>
                根据《生成式人工智能服务管理暂行办法》的要求，我们在此特别告知您：
              </p>
              <p>1. 本服务的 AI 工具基于 <strong>DeepSeek</strong> 大语言模型提供。您在使用工具时输入的文本内容将被发送至 DeepSeek 的 API 接口进行 AI 处理和内容生成。</p>
              <p>2. <strong>请您注意：不要在输入内容中包含身份证号、银行卡号、医疗记录等敏感个人信息。</strong></p>
              <p>3. AI 生成的内容由模型自动产生，可能存在不准确或不恰当之处，您应当自行审核判断，并对使用生成内容的行为承担责任。</p>
              <p>4. 您使用 AI 工具的行为，即视为您知悉并同意上述处理方式。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">四、第三方服务与数据共享</h2>
              <p>为实现服务功能，我们在以下场景向第三方服务提供商共享必要的个人信息：</p>
              <p>1. <strong>DeepSeek（AI 服务）</strong>：您输入的文本内容会发送至 DeepSeek API 进行处理。DeepSeek 作为独立的个人信息处理者，受其隐私政策约束。</p>
              <p>2. <strong>支付宝（支付服务）</strong>：支付过程中您将被引导至支付宝页面完成交易。我们仅接收支付状态和订单号，不接触您的支付凭证。</p>
              <p>3. <strong>邮件服务提供商</strong>：用于发送注册验证码和密码重置邮件，仅涉及邮箱地址。</p>
              <p>除上述场景外，我们不会向其他第三方共享您的个人信息，但以下情况除外：经您另行同意；法律法规要求；行政或司法机关依法要求。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">五、数据留存与删除</h2>
              <p>我们仅在实现服务目的所必需的最短期限内留存您的个人信息：</p>
              <p>1. <strong>注册信息</strong>：在您的账号存续期间保留。账号注销后将在 30 个工作日内删除或匿名化处理。</p>
              <p>2. <strong>AI 工具使用记录</strong>：自生成之日起保留 <strong>90 天</strong>，到期后自动删除。您可以随时在控制台手动删除历史记录。</p>
              <p>3. <strong>订单信息</strong>：根据《会计法》要求，交易相关记录至少保存 10 年。</p>
              <p>4. <strong>日志信息</strong>：保留不超过 30 天。</p>
              <p>当留存期限届满或服务目的已实现时，我们将通过技术手段对您的个人信息进行删除或匿名化处理。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">六、数据安全</h2>
              <p>我们采取以下措施保护您的个人信息安全：</p>
              <p>1. 用户密码使用 bcrypt 算法加盐加密存储，任何人无法逆向获取明文密码。</p>
              <p>2. 全站使用 HTTPS（TLS 1.2/1.3）加密传输，防止数据在传输过程中被窃取或篡改。</p>
              <p>3. 数据库部署于阿里云 RDS，具备网络隔离、白名单访问控制和自动备份。</p>
              <p>4. API 密钥、支付密钥等敏感信息独立安全存储，不在代码仓库中暴露。</p>
              <p>5. 尽管我们采取了合理的安全措施，但请理解在互联网环境下不存在绝对的信息安全。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">七、Cookie 使用</h2>
              <p>本服务使用 Cookie 维持用户登录状态（有效期 7 天）。该 Cookie 不包含您的明文密码等敏感信息，且仅在当前域名下使用。您可以通过浏览器设置清除 Cookie，但清除后需要重新登录。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">八、您的权利</h2>
              <p>根据 PIPL 的规定，您对您的个人信息享有以下权利：</p>
              <p>1. <strong>知情权与决定权</strong>：了解我们如何处理您的个人信息，并有权限制或拒绝。</p>
              <p>2. <strong>查阅与复制权</strong>：您可以在控制台查看您的账号信息和使用记录，也可以联系我们获取个人信息副本。</p>
              <p>3. <strong>更正与补充权</strong>：您可以在控制台修改昵称等个人信息。如需更正其他信息，请联系我们。</p>
              <p>4. <strong>删除权</strong>：您可以手动删除 AI 工具使用记录，也可以申请删除整个账号及相关数据。</p>
              <p>5. <strong>撤回同意权</strong>：您有权随时撤回对本隐私政策的同意，撤回后我们将停止处理（但已合法处理的部分除外）。</p>
              <p>6. <strong>账号注销权</strong>：您有权注销您的账号，注销后您的个人信息将在 30 个工作日内删除或匿名化。</p>
              <p>如需行使上述权利，请通过本政策末尾的联系方式与我们取得联系。我们将在 15 个工作日内回复您的请求。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">九、未成年人保护</h2>
              <p>本服务不面向 14 周岁以下未成年人。如果您是 14 周岁以下的未成年人，请在监护人陪同下阅读本政策，并在取得监护人同意后使用本服务。如发现未成年人在未经监护人同意的情况下注册或使用本服务，我们将采取措施删除相关信息。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">十、政策更新</h2>
              <p>当本政策的实质性内容发生变更时，我们将在本页面发布更新后的政策并更新日期。对于重大变更，我们可能通过网站公告或邮件方式通知您。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">十一、联系我们</h2>
              <p>如您对本隐私政策有任何疑问、建议或需要行使个人信息权利，请通过以下方式联系我们：</p>
              <p>邮箱：<a href="mailto:aitoolshelper@163.com" className="text-brand-500 hover:underline">aitoolshelper@163.com</a></p>
              <p>我们将在收到您的消息后尽快回复。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
