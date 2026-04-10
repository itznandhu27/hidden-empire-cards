import { useState, useEffect } from 'react'
import { Screen, Logo, Input, Button, SectionTitle, ErrorMsg, Tag } from '../components/UI'
import { TimerRing } from '../components/TimerRing'
import { Confetti } from '../components/Confetti'
import { Scoreboard, RoleRevealList, SpecialTitles } from '../components/Scoreboard'
import { ROLES } from '../lib/gameLogic'
import styles from './PassAndPlayScreen.module.css'

export function PassAndPlayScreen({ pp, onExit }) {
  const {
    ppScreen, players, nameInput, setNameInput, addPlayer, removePlayer,
    totalRounds, setTotalRounds, round,
    currentRevealIdx, showRole, roundPlayers, policePlayer,
    scores, lastDeltas, thiefCaught, sortedScores,
    titles, error,
    startPP, showCurrentRole, nextReveal, goToPolice, submitGuess,
    goToScoreboard, nextRound, playAgain, reset,
  } = pp

  switch (ppScreen) {
    case 'setup':
      return <PPSetup {...{ players, nameInput, setNameInput, addPlayer, removePlayer, totalRounds, setTotalRounds, error, startPP, onExit }} />
    case 'reveal':
      return <PPReveal {...{ currentRevealIdx, roundPlayers, showRole, showCurrentRole, nextReveal, round, totalRounds }} />
    case 'pass':
      return <PPPass currentRevealIdx={currentRevealIdx} roundPlayers={roundPlayers} onReady={nextReveal} />
    case 'phone_down':
      return <PPPhoneDown goToPolice={goToPolice} />
    case 'police':
      return <PPPolice policePlayer={policePlayer} roundPlayers={roundPlayers} submitGuess={submitGuess} />
    case 'result':
      return <PPResult roundPlayers={roundPlayers} thiefCaught={thiefCaught} lastDeltas={lastDeltas} goToScoreboard={goToScoreboard} />
    case 'scoreboard':
      return <PPScoreboard players={players} scores={scores} lastDeltas={lastDeltas} round={round} totalRounds={totalRounds} nextRound={nextRound} />
    case 'game_over':
      return <PPGameOver sortedScores={sortedScores} scores={scores} titles={titles} players={players} playAgain={playAgain} onExit={() => { reset(); onExit() }} />
    default:
      return null
  }
}

