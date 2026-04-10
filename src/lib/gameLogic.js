export const ROLES = [
  { id: 'king',     label: 'King',     emoji: '👑', points: 1000, color: '#FFD700', special: false },
  { id: 'queen',    label: 'Queen',    emoji: '💎', points: 800,  color: '#E879F9', special: false },
  { id: 'minister', label: 'Minister', emoji: '🏛️', points: 600,  color: '#60A5FA', special: false },
  { id: 'soldier',  label: 'Soldier',  emoji: '⚔️', points: 500,  color: '#34D399', special: false },
  { id: 'seller',   label: 'Seller',   emoji: '🪙', points: 400,  color: '#FB923C', special: false },
  { id: 'police',   label: 'Police',   emoji: '🚔', points: 0,    color: '#94A3B8', special: true  },
  { id: 'thief',    label: 'Thief',    emoji: '🗡️', points: 0,    color: '#F87171', special: true  },
]

export const PHASES = {
  LOBBY:         'lobby',
  ROLE_REVEAL:   'role_reveal',
  PHONE_DOWN:    'phone_down',
  POLICE_SELECT: 'police_select',
  RESULT:        'result',
  SCOREBOARD:    'scoreboard',
  GAME_OVER:     'game_over',
  // Pass & Play phases
  PP_ROLE:       'pp_role',   // show role to one player
  PP_PASS:       'pp_pass',   // "pass to next player" screen
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 10

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/** Assign one role per player. Always includes police + thief, fills rest with non-specials. */
export function assignRoles(playerCount) {
  const specials = ROLES.filter(r => r.special)
  const nonSpecials = ROLES.filter(r => !r.special)
  const needed = Math.max(0, playerCount - 2)
  const pool = [...nonSpecials].sort(() => Math.random() - 0.5).slice(0, needed)
  return [...specials, ...pool].sort(() => Math.random() - 0.5)
}

/** Apply one round's worth of scoring. Returns { newScores, deltas, caught }. */
export function calculateScores(players, scores, policeGuessId) {
  const thief  = players.find(p => p.role === 'thief')
  const police = players.find(p => p.role === 'police')
  const caught = thief?.id === policeGuessId

  const deltas = {}
  players.forEach(p => {
    if (p.role === 'police') {
      deltas[p.id] = caught ? 700 : -200
    } else if (p.role === 'thief') {
      deltas[p.id] = caught ? 0 : 700
    } else {
      deltas[p.id] = ROLES.find(r => r.id === p.role)?.points ?? 0
    }
  })

  const newScores = { ...scores }
  Object.entries(deltas).forEach(([id, pts]) => {
    newScores[id] = (newScores[id] || 0) + pts
  })

  return { newScores, deltas, caught }
}

/** Build fresh game state for a new round (or start). */
export function buildNewRoundState(existingState, players) {
  const roles = assignRoles(players.length)
  const withRoles = players.map((p, i) => ({ ...p, role: roles[i].id }))
  return {
    ...existingState,
    phase: PHASES.ROLE_REVEAL,
    round: existingState.round + 1,
    players: withRoles,
    police_guess: null,
    thief_caught: null,
    last_deltas: {},
  }
}

/** Compute end-of-game special titles from cumulative stats. */
export function computeSpecialTitles(players, scores, stats) {
  const titles = []
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))

  if (sorted[0]) {
    titles.push({
      emoji: '👑', label: 'Rich King',
      player: sorted[0].name,
      stat: `${scores[sorted[0].id] || 0} total points`,
    })
  }

  // Best Detective: most correct police guesses
  const detectives = Object.entries(stats?.catches || {})
    .sort(([,a],[,b]) => b - a)
  if (detectives[0] && detectives[0][1] > 0) {
    const p = players.find(pl => pl.id === detectives[0][0])
    if (p) titles.push({
      emoji: '🕵️', label: 'Best Detective',
      player: p.name,
      stat: `${detectives[0][1]} successful arrest${detectives[0][1]>1?'s':''}`,
    })
  }

  // Master Thief: most escapes
  const thieves = Object.entries(stats?.escapes || {})
    .sort(([,a],[,b]) => b - a)
  if (thieves[0] && thieves[0][1] > 0) {
    const p = players.find(pl => pl.id === thieves[0][0])
    if (p) titles.push({
      emoji: '🥷', label: 'Master Thief',
      player: p.name,
      stat: `${thieves[0][1]} successful escape${thieves[0][1]>1?'s':''}`,
    })
  }

  return titles
}

/** Update cumulative stats after a round. */
export function updateStats(stats = {}, players, caught) {
  const police = players.find(p => p.role === 'police')
  const thief  = players.find(p => p.role === 'thief')
  const next = {
    catches: { ...(stats.catches || {}) },
    escapes: { ...(stats.escapes || {}) },
  }
  if (police) {
    if (caught) next.catches[police.id] = (next.catches[police.id] || 0) + 1
  }
  if (thief && !caught) {
    next.escapes[thief.id] = (next.escapes[thief.id] || 0) + 1
  }
  return next
}
