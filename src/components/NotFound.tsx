import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ fontSize: '72px', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '16px' }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '24px' }}>The page you're looking for doesn't exist</p>
      <Link
        to="/"
        style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', padding: '8px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none', border: 'none', cursor: 'pointer' }}
      >
        Back to Home
      </Link>
    </div>
  )
}
