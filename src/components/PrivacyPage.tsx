import { useNavigate } from 'react-router-dom'

export default function PrivacyPage() {
  const nav = useNavigate()

  return (
    <div style={{ padding: 'var(--page-padding)', paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>返回</button>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))' }}>
        隐私政策
      </h1>

      <div style={{ padding: '16px 0', fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          更新日期：2026 年 5 月 13 日
        </p>

        <Section title="一、信息收集">
          <p>当您使用比比喵服务时，我们会收集以下类型的信息：</p>
          <List>
            <li><strong>账户信息</strong>：通过 Clerk 身份验证服务，我们收集您的邮箱地址、用户名和头像。Clerk 的隐私实践请参阅其<a href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>官方隐私政策</a>。</li>
            <li><strong>使用数据</strong>：您的搜索记录、浏览记录和收藏商品，用于提供个性化服务。</li>
            <li><strong>偏好设置</strong>：主题选择、默认运费参数、默认显示币种等本地偏好，存储于您的浏览器中。</li>
            <li><strong>设备信息</strong>：浏览器类型和操作系统版本等基础技术信息，用于服务优化。</li>
          </List>
          <p>我们不使用任何第三方分析工具（如 Google Analytics），也不投放广告。</p>
        </Section>

        <Section title="二、信息使用">
          <p>收集的信息仅用于以下目的：</p>
          <List>
            <li>提供、维护和改进比比喵服务</li>
            <li>实现商品搜索、价格展示、收藏管理、成本计算等核心功能</li>
            <li>根据您的会员等级提供相应的功能权限</li>
            <li>响应您的支持请求</li>
            <li>保障服务安全，防止欺诈和滥用</li>
          </List>
        </Section>

        <Section title="三、信息存储">
          <p>您的账户数据存储在 Neon PostgreSQL 数据库中，由 Clerk 管理的身份验证令牌保护。我们采取合理的技术措施保护您的数据安全。</p>
          <p>本地偏好（主题、搜索历史、浏览记录、运费设置）存储在您的浏览器 localStorage 中，不会上传至服务器（登录后的搜索记录和浏览记录除外）。</p>
        </Section>

        <Section title="四、信息共享">
          <p>我们不会出售您的个人信息。在以下情况下可能共享有限数据：</p>
          <List>
            <li><strong>Clerk</strong>：身份验证和用户管理</li>
            <li><strong>Neon</strong>：数据库托管服务</li>
            <li><strong>Frankfurter API</strong>：汇率数据（仅发送货币代码，不包含个人信息）</li>
            <li><strong>法律要求</strong>：依法披露时</li>
          </List>
        </Section>

        <Section title="五、Cookie 与本地存储">
          <p>Clerk 使用必要的 Cookie 来维持您的登录会话。本应用使用 localStorage 存储您的偏好设置。这些数据不会用于追踪或广告目的。</p>
          <p>您可以在浏览器设置中清除 localStorage 和 Cookie，但这可能影响部分功能的正常使用。</p>
        </Section>

        <Section title="六、您的权利">
          <p>根据适用的数据保护法律，您享有以下权利：</p>
          <List>
            <li><strong>访问权</strong>：请求获取我们存储的您的个人数据</li>
            <li><strong>更正权</strong>：修正不准确的个人信息（可在"我的"页面直接修改用户名）</li>
            <li><strong>删除权</strong>：请求删除您的账户和相关数据。请联系我们处理，或使用 Clerk 账户管理功能自主删除账户</li>
            <li><strong>数据可携权</strong>：请求导出您的数据</li>
          </List>
          <p>如需行使上述权利，请通过下方的联系方式与我们联系。</p>
        </Section>

        <Section title="七、未成年人保护">
          <p>比比喵服务不面向 14 周岁以下的未成年人。如果我们知悉收集了未成年人的个人信息，将立即删除。</p>
        </Section>

        <Section title="八、政策更新">
          <p>我们可能会不时更新本隐私政策。重大变更将通过应用内通知或邮件告知。继续使用服务即表示您同意更新后的政策。</p>
        </Section>

        <Section title="九、联系我们">
          <p>如对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', padding: '8px 12px', display: 'inline-block' }}>
            邮箱：privacy@bibimiao.com
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px', paddingBottom: '4px', borderBottom: 'var(--border-width) solid var(--border-default)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
      {children}
    </ul>
  )
}
