import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = { title: '服务条款 - AI工具箱' }

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">服务条款</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>最后更新：2026年7月15日</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold mb-2">一、服务说明</h2>
              <p>AI工具箱（以下简称&quot;本服务&quot;）由本站运营方提供，是一个基于人工智能技术的在线工具服务平台。用户通过注册和使用本服务，即表示同意本服务条款的全部内容。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">二、用户注册</h2>
              <p>1. 用户须使用真实有效的邮箱或手机号注册账号。</p>
              <p>2. 用户应妥善保管账号密码，因账号泄露导致的损失由用户自行承担。</p>
              <p>3. 每个用户仅可注册一个账号。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">三、使用规范</h2>
              <p>用户在使用本服务时，不得利用本服务从事以下行为：</p>
              <p>1. 违反国家法律法规的行为；</p>
              <p>2. 生成侵犯他人知识产权的内容；</p>
              <p>3. 生成虚假、欺诈、诽谤、歧视等不良内容；</p>
              <p>4. 对服务进行攻击、破解或试图获取未授权的访问权限；</p>
              <p>5. 以任何方式滥用服务资源。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">四、付费服务</h2>
              <p>1. 本服务提供免费和付费两种套餐，用户可自行选择。</p>
              <p>2. 付费服务一经购买，在有效期内不可转让。</p>
              <p>3. 支持 7 天无理由退款（需未大量使用额度）。</p>
              <p>4. 价格如有调整，以实际支付页面显示为准。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">五、知识产权</h2>
              <p>1. 本服务的软件、技术、界面设计等知识产权归本站所有。</p>
              <p>2. 用户使用本工具生成的内容，用户享有使用权。</p>
              <p>3. AI 生成的内容仅供参考，用户应自行审核内容的准确性和合法性。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">六、免责声明</h2>
              <p>1. 本服务生成的内容由 AI 模型产生，可能存在错误或不准确之处，用户应自行判断和核实。</p>
              <p>2. 本服务不对生成内容的准确性、完整性做出保证。</p>
              <p>3. 因不可抗力导致服务中断，本站不承担责任。</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">七、条款修改</h2>
              <p>本站保留随时修改本服务条款的权利，修改后的条款自发布之日起生效。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
