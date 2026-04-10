import { useEffect, useRef } from 'react'
import styles from './TimerRing.module.css'

export function TimerRing({ seconds, total, onComplete }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, seconds / total)
  const offset = circ * (1 - pct)
  const urgent = seconds <= 5

  const prevRef = useRef(seconds)
  useEffect(() => {
    if (prevRef.current > 0 && seconds === 0 && onComplete) onComplete()
    prevRef.current = seconds
  }, [seconds, onComplete])

  return (
    <div className={styles.ring}>
      <svg className={styles.svg} width="120" height="120" viewBox="0 0 120 120">
        <circle className={styles.track} cx="60" cy="60" r={r} />
        <circle
          className={`${styles.fill} ${urgent ? styles.urgent : ''}`}
          cx="60" cy="60" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`${styles.number} ${urgent ? styles.urgentText : ''}`}>
        {seconds}
      </div>
    </div>
  )
}