function PPSetup({ players, nameInput, setNameInput, addPlayer, removePlayer, totalRounds, setTotalRounds, error, startPP, onExit }) {
  return (
    <Screen>
      <Logo compact />
      <div className={styles.wrap}>
        <div className={styles.modeTag}>📱 Pass &amp; Play Mode</div>
        <SectionTitle>Add Players (3–10)</SectionTitle>
        <div className={styles.addRow}>
          <Input
            value={nameInput}
            onChange={setNameInput}
            placeholder="Player name…"
            maxLength={20}
            style={{ marginBottom: 0, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && addPlayer(nameInput)}
          />
          <button className={styles.addBtn} onClick={() => addPlayer(nameInput)}>+</button>
        </div>
        <ErrorMsg msg={error} />
        <div className={styles.playerList}>
          {players.map((p, i) => (
            <div key={p.id} className={styles.playerRow} style={{ animationDelay: `${i * 0.05}s` }}>
              <span className={styles.playerDot}>{i + 1}</span>
              <span className={styles.playerName}>{p.name}</span>
              <button className={styles.removeBtn} onClick={() => removePlayer(p.id)}>✕</button>
            </div>
          ))}
        </div>
        <SectionTitle>Rounds</SectionTitle>
        <div className={styles.roundPicker}>
          {[5, 10, 20].map(n => (
            <button key={n} className={`${styles.roundBtn} ${totalRounds === n ? styles.active : ''}`} onClick={() => setTotalRounds(n)}>{n}</button>
          ))}
        </div>
        <Button onClick={startPP} disabled={players.length < 3} style={{ marginTop: 16 }}>⚔️ Start Game</Button>
        <Button variant="ghost" onClick={onExit}>← Back to Menu</Button>
      </div>
    </Screen>
  )
}

function PPReveal({ currentRevealIdx, roundPlayers, showRole, showCurrentRole, nextReveal, round, totalRounds }) {
  const current    = roundPlayers[currentRevealIdx]
  const roleInfo   = ROLES.find(r => r.id === current?.role)
  const isLast     = currentRevealIdx === roundPlayers.length - 1
  const nextPlayer = roundPlayers[currentRevealIdx + 1]

  return (
    <Screen center>
      <div className={styles.revealWrap}>
        <div className={styles.tagRow}><Tag>Round {round} of {totalRounds}</Tag></div>
        <h2 className={styles.bigText}>{current?.name}, look at your role!</h2>
        <p className={styles.subText}>Hide the screen from everyone else</p>

        {!showRole ? (
          <button className={styles.tapCard} onClick={showCurrentRole}>
            <div className={styles.tapCardInner}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🂠</div>
              <div className={styles.tapLabel}>TAP TO REVEAL</div>
            </div>
          </button>
        ) : (
          <div className={styles.roleRevealCard} style={{ borderColor: (roleInfo?.color || '#C9A84C') + '66' }}>
            <div style={{ fontSize: 72, marginBottom: 12, filter: `drop-shadow(0 0 16px ${roleInfo?.color}88)` }}>{roleInfo?.emoji}</div>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 700, color: roleInfo?.color, marginBottom: 8 }}>{roleInfo?.label}</div>
            {roleInfo?.special
              ? <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 3, color: 'var(--text-dim)' }}>SPECIAL ROLE</div>
              : <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 3, color: 'var(--gold)' }}>{roleInfo?.points} PTS</div>
            }
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4 }}>
              {current?.role === 'police' && 'Find the Thief during discussion'}
              {current?.role === 'thief'  && 'Blend in. Do not get caught.'}
              {current?.role !== 'police' && current?.role !== 'thief' && 'Earn your role points. Survive the round!'}
            </div>
          </div>
        )}

        {showRole && (
          <Button onClick={nextReveal} style={{ marginTop: 24, maxWidth: 340, width: '100%' }}>
            {isLast ? '✓ All Done → Start Discussion!' : `Pass to ${nextPlayer?.name} →`}
          </Button>
        )}
      </div>
    </Screen>
  )
}

function PPPass({ currentRevealIdx, roundPlayers, onReady }) {
  const next = roundPlayers[currentRevealIdx]
  return (
    <Screen center>
      <div className={styles.passWrap}>
        <div style={{ fontSize: 64 }}>📱</div>
        <h2 className={styles.bigText} style={{ marginTop: 20 }}>Pass to {next?.name}</h2>
        <p className={styles.subText}>Make sure nobody else is looking at the screen!</p>
        <Button onClick={onReady} style={{ marginTop: 24, maxWidth: 300, width: '100%' }}>I&apos;m Ready →</Button>
      </div>
    </Screen>
  )
}

function PPPhoneDown({ goToPolice }) {
  const TOTAL = 20
  const [secs, setSecs] = useState(TOTAL)

  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (secs === 5 && navigator.vibrate) navigator.vibrate(200)
    if (secs === 0 && navigator.vibrate) navigator.vibrate([200, 100, 200])
  }, [secs])

  return (
    <Screen center>
      <div className={styles.passWrap}>
        <div style={{ fontSize: 64 }}>🗣️</div>
        <h2 className={styles.bigText} style={{ marginTop: 20 }}>Discuss!</h2>
        <p className={styles.subText}>Phones down. Bluff, argue, accuse in real life.</p>
        <TimerRing seconds={secs} total={TOTAL} />
        <Button onClick={goToPolice} style={{ maxWidth: 320, width: '100%' }}>
          {secs === 0 ? "⏰ Time's Up → Police Decides" : 'Skip Timer → Police Decides'}
        </Button>
      </div>
    </Screen>
  )
}

