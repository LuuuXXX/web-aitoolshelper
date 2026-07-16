import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: '服务条款',
  description: 'AI工具箱服务条款 — 用户注册、使用规范、付费服务、知识产权、免责声明及争议解决。',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">服务条款</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>最后更新：2026年7月16日</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <p>
                欢迎使用 AI工具箱（以下简称&quot;本服务&quot;）。请在使用本服务前仔细阅读以下条款。
                依据<strong>《中华人民共和国民法典》</strong>、<strong>《网络安全法》</strong>、
                <strong>《生成式人工智能服务管理暂行办法》</strong>等相关法律法规，一旦您注册或使用本服务，
                即表示您已阅读、理解并同意接受本服务条款的全部内容。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">一、服务说明</h2>
              <p>本服务是一个基于人工智能技术的在线工具服务平台，提供智能写作、营销文案、翻译、文档处理等 AI 工具。我们有权在提前通知的情况下对服务内容、功能和定价进行调整。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">二、用户注册与账号管理</h2>
              <p>1. 用户须使用真实有效的邮箱注册账号，并对注册信息的真实性负责。</p>
              <p>2. 用户应妥善保管账号和密码。因账号泄露、借用导致的损失由用户自行承担。</p>
              <p>3. 每个用户仅可注册一个账号。我们有权对违反此规定的账号进行处理。</p>
              <p>4. 用户不得将账号转让、出借或出售给他人。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">三、使用规范</h2>
              <p>用户在使用本服务时，须遵守国家法律法规，不得利用本服务从事以下行为：</p>
              <p>1. 违反宪法、法律和行政法规的行为；</p>
              <p>2. 危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的行为；</p>
              <p>3. 生成侵犯他人知识产权、商业秘密或隐私权的内容；</p>
              <p>4. 生成虚假、欺诈、诽谤、淫秽、暴力、歧视等不良内容；</p>
              <p>5. 生成针对未成年人的违法或不良信息；</p>
              <p>6. 对服务进行攻击、破解、反向工程或试图获取未授权的访问权限；</p>
              <p>7. 以自动化脚本等方式恶意刷量、滥用服务资源。</p>
              <p>如发现用户存在上述行为，我们有权立即暂停或终止服务，并保留追究法律责任的权利。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">四、AI 生成内容特别说明</h2>
              <p>
                根据《生成式人工智能服务管理暂行办法》的规定：
              </p>
              <p>1. <strong>内容责任</strong>：本服务作为生成式人工智能服务提供者，对 AI 生成内容承担相应管理责任，并将依法处置违法不良内容。用户使用工具生成的内容不得违反法律法规。</p>
              <p>2. <strong>内容准确性</strong>：AI 生成的内容由大语言模型自动产生，可能存在错误、偏见或不准确之处。生成内容仅供参考，<strong>用户应当对使用 AI 生成内容的行为及由此产生的后果自行承担责任</strong>。</p>
              <p>3. <strong>敏感信息</strong>：请勿在输入内容中包含身份证号、银行卡号、医疗健康记录等敏感个人信息。因用户主动输入敏感信息导致的任何后果，由用户自行承担。</p>
              <p>4. <strong>内容标识</strong>：根据相关法规要求，AI 生成的内容可能需要进行适当标识。用户在对外发布或传播 AI 生成内容时，应遵守相关标识规定。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">五、付费服务</h2>
              <p>1. 本服务提供免费和付费两种套餐，用户可自行选择。</p>
              <p>2. 付费服务经支付宝一次性付款，有效期满后自动恢复为免费方案，不会自动续费。</p>
              <p>3. 付费服务在有效期内不可转让。</p>
              <p>4. <strong>退款政策</strong>：因付费服务属于数字内容且涉及 AI 算力成本，购买后原则上不支持退款。如遇特殊情况（购买后未使用且在 24 小时内），可联系客服申请退款。</p>
              <p>5. 价格如有调整，以实际支付页面显示为准。已购买的套餐在有效期内不受价格调整影响。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">六、知识产权</h2>
              <p>1. 本服务的软件、技术、界面设计、工具模板等知识产权归本站运营方所有，受法律保护。</p>
              <p>2. 用户使用本工具生成的内容，用户享有使用权。但用户应确保其输入内容不侵犯他人知识产权。</p>
              <p>3. 未经书面许可，任何人不得复制、转载、传播本服务的受保护内容。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">七、免责声明</h2>
              <p>1. 本服务生成的内容由 AI 模型产生，不构成任何专业建议（法律、医疗、金融等）。用户不应仅依据 AI 生成内容做出重要决策。</p>
              <p>2. 本服务不对生成内容的准确性、完整性、及时性、适用性做出任何明示或暗示的保证。</p>
              <p>3. 因不可抗力（自然灾害、网络故障、第三方服务中断等）导致服务中断，本站不承担责任。</p>
              <p>4. 因用户违反本条款或相关法律法规导致的后果，本站不承担责任。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">八、违约与终止</h2>
              <p>1. 如用户违反本服务条款，我们有权根据情节严重程度采取警告、暂停服务或永久封禁账号等措施。</p>
              <p>2. 因用户违约导致本站遭受损失的，用户应承担赔偿责任。</p>
              <p>3. 用户有权随时注销账号并停止使用本服务。账号注销后，本服务条款项下的权利义务关系终止，但已产生的义务不因账号注销而免除。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">九、条款修改</h2>
              <p>本站保留随时修改本服务条款的权利。修改后的条款自在本页面发布之日起生效。如您在条款修改后继续使用本服务，即视为您同意修改后的条款。如您不同意修改内容，请停止使用本服务。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">十、法律适用与争议解决</h2>
              <p>1. 本服务条款的订立、生效、解释、履行及争议解决均适用<strong>中华人民共和国法律</strong>（不含香港特别行政区、澳门特别行政区及台湾地区法律）。</p>
              <p>2. 因本服务条款或使用本服务产生的任何争议，双方应首先通过友好协商解决。</p>
              <p>3. 协商不成的，任何一方均有权向<strong>本站运营方所在地有管辖权的人民法院</strong>提起诉讼。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">十一、联系方式</h2>
              <p>如您对本服务条款有任何疑问，请联系：</p>
              <p>邮箱：<a href="mailto:aitoolshelper@163.com" className="text-brand-500 hover:underline">aitoolshelper@163.com</a></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
