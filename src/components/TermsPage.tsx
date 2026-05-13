import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
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
        用户服务协议
      </h1>

      <div style={{ padding: '16px 0', fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          生效日期：2026 年 5 月 13 日
        </p>

        <Section title="一、服务说明">
          <p>比比喵（以下简称"本服务"）是一个商品价格搜索与参考工具，帮助用户跨品牌、跨来源查找商品信息并进行价格比较。本服务提供的所有信息仅供参考。</p>
          <p>本服务包含免费功能和付费会员功能。会员等级及对应权益详见"我的"页面中的会员说明。</p>
        </Section>

        <Section title="二、账户注册与安全">
          <List>
            <li>您需通过 Clerk 身份验证服务注册账户。注册时请提供真实、准确的邮箱地址。</li>
            <li>您对账户下的所有活动负责。请妥善保管密码，不得将账户出借或转让给他人。</li>
            <li>如发现账户被未授权使用，请立即通知我们。</li>
            <li>我们保留在以下情况下暂停或终止账户的权利：违反本协议、提供虚假信息、滥用服务、长期不活跃。</li>
          </List>
        </Section>

        <Section title="三、用户行为规范">
          <p>使用本服务时，您不得：</p>
          <List>
            <li>未经授权大批量导出或复制平台数据</li>
            <li>干扰或破坏服务的正常运行</li>
            <li>以任何方式绕过付费功能的限制</li>
            <li>上传或传播恶意代码</li>
            <li>利用本服务从事违法活动</li>
            <li>侵犯他人知识产权或隐私权</li>
          </List>
        </Section>

        <Section title="四、知识产权">
          <List>
            <li>比比喵的代码、设计、界面、品牌标识等知识产权归比比喵所有。</li>
            <li>商品图片、品牌名称、商品描述等归属于各自的权利人。本服务仅为索引和展示，不主张对这些内容的所有权。</li>
            <li>用户生成的收藏、评分等数据，用户保留所有权，同时授予本服务在全球范围内为提供服务而使用的许可。</li>
          </List>
        </Section>

        <Section title="五、免责声明（摘要）">
          <p>完整免责声明请参阅《免责声明》页面。以下是关键要点：</p>
          <List>
            <li>商品价格来源于第三方公开信息，可能存在延迟、错误或遗漏</li>
            <li>汇率数据仅供参考，实际交易汇率可能不同</li>
            <li>成本估算结果不构成购买建议</li>
            <li>本服务按"现状"提供，不保证永久可用或无错误</li>
          </List>
        </Section>

        <Section title="六、责任限制">
          <p>在法律允许的最大范围内，比比喵及其运营者对以下情况不承担责任：</p>
          <List>
            <li>因价格信息不准确导致的任何购买决策损失</li>
            <li>服务中断或不可用造成的任何间接损失</li>
            <li>第三方来源（商品链接、品牌官网）的内容或行为</li>
            <li>汇率波动导致的计算差异</li>
          </List>
        </Section>

        <Section title="七、付费与退款">
          <List>
            <li>付费会员费用按照购买时展示的价格收取</li>
            <li>除非法律另有规定，已支付的会员费用不予退还</li>
            <li>我们保留调整会员价格的权利，价格调整将提前通知，不影响当前计费周期</li>
          </List>
        </Section>

        <Section title="八、协议变更">
          <p>我们可能不时更新本协议。重大变更将通过应用内通知或邮件告知。变更后继续使用服务即表示您接受修改后的协议。</p>
        </Section>

        <Section title="九、终止">
          <List>
            <li>您可随时通过 Clerk 账户管理功能删除账户来终止使用本服务</li>
            <li>终止后，您的个人数据将按照隐私政策处理</li>
            <li>本协议中按其性质应在终止后继续有效的条款（如免责声明、责任限制）在终止后仍然有效</li>
          </List>
        </Section>

        <Section title="十、适用法律">
          <p>本协议受中华人民共和国法律管辖。因本协议产生的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院处理。</p>
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
