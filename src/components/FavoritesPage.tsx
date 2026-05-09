import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { formatPrice } from '../lib/format'
import { useLoginModal } from './LoginModal'
import { useToast } from './Toast'
import { api, apiDelete } from '../lib/api-client'

export default function FavoritesPage() {
  const { isSignedIn } = useUser()
  const { openLogin } = useLoginModal()
  const nav = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  function loadFavorites() {
    api('/api/favorites').then(r => r.json()).then(d => { if (d.success) setItems(d.data.items) }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isSignedIn) { openLogin(); setLoading(false); return }
    loadFavorites()
  }, [isSignedIn])

  function removeFavorite(productId: number) {
    apiDelete('/api/favorites', { productId }).then(r => r.json()).then(d => {
      if (d.success) { setItems(prev => prev.filter(it => it.id !== productId)); toast('Removed', 'success') }
    }).catch(() => toast('Network error', 'error'))
  }

  if (!isSignedIn) return <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Please login</div>

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      <header style={{
        height: 'var(--header-height)', padding: '0 var(--page-padding)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: 'var(--border-width) solid var(--border-default)',
        marginLeft: 'calc(-1 * var(--page-padding))', marginRight: 'calc(-1 * var(--page-padding))',
      }}>
        <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BIBIMIAO比比喵</span>
        <span style={{ width: '18px', height: '18px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'var(--brand)', color: 'var(--text-inverse)', fontSize: '11px', fontWeight: 800 }}>05</span>
      </header>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 8vw, 32px)', lineHeight: '0.88', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', padding: '14px 0 10px', borderBottom: 'var(--border-width) solid var(--border-default)', margin: '0 calc(-1 * var(--page-padding))', marginBottom: '0' }}>
        Saved<br />Items
      </h1>

      {loading ? <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading...</div> :
       !items.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>No saved items</p>
          <p style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '16px' }}>Tap the heart icon while browsing</p>
          <button onClick={() => nav('/search')} style={{ background: 'var(--bg-active)', color: 'var(--text-inverse)', border: 'none', padding: '8px 24px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Go to Search</button>
        </div>
      ) : (
        <div>
          {items.map(item => (
            <div key={item.id}
              onClick={() => nav(`/product/${item.id}`)}
              style={{
                height: 'var(--row-height)', display: 'grid',
                gridTemplateColumns: 'var(--thumb-width) minmax(0, 1fr) auto',
                borderBottom: 'var(--border-width) solid var(--border-default)',
                cursor: 'pointer', background: 'var(--bg-primary)',
              }}>
              <img src={item.imageUrl || `https://placehold.co/72x92/B8B8AD/5C5D55?text=N/A`} alt="" loading="lazy"
                style={{ width: 'var(--thumb-width)', height: 'var(--row-height)', objectFit: 'cover', border: 'var(--border-width) solid var(--border-default)' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x92/B8B8AD/5C5D55?text=N/A' }} />
              <div style={{ minWidth: 0, padding: '12px 6px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '14px', lineHeight: '13px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)' }}>{item.brand}</span>
                  {item.price && <span style={{ fontSize: 'var(--fs-label)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{formatPrice(item.currency, item.price)}</span>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFavorite(item.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)', padding: '12px 8px', alignSelf: 'start' }}
                title="Remove">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
