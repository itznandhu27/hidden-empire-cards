import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  generateRoomCode, generatePlayerId, assignRoles,
  calculateScores, updateStats,
  PHASES, MIN_PLAYERS,
} from '../lib/gameLogic'

const PLAYER_ID_KEY = 'empire_player_id'
const PLAYER_NAME_KEY = 'empire_player_name'

function getOrCreatePlayerId() {
  let id = sessionStorage.getItem(PLAYER_ID_KEY)
  if (!id) { id = generatePlayerId(); sessionStorage.setItem(PLAYER_ID_KEY, id) }
  return id
}

export function useRoom() {
  const [screen, setScreen]       = useState('home')   // home | lobby | game
  const [room, setRoom]           = useState(null)      // full DB row
  const [myId]                    = useState(getOrCreatePlayerId)
  const [myName, setMyName]       = useState(() => localStorage.getItem(PLAYER_NAME_KEY) || '')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [roomCode, setRoomCode]   = useState('')

  const channelRef = useRef(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearError = () => setError('')

  const isHost = room?.host_id === myId

  const myPlayer = room?.players?.find(p => p.id === myId)

  const myRole = myPlayer?.role ?? null

  // ── Subscribe to a room ───────────────────────────────────────────────────

  const subscribe = useCallback((code) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    const ch = supabase
      .channel(`room-${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'empire_rooms', filter: `code=eq.${code}` },
        (payload) => {
          setRoom(payload.new)
        }
      )
      .subscribe()

    channelRef.current = ch
  }, [])

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  // ── Auto-join from URL param ───────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlCode = params.get('room')
    if (urlCode && !room) {
      setRoomCode(urlCode.toUpperCase())
    }
  }, [])

  // ── Fetch room once on mount if session has code ──────────────────────────

  const fetchRoom = useCallback(async (code) => {
    const { data, error: e } = await supabase
      .from('empire_rooms')
      .select('*')
      .eq('code', code)
      .single()
    if (e || !data) return null
    return data
  }, [])

  // ── Update DB + optimistically set local state ────────────────────────────

  const updateRoom = useCallback(async (code, patch) => {
    const { data, error: e } = await supabase
      .from('empire_rooms')
      .update(patch)
      .eq('code', code)
      .select()
      .single()
    if (e) { console.error('updateRoom error:', e); return null }
    setRoom(data)
    return data
  }, [])

  // ── Create room ───────────────────────────────────────────────────────────

  const createRoom = useCallback(async (name, totalRounds) => {
    if (!name.trim()) return setError('Enter your name')
    setLoading(true); clearError()
    localStorage.setItem(PLAYER_NAME_KEY, name.trim())

    const code = generateRoomCode()
    const me = { id: myId, name: name.trim(), isHost: true }
    const scores = { [myId]: 0 }

    const { data, error: e } = await supabase
      .from('empire_rooms')
      .insert({
        code,
        host_id: myId,
        phase: PHASES.LOBBY,
        round: 0,
        total_rounds: totalRounds,
        players: [me],
        scores,
        last_deltas: {},
        police_guess: null,
        thief_caught: null,
        stats: {},
      })
      .select()
      .single()

    if (e) { setError('Could not create room. Try again.'); setLoading(false); return }

    setRoom(data)
    setRoomCode(code)
    setMyName(name.trim())
    subscribe(code)
    setScreen('lobby')
    setLoading(false)
  }, [myId, subscribe])

  // ── Join room ─────────────────────────────────────────────────────────────

  const joinRoom = useCallback(async (name, code) => {
    if (!name.trim()) return setError('Enter your name')
    if (!code.trim()) return setError('Enter room code')
    setLoading(true); clearError()
    localStorage.setItem(PLAYER_NAME_KEY, name.trim())

    const upperCode = code.trim().toUpperCase()
    const data = await fetchRoom(upperCode)
    if (!data) { setError('Room not found. Check the code.'); setLoading(false); return }
    if (data.phase !== PHASES.LOBBY) { setError('Game already in progress.'); setLoading(false); return }

    const players = data.players || []

    // Prevent duplicate
    if (players.find(p => p.id === myId)) {
      setRoom(data); setRoomCode(upperCode); setMyName(name.trim())
      subscribe(upperCode); setScreen('lobby'); setLoading(false); return
    }

    if (players.length >= 10) { setError('Room is full (10 players max).'); setLoading(false); return }

    const me = { id: myId, name: name.trim(), isHost: false }
    const updatedPlayers = [...players, me]
    const updatedScores = { ...(data.scores || {}), [myId]: 0 }

    const updated = await updateRoom(upperCode, { players: updatedPlayers, scores: updatedScores })
    if (!updated) { setError('Failed to join. Try again.'); setLoading(false); return }

    setRoomCode(upperCode)
    setMyName(name.trim())
    subscribe(upperCode)
    setScreen('lobby')
    setLoading(false)

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set('room', upperCode)
    window.history.replaceState({}, '', url)
  }, [myId, fetchRoom, updateRoom, subscribe])

  // ── Rejoin on refresh ─────────────────────────────────────────────────────

  const rejoinRoom = useCallback(async (code) => {
    const data = await fetchRoom(code)
    if (!data) return
    // Check if player is in room
    const inRoom = data.players?.find(p => p.id === myId)
    if (inRoom) {
      setRoom(data); setRoomCode(code); setMyName(inRoom.name)
      subscribe(code)
      setScreen(data.phase === PHASES.LOBBY ? 'lobby' : 'game')
    }
  }, [myId, fetchRoom, subscribe])

  // ── Host: start game ──────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    if (!isHost) return
    if ((room.players?.length || 0) < MIN_PLAYERS) return setError(`Need at least ${MIN_PLAYERS} players`)
    clearError()

    const roles = assignRoles(room.players.length)
    const withRoles = room.players.map((p, i) => ({ ...p, role: roles[i].id }))
    const scores = {}
    withRoles.forEach(p => { scores[p.id] = 0 })

    await updateRoom(roomCode, {
      phase: PHASES.ROLE_REVEAL,
      round: 1,
      players: withRoles,
      scores,
      last_deltas: {},
      police_guess: null,
      thief_caught: null,
      stats: {},
    })
    setScreen('game')
  }, [isHost, room, roomCode, updateRoom])

  // ── Host: advance phase ───────────────────────────────────────────────────

  const advancePhase = useCallback(async (phase, extra = {}) => {
    if (!isHost) return
    await updateRoom(roomCode, { phase, ...extra })
  }, [isHost, roomCode, updateRoom])

  // ── Police: submit guess ──────────────────────────────────────────────────

  const submitPoliceGuess = useCallback(async (guessedPlayerId) => {
    if (myRole !== 'police') return
    const { newScores, deltas, caught } = calculateScores(room.players, room.scores, guessedPlayerId)
    const newStats = updateStats(room.stats || {}, room.players, caught)

    await updateRoom(roomCode, {
      phase: PHASES.RESULT,
      police_guess: guessedPlayerId,
      thief_caught: caught,
      scores: newScores,
      last_deltas: deltas,
      stats: newStats,
    })
  }, [myRole, room, roomCode, updateRoom])

  // ── Host: next round ──────────────────────────────────────────────────────

  const nextRound = useCallback(async () => {
    if (!isHost) return
    if (room.round >= room.total_rounds) {
      await updateRoom(roomCode, { phase: PHASES.GAME_OVER })
      return
    }
    const roles = assignRoles(room.players.length)
    const withRoles = room.players.map((p, i) => ({ ...p, role: roles[i].id }))

    await updateRoom(roomCode, {
      phase: PHASES.ROLE_REVEAL,
      round: room.round + 1,
      players: withRoles,
      police_guess: null,
      thief_caught: null,
      last_deltas: {},
    })
  }, [isHost, room, roomCode, updateRoom])

  // ── Host: play again (same players) ──────────────────────────────────────

  const playAgain = useCallback(async () => {
    if (!isHost) return
    const cleanPlayers = room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost }))
    const scores = {}
    cleanPlayers.forEach(p => { scores[p.id] = 0 })
    await updateRoom(roomCode, {
      phase: PHASES.LOBBY,
      round: 0,
      players: cleanPlayers,
      scores,
      last_deltas: {},
      police_guess: null,
      thief_caught: null,
      stats: {},
    })
    setScreen('lobby')
  }, [isHost, room, roomCode, updateRoom])

  // ── Share room link ───────────────────────────────────────────────────────

  const shareRoom = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Hidden Empire Cards', text: `Join my game! Room: ${roomCode}`, url })
        return
      } catch (_) {}
    }
    try { await navigator.clipboard.writeText(url); return 'copied' } catch (_) {}
    return 'error'
  }, [roomCode])

  return {
    // State
    screen, setScreen,
    room, myId, myName, setMyName,
    myPlayer, myRole,
    isHost, roomCode,
    error, setError, clearError,
    loading,
    // Actions
    createRoom, joinRoom, rejoinRoom,
    startGame, advancePhase,
    submitPoliceGuess, nextRound, playAgain,
    shareRoom,
  }
}
