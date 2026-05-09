import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  const [isOn, setIsOn] = useState(false)
  const [hue, setHue] = useState(40)

  function handlePull(_: any, info: { offset: { y: number } }) {
    if (Math.abs(info.offset.y) > 40) {
      const newOn = !isOn
      setIsOn(newOn)
      if (newOn) {
        setHue(Math.random() * 360)
        new Audio('/audio/click.mp3').play().catch(() => {})
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ '--lamp-hue': hue, '--on': isOn ? '1' : '0' } as React.CSSProperties}>
        <svg viewBox="0 0 200 260" style={{ width: '160px', height: 'auto', margin: '0 auto 32px' }}>
          <ellipse cx="100" cy="250" rx="44" ry="10" fill="#2A2B26" />
          <line x1="100" y1="250" x2="100" y2="170" stroke="#5C5D55" strokeWidth="4" strokeLinecap="round" />
          <motion.path
            d="M50 170 L150 170 L130 110 L70 110 Z"
            fill={isOn ? `hsl(${hue}, 70%, 60%)` : '#3a3a34'}
            animate={{ fill: isOn ? `hsl(${hue}, 70%, 60%)` : '#3a3a34' }}
          />
          <motion.circle cx="85" cy="145" r="5" fill="#141413"
            animate={{ r: isOn ? 5 : 3 }} />
          <motion.circle cx="115" cy="145" r="5" fill="#141413"
            animate={{ r: isOn ? 5 : 3 }} />
          <motion.line
            x1="100" y1="170" x2="100" y2="210"
            stroke="#6a6a60" strokeWidth="2"
            drag="y"
            dragConstraints={{ top: -10, bottom: 50 }}
            dragElastic={0.1}
            onDragEnd={handlePull}
            style={{ cursor: 'grab' }}
            animate={{ y2: isOn ? 180 : 210 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
          {isOn && (
            <motion.circle cx="100" cy="110" r="60" fill={`hsl(${hue}, 70%, 60%)`} opacity="0.15"
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} />
          )}
        </svg>

        <AnimatePresence>
          {isOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              style={{ width: '100%', maxWidth: '384px', margin: '0 auto' }}
            >
              <div style={{
                background: 'var(--bg-primary)',
                border: 'var(--border-width) solid var(--border-default)',
                padding: '24px',
              }}>
                <SignIn />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '32px' }}>Pull cord to toggle light → Sign In</p>
    </div>
  )
}
