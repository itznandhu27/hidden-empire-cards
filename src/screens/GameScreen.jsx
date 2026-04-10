import { useState, useEffect, useRef } from 'react'
import { Screen, Logo, Button, SectionTitle, Tag, WaitingPulse } from '../components/UI'
import { RoleCard } from '../components/RoleCard'
import { TimerRing } from '../components/TimerRing'
import { Confetti } from '../components/Confetti'
import { Scoreboard, RoleRevealList, SpecialTitles } from '../components/Scoreboard'
import { PHASES, computeSpecialTitles } from '../lib/gameLogic'
import styles from './GameScreen.module.css'

// ─────────────────────────────────────────────────────────────────────────────
export function GameScreen({ room, myId, myRole, isHost, onAdvance, onPoliceGuess, onNextRound, onPlayAgain }) {
  if (!room) return null
  const phase = room.phase

  switch (phase) {
    case PHASES.ROLE_REVEAL:   return <PhaseRoleReveal room={room} myId={myId} myRole={myRole} isHost={isHost} onAdvance={onAdvance} />
    case PHASES.PHONE_DOWN:    return <PhasePhoneDown  room={room} isHost={isHost} onAdvance={onAdvance} />
    case PHASES.POLICE_SELECT: return <PhasePoliceSelect room={room} myId={myId} myRole={myRole} onPoliceGuess={onPoliceGuess} />
    case PHASES.RESULT:        return <PhaseResult room={room} isHost={isHost} onAdvance={onAdvance} />
    case PHASES.SCOREBOARD:    return <PhaseScoreboard room={room} isHost={isHost} onNextRound={onNextRound} />
    case PHASES.GAME_OVER:     return <PhaseGameOver room={room} onPlayAgain={onPlayAgain} />
    default:                   return null
  }
}

// ── 1. ROLE REVEAL ───────────────────────────────────────────────────────────
function PhaseRoleReveal({ room, myId, myRole, isHost, onAdvance }) {
  const amPolice = myRole === 'police'
  const amThief  = myRole === 'thief'

  return (
    <Screen>
      <Logo compact />
      <div className={styles.wrap}>
        <div className={styles.tagRow}>
          <Tag>Round {room.round} of {room.total_rounds}</Tag>
        </div>
        <h2 className={styles.bigText}>Your Role</h2>
        <p className={styles.subText}>Tap the card to reveal. Keep it secret!</p>
        <RoleCard roleId={myRole} />
        <p className={styles.roleHint}>
          {amPolice && '🚔 Your mission: find the Thief during discussion'}
          {amThief  && '🗡️ Your mission: blend in and escape the Police'}
          {!amPolice && !amThief && '🏆 Earn your role points. Watch the Thief!'}
        </p>
        {isHost ? (
          <Button onClick={() => onAdvance(PHASES.PHONE_DOWN)} style={{ marginTop: 24 }}>
            All Ready → Begin Discussion
          </Button>
        ) : (
          <WaitingPulse>Waiting for host to continue…</WaitingPulse>
        )}
      </div>
    </Screen>
  )
}