function PPPolice({ policePlayer, roundPlayers, submitGuess }) {
  const [selected, setSelected] = useState(null)
  const others = roundPlayers.filter(p => p.id !== policePlayer?.id)

  return (
    <Screen>
      <div className={styles.wrap}>
        <div style={{ textAlign: 'center', fontSize: 56, marginBottom: 4 }}>🚔</div>
        <h2 className={styles.bigText}>{policePlayer?.name} — You&apos;re the Police!</h2>
        <p className={styles.subText}>Pass the phone to {policePlayer?.name}. Who is the Thief?</p>
        <div className={styles.playerGrid}>
          {others.map(p => (
            <button key={p.id} className={`${styles.playerBtn} ${selected === p.id ? styles.selectedBtn : ''}`} onClick={() => setSelected(p.id)}>
              <span className={styles.playerInitial}>{p.name.charAt(0).toUpperCase()}</span>
              <span className={styles.playerNameSm}>{p.name}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => submitGuess(selected)} disabled={!selected}>🔒 Accuse This Player</Button>
      </div>
    </Screen>
  )
}

function PPResult({ roundPlayers, thiefCaught, lastDeltas, goToScoreboard }) {
  const thief  = roundPlayers.find(p => p.role === 'thief')
  const police = roundPlayers.find(p => p.role === 'police')

  return (
    <Screen>
      <div className={styles.wrap}>
        <div style={{ fontSize: 72, textAlign: 'center', animation: 'pop 0.5s ease' }}>{thiefCaught ? '🔒' : '🏃'}</div>
        <div className={`${styles.resultBadge} ${thiefCaught ? styles.caught : styles.escaped}`}>
          {thiefCaught ? 'THIEF CAUGHT!' : 'THIEF ESCAPED!'}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 15, marginBottom: 16, fontStyle: 'italic' }}>
          {thiefCaught ? `${police?.name} arrested ${thief?.name}!` : `${thief?.name} fooled everyone!`}
        </p>
        <SectionTitle>Roles Revealed</SectionTitle>
        <RoleRevealList players={roundPlayers} lastDeltas={lastDeltas} />
        <Button onClick={goToScoreboard} style={{ marginTop: 16 }}>View Scores →</Button>
      </div>
    </Screen>
  )
}

function PPScoreboard({ players, scores, lastDeltas, round, totalRounds, nextRound }) {
  const isLast = round >= totalRounds
  return (
    <Screen>
      <div className={styles.wrap}>
        <div className={styles.tagRow}><Tag>After Round {round} of {totalRounds}</Tag></div>
        <SectionTitle>Leaderboard</SectionTitle>
        <Scoreboard players={players} scores={scores} lastDeltas={lastDeltas} />
        <Button onClick={nextRound} style={{ marginTop: 16 }}>
          {isLast ? '🏁 Final Results →' : `⚔️ Round ${round + 1} →`}
        </Button>
      </div>
    </Screen>
  )
}

function PPGameOver({ sortedScores, scores, titles, players, playAgain, onExit }) {
  const winner = sortedScores[0]
  const isTie  = sortedScores.length > 1 && scores[sortedScores[0]?.id] === scores[sortedScores[1]?.id]

  return (
    <Screen>
      <Confetti />
      <div className={styles.wrap}>
        <div className={styles.winnerCrown}>👑</div>
        {isTie ? (
          <><div className={styles.winnerName}>It&apos;s a Tie!</div><div className={styles.winnerSub}>Dual Champions</div></>
        ) : (
          <><div className={styles.winnerName}>{winner?.name}</div><div className={styles.winnerSub}>Empire Champion · {scores[winner?.id] || 0} pts</div></>
        )}
        <SectionTitle>Final Standings</SectionTitle>
        <Scoreboard players={players} scores={scores} />
        {titles.length > 0 && <><SectionTitle>Special Honours</SectionTitle><SpecialTitles titles={titles} /></>}
        <Button onClick={playAgain} style={{ marginTop: 20 }}>🔄 Play Again</Button>
        <Button variant="ghost" onClick={onExit}>Back to Menu</Button>
      </div>
    </Screen>
  )
}
