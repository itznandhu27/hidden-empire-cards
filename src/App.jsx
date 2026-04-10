import { useState, useEffect } from 'react'
import { useRoom } from './hooks/useRoom'
import { usePassAndPlay } from './hooks/usePassAndPlay'
import { HomeScreen } from './screens/HomeScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { PassAndPlayScreen } from './screens/PassAndPlayScreen'
import { PHASES } from './lib/gameLogic'

export default function App() {
  const [mode, setMode] = useState('online') // 'online' | 'pass_and_play'

  // Read ?room= from URL on mount
  const [urlRoomCode] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return p.get('room')?.toUpperCase() || ''
  })

  const room = useRoom()
  const pp   = usePassAndPlay()

  // Auto-rejoin if session has a room code stored
  useEffect(() => {
    const saved = sessionStorage.getItem('empire_room_code')
    if (saved && room.screen === 'home') {
      room.rejoinRoom(saved)
    }
  }, [])

  // Persist room code to session so refresh works
  useEffect(() => {
    if (room.roomCode) sessionStorage.setItem('empire_room_code', room.roomCode)
  }, [room.roomCode])

  // When DB updates push a new phase, make sure we're on game screen
  useEffect(() => {
    if (room.room && room.room.phase !== PHASES.LOBBY && room.screen === 'lobby') {
      room.setScreen('game')
    }
    if (room.room && room.room.phase === PHASES.LOBBY && room.screen === 'game') {
      room.setScreen('lobby')
    }
  }, [room.room?.phase])

  // ── Pass & Play mode ──────────────────────────────────────────────────────
  if (mode === 'pass_and_play') {
    return (
      <PassAndPlayScreen
        pp={pp}
        onExit={() => setMode('online')}
      />
    )
  }

  // ── Online mode ───────────────────────────────────────────────────────────
  if (room.screen === 'home') {
    return (
      <HomeScreen
        defaultCode={urlRoomCode}
        loading={room.loading}
        error={room.error}
        onCreate={(name, rounds) => room.createRoom(name, rounds)}
        onJoin={(name, code) => room.joinRoom(name, code)}
        onPassAndPlay={(name) => {
          if (name) localStorage.setItem('empire_player_name', name)
          setMode('pass_and_play')
        }}
      />
    )
  }

  if (room.screen === 'lobby') {
    return (
      <LobbyScreen
        room={room.room}
        myId={room.myId}
        isHost={room.isHost}
        roomCode={room.roomCode}
        error={room.error}
        onStart={room.startGame}
        onShare={room.shareRoom}
      />
    )
  }

  if (room.screen === 'game') {
    return (
      <GameScreen
        room={room.room}
        myId={room.myId}
        myRole={room.myRole}
        isHost={room.isHost}
        onAdvance={(phase, extra) => room.advancePhase(phase, extra)}
        onPoliceGuess={(id) => room.submitPoliceGuess(id)}
        onNextRound={room.nextRound}
        onPlayAgain={room.playAgain}
      />
    )
  }

  return null
}
