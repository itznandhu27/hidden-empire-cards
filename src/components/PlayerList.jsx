import styles from './PlayerList.module.css'

export function PlayerList({ players, myId }) {
  return (
    <div className={styles.list}>
      {players.map((p, i) => (
        <div key={p.id} className={styles.item} style={{ animationDelay: `${i * 0.06}s` }}>
          <div className={styles.avatar}>{p.name.charAt(0).toUpperCase()}</div>
          <div className={styles.name}>{p.name}</div>
          <div className={styles.badges}>
            {p.isHost && <span className={styles.badge} style={{ color: 'var(--gold)', borderColor: 'var(--gold-dim)' }}>HOST</span>}
            {p.id === myId && <span className={styles.badge}>YOU</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
