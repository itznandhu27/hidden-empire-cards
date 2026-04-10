import { useState, useCallback } from 'react'
import { assignRoles, calculateScores, updateStats, computeSpecialTitles, generatePlayerId } from '../lib/gameLogic'

export function usePassAndPlay() {
  const [ppScreen, setPPScreen] = useState('setup')  // setup | reveal | pass | phone_down | police | result | scoreboard | game_over
  const [players, setPlayers]   = useState([])
  const [nameInput, setNameInput] = useState('')
  const [totalRounds, setTotalRounds] = useState(10)
  const [round, setRound]       = useState(0)
  const [currentRevealIdx, setCurrentRevealIdx] = useState(0)
  const [rolesShown, setRolesShown] = useState(false)
  const [roundPlayers, setRoundPlayers] = useState([])
  const [scores, setScores]     = useState({})
  const [stats, setStats]       = useState({})
  const [lastDeltas, setLastDeltas] = useState({})
  const [policeGuess, setPoliceGuess] = useState(null)
  const [thiefCaught, setThiefCaught] = useState(null)
  const [showRole, setShowRole] = useState(false)
  const [error, setError]       = useState('')

  const addPlayer = useCallback((name) => {
    if (!name.trim()) return setError('Enter a name')
    if (players.length >= 10) return setError('Max 10 players')
    if (players.find(p => p.name.toLowerCase() === name.trim().toLowerCase())) return setError('Name already taken')
    setPlayers(p => [...p, { id: generatePlayerId(), name: name.trim() }])
    setNameInput('')
    setError('')
  }, [players])

  const removePlayer = useCallback((id) => {
    setPlayers(p => p.filter(pl => pl.id !== id))
  }, [])

  const startPP = useCallback(() => {
    if (players.length < 3) return setError('Need at least 3 players')
    const initScores = {}
    players.forEach(p => { initScores[p.id] = 0 })
    setScores(initScores)
    setStats({})
    setRound(1)
    _beginRound(players, initScores)
  }, [players])

  function _beginRound(plist, sc) {
    const roles = assignRoles(plist.length)
    const withRoles = plist.map((p, i) => ({ ...p, role: roles[i].id }))
    setRoundPlayers(withRoles)
    setCurrentRevealIdx(0)
    setShowRole(false)
    setRolesShown(false)
    setPoliceGuess(null)
    setThiefCaught(null)
    setLastDeltas({})
    setPPScreen('reveal')
  }

  const showCurrentRole = useCallback(() => setShowRole(true), [])

  const nextReveal = useCallback(() => {
    if (currentRevealIdx < roundPlayers.length - 1) {
      setCurrentRevealIdx(i => i + 1)
      setShowRole(false)
      setPPScreen('pass')
    } else {
      // All players have seen their role
      setRolesShown(true)
      setPPScreen('phone_down')
    }
  }, [currentRevealIdx, roundPlayers])

  const goToPolice = useCallback(() => setPPScreen('police'), [])

  const submitGuess = useCallback((guessedId) => {
    const { newScores, deltas, caught } = calculateScores(roundPlayers, scores, guessedId)
    const newStats = updateStats(stats, roundPlayers, caught)
    setScores(newScores)
    setLastDeltas(deltas)
    setThiefCaught(caught)
    setPoliceGuess(guessedId)
    setStats(newStats)
    setPPScreen('result')
  }, [roundPlayers, scores, stats])

  const goToScoreboard = useCallback(() => setPPScreen('scoreboard'), [])

  const nextRound = useCallback(() => {
    const newRound = round + 1
    if (newRound > totalRounds) {
      setPPScreen('game_over')
      return
    }
    setRound(newRound)
    _beginRound(players, scores)
  }, [round, totalRounds, players, scores])

  const playAgain = useCallback(() => {
    const initScores = {}
    players.forEach(p => { initScores[p.id] = 0 })
    setScores(initScores)
    setStats({})
    setRound(1)
    _beginRound(players, initScores)
  }, [players])

  const reset = useCallback(() => {
    setPlayers([])
    setScores({})
    setStats({})
    setRound(0)
    setPPScreen('setup')
  }, [])

  const policePlayer = roundPlayers.find(p => p.role === 'police')
  const thiefPlayer  = roundPlayers.find(p => p.role === 'thief')

  const titles = ppScreen === 'game_over'
    ? computeSpecialTitles(players, scores, stats)
    : []

  const sortedScores = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))

  return {
    ppScreen,
    players, nameInput, setNameInput, addPlayer, removePlayer,
    totalRounds, setTotalRounds,
    round,
    currentRevealIdx, showRole,
    roundPlayers, policePlayer, thiefPlayer,
    scores, lastDeltas, thiefCaught, policeGuess,
    stats, titles, sortedScores,
    error, setError,
    startPP, showCurrentRole, nextReveal, goToPolice, submitGuess,
    goToScoreboard, nextRound, playAgain, reset,
  }
}
