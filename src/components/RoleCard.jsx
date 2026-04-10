import { useState } from 'react'
import { ROLES } from '../lib/gameLogic'
import styles from './RoleCard.module.css'

export function RoleCard({ roleId, autoFlip = false }) {
  const [flipped, setFlipped] = useState(autoFlip)
  const info = ROLES.find(r => r.id === roleId)

  return (
    <div className={styles.container} onClick={() => setFlipped(f => !f)}>
      <div className={`${styles.inner} ${flipped ? styles.flipped : ''}`}>
        {/* Back */}
        <div className={styles.face + ' ' + styles.back}>
          <div className={styles.backSymbol}>🂠</div>
          <div className={styles.backLabel}>YOUR ROLE</div>
          <div className={styles.backHint}>TAP TO REVEAL</div>
        </div>
        {/* Front */}
        <div className={styles.face + ' ' + styles.front} style={{ borderColor: (info?.color || '#C9A84C') + '66' }}>
          <div className={styles.emoji} style={{ filter: `drop-shadow(0 0 16px ${info?.color}88)` }}>
            {info?.emoji}
          </div>
          <div className={styles.label} style={{ color: info?.color }}>{info?.label}</div>
          {info?.special
            ? <div className={styles.points} style={{ color: 'var(--text-dim)' }}>SPECIAL ROLE</div>
            : <div className={styles.points}>{info?.points} PTS</div>
          }
          <div className={styles.hint}>tap to hide</div>
        </div>
      </div>
    </div>
  )
}
