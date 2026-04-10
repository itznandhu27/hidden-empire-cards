import styles from './UI.module.css'

export function Screen({ children, center = false }) {
  return (
    <div className={`${styles.screen} ${center ? styles.center : ''}`}>
      {children}
    </div>
  )
}

export function Logo({ compact = false }) {
  return (
    <div className={styles.logo}>
      {!compact && <div className={styles.ornament}>✦ ✦ ✦</div>}
      <div className={styles.logoDivider} />
      <div className={styles.logoTitle}>Hidden Empire</div>
      <div className={styles.logoTitle} style={{ fontSize: compact ? 18 : undefined }}>Cards</div>
      <div className={styles.logoDivider} />
      {!compact && <div className={styles.logoSub}>A Social Bluffing Game</div>}
    </div>
  )
}

export function Panel({ children, title }) {
  return (
    <div className={styles.panel}>
      {title && <div className={styles.panelTitle}>{title}</div>}
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, maxLength, style, onKeyDown }) {
  return (
    <input
      className={styles.input}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={style}
      onKeyDown={onKeyDown}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
    />
  )
}

export function Button({ children, onClick, variant = 'gold', disabled, style, fullWidth = true }) {
  const cls = [
    styles.btn,
    styles[`btn_${variant}`],
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ')
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

export function SectionTitle({ children }) {
  return <div className={styles.sectionTitle}>{children}</div>
}

export function Tag({ children }) {
  return <span className={styles.tag}>{children}</span>
}

export function ErrorMsg({ msg }) {
  if (!msg) return null
  return <div className={styles.errorMsg}>{msg}</div>
}

export function WaitingPulse({ children, style }) {
  return <div className={styles.waitingPulse} style={style}>{children}</div>
}

export function Divider({ label }) {
  return (
    <div className={styles.divider}>
      <span className={styles.dividerLine} />
      {label && <span className={styles.dividerLabel}>{label}</span>}
      {label && <span className={styles.dividerLine} />}
    </div>
  )
}

export function RoomCodeDisplay({ code }) {
  return <div className={styles.roomCode}>{code}</div>
}

export function ProgressBar({ value, max }) {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}
