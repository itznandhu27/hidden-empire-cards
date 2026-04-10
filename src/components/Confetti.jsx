import { useMemo } from 'react'
import styles from './Confetti.module.css'

export function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
      color: ['#FFD700','#C9A84C','#E879F9','#60A5FA','#34D399','#F87171','#FB923C'][Math.floor(Math.random()*7)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }))
  , [])

  return (
    <div className={styles.container} aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className={styles.piece} style={{
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.shape,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        }} />
      ))}
    </div>
  )
}
