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
    <div className="min-h-screen bg-[#121110] flex flex-col items-center justify-center p-4">
      <div style={{ '--lamp-hue': hue, '--on': isOn ? '1' : '0' } as React.CSSProperties}>
        <svg viewBox="0 0 200 260" className="w-40 h-auto mx-auto mb-8">
          <ellipse cx="100" cy="250" rx="44" ry="10" fill="#2a2a24" />
          <line x1="100" y1="250" x2="100" y2="170" stroke="#4a4a42" strokeWidth="4" strokeLinecap="round" />
          <motion.path
            d="M50 170 L150 170 L130 110 L70 110 Z"
            fill={isOn ? `hsl(${hue}, 70%, 60%)` : '#3a3a34'}
            animate={{ fill: isOn ? `hsl(${hue}, 70%, 60%)` : '#3a3a34' }}
          />
          <motion.circle cx="85" cy="145" r="5" fill="#121110"
            animate={{ r: isOn ? 5 : 3 }} />
          <motion.circle cx="115" cy="145" r="5" fill="#121110"
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
              className="w-full max-w-sm mx-auto"
              style={{
                borderColor: `hsl(${hue}, 70%, 60%)`,
                boxShadow: `0 0 40px hsla(${hue}, 70%, 60%, 0.2)`,
              }}
            >
              <div className="bg-[#1a1a17] rounded-xl p-6 border" style={{ borderColor: 'inherit' }}>
                <SignIn />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[#8b8a7e] text-xs mt-8">下拉拉绳开灯 → 登录</p>
    </div>
  )
}
