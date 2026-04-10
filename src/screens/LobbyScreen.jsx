import { useState } from 'react'
import { Screen, Logo, RoomCodeDisplay, Panel, Button, SectionTitle, ErrorMsg, WaitingPulse, ProgressBar } from '../components/UI'
import { PlayerList } from '../components/PlayerList'
import { MIN_PLAYERS, MAX_PLAYERS } from '../lib/gameLogic'
import styles from './LobbyScreen.module.css'

export function LobbyScreen({ room, myId, isHost, roomCode, onStart, onShare, error }) {
  const players = room?.players || []
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const result = await onShare()
    if (result === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <Screen>
      <Logo compact />

      <div className={styles.wrap}>
        <SectionTitle>Room Code</SectionTitle>
        <RoomCodeDisplay code={roomCode} />

        <div className={styles.shareRow}>
          <Button variant="ghost" onClick={handleShare} fullWidth={false} style={{ flex: 1, marginBottom: 0 }}>
            {copied ? '✓ Link Copied!' : '🔗 Share Invite Link'}
          </Button>
        </div>

        <Panel title={`Players (${players.length}/${MAX_PLAYERS})`}>
          <ProgressBar value={players.length} max={MAX_PLAYERS} />
          <PlayerList players={players} myId={myId} />
          {players.length < MIN_PLAYERS && (
            <WaitingPulse>Waiting… need {MIN_PLAYERS - players.length} more player{MIN_PLAYERS - players.length > 1 ? 's' : ''}</WaitingPulse>
          )}
        </Panel>

        <ErrorMsg msg={error} />

        {isHost ? (
          <Button
            onClick={onStart}
            disabled={players.length < MIN_PLAYERS}
            style={{ marginTop: 16 }}
          >
            ⚔️ Start Game ({room?.total_rounds} Rounds)
          </Button>
        ) : (
          <WaitingPulse style={{ marginTop: 20 }}>Waiting for host to start…</WaitingPulse>
        )}
      </div>
    </Screen>
  )
}
