import { useState, useEffect } from 'react'
import { Screen, Logo, Input, Button, Divider, ErrorMsg } from '../components/UI'
import styles from './HomeScreen.module.css'

export function HomeScreen({ onCreate, onJoin, onPassAndPlay, loading, error, defaultCode = '' }) {
  const [name, setName]       = useState(() => localStorage.getItem('empire_player_name') || '')
  const [joinCode, setJoinCode] = useState(defaultCode)
  const [rounds, setRounds]   = useState(10)

  // If URL had ?room= pre-fill the code
  useEffect(() => { if (defaultCode) setJoinCode(defaultCode) }, [defaultCode])

  return (
    <Screen>
      <Logo />

      <div className={styles.wrap}>
        <Input
          value={name}
          onChange={setName}
          placeholder="Your Name"
          maxLength={20}
        />

        <ErrorMsg msg={error} />

        {/* Rounds picker */}
        <div className={styles.roundPicker}>
          <span className={styles.pickerLabel}>Rounds</span>
          {[5, 10, 20].map(n => (
            <button
              key={n}
              className={`${styles.roundBtn} ${rounds === n ? styles.active : ''}`}
              onClick={() => setRounds(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <Button onClick={() => onCreate(name, rounds)} disabled={loading}>
          {loading ? 'Creating…' : '✦ Create Room'}
        </Button>

        <Divider label="or join" />

        <Input
          value={joinCode}
          onChange={v => setJoinCode(v.toUpperCase())}
          placeholder="Room Code"
          maxLength={6}
          style={{ letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase', fontSize: 22 }}
          onKeyDown={e => e.key === 'Enter' && onJoin(name, joinCode)}
        />

        <Button variant="ghost" onClick={() => onJoin(name, joinCode)} disabled={loading}>
          {loading ? 'Joining…' : 'Join Room'}
        </Button>

        <Divider label="or" />

        <Button variant="blue" onClick={() => onPassAndPlay(name)}>
          📱 Pass &amp; Play (1 Device)
        </Button>

        <p className={styles.hint}>
          Pass &amp; Play: one phone, everyone takes turns seeing their role
        </p>
      </div>
    </Screen>
  )
}