// ── 2. PHONE DOWN ─────────────────────────────────────────────────────────────
function PhasePhoneDown({ room, isHost, onAdvance }) {
  const TOTAL = 20
  const [secs, setSecs] = useState(TOTAL)
  const ref = useRef(null)

  useEffect(() => {
    setSecs(TOTAL)
    ref.current = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(ref.current)
  }, [])

  // Vibrate at 5s and 0s
  useEffect(() => {
    if ((secs === 5 || secs === 0) && navigator.vibrate) navigator.vibrate(200)
  }, [secs])

  return (
    <Screen center>
      <div className={styles.phoneDownWrap}>
        <div className={styles.phoneIcon}>📱</div>
        <h2 className={styles.bigText} style={{ marginTop: 24 }}>Put Your Phone Down!</h2>
        <p className={styles.subText}>Discuss, bluff &amp; accuse in real life</p>
        <TimerRing seconds={secs} total={TOTAL} />
        {isHost && (
          <>
            {secs === 0 && (
              <Button onClick={() => onAdvance(PHASES.POLICE_SELECT)} style={{ maxWidth: 320, width: '100%' }}>
                Time's Up → Police Decides
              </Button>
            )}
            {secs > 0 && (
              <Button variant="ghost" onClick={() => onAdvance(PHASES.POLICE_SELECT)} style={{ maxWidth: 320, width: '100%' }}>
                Skip Timer
              </Button>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}

// ── 3. POLICE SELECT ──────────────────────────────────────────────────────────
function PhasePoliceSelect({ room, myId, myRole, onPoliceGuess }) {
  const [selected, setSelected] = useState(null)
  const isPolice = myRole === 'police'
  const others   = room.players.filter(p => p.id !== myId)

  if (!isPolice) {
    return (
      <Screen center>
        <div className={styles.centeredMsg}>
          <div className={styles.bigEmoji}>🚔</div>
          <h2 className={styles.bigText}>Police Is Deciding…</h2>
          <WaitingPulse>Stay silent. Watch their face.</WaitingPulse>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className={styles.wrap}>
        <div className={styles.bigEmoji} style={{ margin: '0 auto 12px' }}>🚔</div>
        <h2 className={styles.bigText}>Who Is the Thief?</h2>
        <p className={styles.subText}>You are the Police. Choose carefully.</p>
        <div className={styles.playerGrid}>
          {others.map(p => (
            <button
              key={p.id}
              className={`${styles.playerBtn} ${selected === p.id ? styles.selectedBtn : ''}`}
              onClick={() => setSelected(p.id)}
            >
              <span className={styles.playerInitial}>{p.name.charAt(0).toUpperCase()}</span>
              <span className={styles.playerName}>{p.name}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => onPoliceGuess(selected)} disabled={!selected} style={{ marginTop: 8 }}>
          🔒 Accuse This Player
        </Button>
      </div>
    </Screen>
  )
}

// ── 4. RESULT ─────────────────────────────────────────────────────────────────
function PhaseResult({ room, isHost, onAdvance }) {
  const caught = room.thief_caught
  const thief  = room.players.find(p => p.role === 'thief')
  const police = room.players.find(p => p.role === 'police')

  return (
    <Screen>
      <div className={styles.wrap}>
        <div className={styles.resultEmoji}>{caught ? '🔒' : '🏃'}</div>
        <div className={`${styles.resultBadge} ${caught ? styles.caught : styles.escaped}`}>
          {caught ? 'THIEF CAUGHT!' : 'THIEF ESCAPED!'}
        </div>
        <p className={styles.resultSub}>
          {caught
            ? `${police?.name} arrested ${thief?.name}!`
            : `${thief?.name} fooled everyone!`}
        </p>

        <SectionTitle>Roles Revealed</SectionTitle>
        <RoleRevealList players={room.players} lastDeltas={room.last_deltas} />

        {isHost ? (
          <Button onClick={() => onAdvance(PHASES.SCOREBOARD)} style={{ marginTop: 16 }}>
            View Scores →
          </Button>
        ) : (
          <WaitingPulse style={{ marginTop: 16 }}>Waiting for host…</WaitingPulse>
        )}
      </div>
    </Screen>
  )
}

// ── 5. SCOREBOARD ─────────────────────────────────────────────────────────────
function PhaseScoreboard({ room, isHost, onNextRound }) {
  const isLastRound = room.round >= room.total_rounds
  return (
    <Screen>
      <div className={styles.wrap}>
        <div className={styles.tagRow}>
          <Tag>After Round {room.round} of {room.total_rounds}</Tag>
        </div>
        <SectionTitle>Leaderboard</SectionTitle>
        <Scoreboard players={room.players} scores={room.scores} lastDeltas={room.last_deltas} />
        {isHost ? (
          <Button onClick={onNextRound} style={{ marginTop: 16 }}>
            {isLastRound ? 'Final Results →' : `Round ${room.round + 1} →`}
          </Button>
        ) : (
          <WaitingPulse style={{ marginTop: 16 }}>Waiting for host…</WaitingPulse>
        )}
      </div>
    </Screen>
  )
}

// ── 6. GAME OVER ──────────────────────────────────────────────────────────────
function PhaseGameOver({ room, onPlayAgain }) {
  const sorted  = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
  const winner  = sorted[0]
  const isTie   = sorted.length > 1 && room.scores[sorted[0].id] === room.scores[sorted[1].id]
  const titles  = computeSpecialTitles(room.players, room.scores, room.stats || {})

  return (
    <Screen>
      <Confetti />
      <div className={styles.wrap}>
        <div className={styles.winnerCrown}>👑</div>
        {isTie ? (
          <>
            <div className={styles.winnerName}>It's a Tie!</div>
            <div className={styles.winnerTitle}>Dual Champions of the Empire</div>
          </>
        ) : (
          <>
            <div className={styles.winnerName}>{winner?.name}</div>
            <div className={styles.winnerTitle}>Empire Champion · {room.scores[winner?.id] || 0} pts</div>
          </>
        )}

        <SectionTitle>Final Standings</SectionTitle>
        <Scoreboard players={room.players} scores={room.scores} />

        {titles.length > 0 && (
          <>
            <SectionTitle>Special Honours</SectionTitle>
            <SpecialTitles titles={titles} />
          </>
        )}

        <Button onClick={onPlayAgain} style={{ marginTop: 24 }}>
          🔄 Play Again (Same Players)
        </Button>
      </div>
    </Screen>
  )
}
