import { useNavigate } from 'react-router-dom'

export default function DisclaimerPage() {
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
        免责声明
      </h1>

      <div style={{ padding: '16px 0', fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>

        <Section title="一、价格信息">
          <List>
            <li>本服务展示的商品价格来源于各品牌官网及授权零售商的公开页面，通过自动化方式采集和更新。</li>
            <li>价格信息可能存在延迟——实际价格以来源网站当时显示的价格为准。</li>
            <li>我们不保证价格的实时性、准确性和完整性。在下单购买前，请务必在来源网站核实最终价格。</li>
            <li>价格不含运费、关税及其他可能产生的费用，除非明确标注。</li>
            <li>部分商品可能存在标价错误（如价格异常低或异常高），这通常是来源网站的数据问题，我们不对其准确性承担责任。</li>
          </List>
        </Section>

        <Section title="二、汇率信息">
          <List>
            <li>汇率数据来源于 Frankfurter API（欧洲央行参考汇率），每日更新。</li>
            <li>显示的人民币折算价基于参考汇率计算，仅供参考。</li>
            <li>实际交易汇率可能因支付渠道、银行、交易时间等因素而有所不同。</li>
            <li>我们不保证折算金额与实际支付金额完全一致。</li>
          </List>
        </Section>

        <Section title="三、成本估算">
          <List>
            <li>成本计算器提供的"建议售价"仅基于您输入的参数和预设公式进行数学计算。</li>
            <li>计算结果不构成定价建议、投资建议或商业决策依据。</li>
            <li>实际跨境购物成本受汇率波动、实际运费、关税政策、支付手续费等多种因素影响。</li>
            <li>您应基于自身情况独立评估成本，并咨询相关专业人士。</li>
          </List>
        </Section>

        <Section title="四、商品信息">
          <List>
            <li>商品名称、图片、品牌归属、分类、规格等信息来自数据采集源。</li>
            <li>我们不对商品信息的准确性、完整性或合法性作任何明示或默示的保证。</li>
            <li>商品图片可能存在色差或与实际商品不一致的情况。</li>
            <li>品牌名称和商标归各自权利人所有，本服务不主张任何商标权利。</li>
          </List>
        </Section>

        <Section title="五、外部链接">
          <List>
            <li>本服务提供指向第三方网站（品牌官网、零售商网站等）的链接。</li>
            <li>我们对第三方网站的内容、隐私政策和商业行为不承担任何责任。</li>
            <li>点击外部链接前，请自行评估相关风险并阅读目标网站的条款和政策。</li>
          </List>
        </Section>

        <Section title="六、服务可用性">
          <List>
            <li>我们努力保持服务的稳定运行，但不保证服务不会中断或无错误。</li>
            <li>服务可能因维护、升级、技术故障或不可抗力等原因暂时不可用。</li>
            <li>我们不对因服务中断导致的数据丢失或使用不便承担责任。</li>
          </List>
        </Section>

        <Section title="七、非专业建议">
          <p>本服务提供的所有信息（包括价格对比、成本估算、汇率换算）均为技术工具的输出结果，不构成任何形式的专业建议，包括但不限于：</p>
          <List>
            <li>财务或投资建议</li>
            <li>购物或消费建议</li>
            <li>税务或法律建议</li>
          </List>
          <p>如需专业意见，请咨询具备相关资质的专业人士。</p>
        </Section>

        <Section title="八、赔偿">
          <p>您同意在使用本服务时，对于因您违反本免责声明或用户服务协议而导致的任何第三方索赔、损害或费用，您将赔偿并使比比喵及其运营者免受损害。</p>
        </Section>

        <div style={{ marginTop: '24px', padding: '12px', background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            使用比比喵即表示您已阅读、理解并同意本免责声明的全部内容。如不同意，请停止使用本服务。
          </p>
        </div>
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
