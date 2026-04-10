import { ROLES } from '../lib/gameLogic'
import styles from './Scoreboard.module.css'

const RANK_ICONS = ['👑', '🥈', '🥉']

export function Scoreboard({ players, scores, lastDeltas = {} }) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))

  return (
    <div className={styles.list}>
      {sorted.map((p, i) => {
        const delta = lastDeltas[p.id]
        return (
          <div key={p.id} className={`${styles.item} ${i === 0 ? styles.first : ''}`}
            style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={`${styles.rank} ${i < 3 ? styles[`rank${i}`] : ''}`}>
              {RANK_ICONS[i] ?? `${i + 1}`}
            </div>
            <div className={styles.name}>{p.name}</div>
            {delta !== undefined && (
              <span className={`${styles.delta} ${delta >= 0 ? styles.pos : styles.neg}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            )}
            <div className={styles.score}>{scores[p.id] || 0}</div>
          </div>
        )
      })}
    </div>
  )
}

export function RoleRevealList({ players, lastDeltas = {} }) {
  return (
    <div className={styles.list}>
      {players.map((p, i) => {
        const roleInfo = ROLES.find(r => r.id === p.role)
        const delta = lastDeltas[p.id]
        return (
          <div key={p.id} className={styles.revealItem} style={{ animationDelay: `${i * 0.1}s` }}>
            <span className={styles.revealEmoji}>{roleInfo?.emoji}</span>
            <span className={styles.revealName}>{p.name}</span>
            <span className={styles.revealRole} style={{ color: roleInfo?.color }}>{roleInfo?.label}</span>
            {delta !== undefined && (
              <span className={`${styles.delta} ${delta >= 0 ? styles.pos : styles.neg}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SpecialTitles({ titles }) {
  if (!titles?.length) return null
  return (
    <div className={styles.titleList}>
      {titles.map((t, i) => (
        <div key={i} className={styles.titleBadge}>
          <span className={styles.titleEmoji}>{t.emoji}</span>
          <div className={styles.titleInfo}>
            <div className={styles.titleLabel}>{t.label}</div>
            <div className={styles.titlePlayer}>{t.player} · {t.stat}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
