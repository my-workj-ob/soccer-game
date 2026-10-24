import { create } from 'zustand'

export interface Player {
  id: string
  name: string
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
  team: 1 | 2
  jerseyNumber: number
  country: string
  height: number // Physical height in meters (e.g., 1.94 for Haaland, 2.00 for Courtois)
  photoUrl?: string
  stats: {
    rating: number
    goals: number
    assists: number
    pace: number
    shooting: number
    passing: number
    dribbling: number
    defense: number
    physical: number
  }
}

export type RefereeEvent =
  | 'normal'
  | 'goal'
  | 'throw-in'
  | 'corner'
  | 'goal-kick'
  | 'offside'
  | 'foul'
  | 'penalty'
  | 'free-kick'
  | 'halftime'
  | 'fulltime'
  | null

export type TacticalPreset = 'tiki-taka' | 'counter-attack' | 'high-press' | 'park-the-bus'

export interface OffsideInfo {
  ballX: number
  receiverId: string
  receiverX: number
  defenderX: number
  timestamp: number
}

export interface SetPieceState {
  type: 'penalty' | 'free-kick' | 'corner' | null
  takerId?: string
  position: [number, number, number]
  targetTeam: 1 | 2
}

export interface GameState {
  // Match state
  matchType: '1v1' | '11v11' | 'sandbox'
  matchStatus: 'idle' | 'playing' | 'paused' | 'ended'
  refereeEvent: RefereeEvent
  lastTouchTeam: 1 | 2
  lastPasserId: string | null
  lastTouchPlayerId: string | null
  team1Score: number
  team2Score: number
  matchTime: number
  matchDuration: number

  // Referee Rules & Disciplinary
  fouls: { team1: number; team2: number }
  yellowCards: Record<string, number>
  redCards: Record<string, boolean>
  offsideData: OffsideInfo | null
  setPieceState: SetPieceState | null
  tacticalPreset: TacticalPreset

  // Players & Controls
  team1Players: Player[]
  team2Players: Player[]
  selectedPlayer: Player | null
  moveInput: { x: number; y: number }
  activeAction: 'pass' | 'shoot' | 'through' | 'sprint' | 'tackle' | 'skill' | null
  isSprinting: boolean
  playerDistancesToBall: Record<string, number>
  playerPositions: Record<string, [number, number, number]>

  // Ball
  ballPosition: [number, number, number]
  ballVelocity: [number, number, number]
  ballPossession: 1 | 2 | null
  kickImpulse: [number, number, number] | null
  dribbleVelocity: [number, number, number] | null

  // Game settings
  difficulty: 'easy' | 'medium' | 'hard'
  isMultiplayer: boolean
  isAIEnabled: boolean
  cameraView: 'third-person' | 'top-down' | 'side-view' | 'set-piece'
  playerStamina: number

  // Actions
  setMatchType: (type: '1v1' | '11v11' | 'sandbox') => void
  setMatchStatus: (status: GameState['matchStatus']) => void
  setRefereeEvent: (event: RefereeEvent) => void
  setLastTouchTeam: (team: 1 | 2, playerId?: string) => void
  setLastPasserId: (id: string | null) => void
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  addTeam1Goal: () => void
  addTeam2Goal: () => void
  addFoul: (team: 1 | 2, playerId?: string, severity?: 'none' | 'yellow' | 'red') => void
  setOffsideData: (data: OffsideInfo | null) => void
  setSetPieceState: (state: SetPieceState | null) => void
  setTacticalPreset: (preset: TacticalPreset) => void
  setTeam1Players: (players: Player[]) => void
  setTeam2Players: (players: Player[]) => void
  setSelectedPlayer: (player: Player | null) => void
  setMoveInput: (input: { x: number; y: number }) => void
  triggerAction: (action: GameState['activeAction']) => void
  setIsSprinting: (sprinting: boolean) => void
  updatePlayerDistance: (id: string, dist: number) => void
  updatePlayerPosition: (id: string, pos: [number, number, number]) => void
  switchPlayerToClosest: () => void
  setBallPosition: (pos: [number, number, number]) => void
  setBallVelocity: (vel: [number, number, number]) => void
  setBallPossession: (team: 1 | 2 | null) => void
  applyKick: (impulse: [number, number, number] | null) => void
  setDribbleVelocity: (vel: [number, number, number] | null) => void
  updateMatchTime: (time: number) => void
  resetMatch: () => void
  setCameraView: (view: 'third-person' | 'top-down' | 'side-view' | 'set-piece') => void
  setPlayerStamina: (stamina: number) => void
}

const initialState = {
  matchType: '11v11' as const, // Default to full superstar rosters
  matchStatus: 'idle' as const,
  refereeEvent: null as RefereeEvent,
  lastTouchTeam: 1 as const,
  lastPasserId: null as string | null,
  lastTouchPlayerId: null as string | null,
  team1Score: 0,
  team2Score: 0,
  matchTime: 0,
  matchDuration: 90 * 60,

  fouls: { team1: 0, team2: 0 },
  yellowCards: {} as Record<string, number>,
  redCards: {} as Record<string, boolean>,
  offsideData: null as OffsideInfo | null,
  setPieceState: null as SetPieceState | null,
  tacticalPreset: 'tiki-taka' as TacticalPreset,

  team1Players: [],
  team2Players: [],
  selectedPlayer: null,
  moveInput: { x: 0, y: 0 },
  activeAction: null,
  isSprinting: false,
  playerDistancesToBall: {} as Record<string, number>,
  playerPositions: {} as Record<string, [number, number, number]>,

  ballPosition: [0, 0, 0] as [number, number, number],
  ballVelocity: [0, 0, 0] as [number, number, number],
  ballPossession: null as 1 | 2 | null,
  kickImpulse: null as [number, number, number] | null,
  dribbleVelocity: null as [number, number, number] | null,

  difficulty: 'medium' as const,
  isMultiplayer: false,
  isAIEnabled: false,
  cameraView: 'third-person' as const,
  playerStamina: 100,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setMatchType: (type) => set({ matchType: type }),
  setMatchStatus: (status) => set({ matchStatus: status }),
  setRefereeEvent: (event) => set({ refereeEvent: event }),
  setLastTouchTeam: (team, playerId) => set({ lastTouchTeam: team, lastTouchPlayerId: playerId || get().lastTouchPlayerId }),
  setLastPasserId: (id) => set({ lastPasserId: id }),
  setDifficulty: (difficulty) => set({ difficulty }),
  addTeam1Goal: () =>
    set((state) => ({
      team1Score: state.team1Score + 1,
    })),
  addTeam2Goal: () =>
    set((state) => ({
      team2Score: state.team2Score + 1,
    })),
  addFoul: (team, playerId, severity = 'none') =>
    set((state) => {
      const fouls = { ...state.fouls, [team === 1 ? 'team1' : 'team2']: state.fouls[team === 1 ? 'team1' : 'team2'] + 1 }
      const yellowCards = { ...state.yellowCards }
      const redCards = { ...state.redCards }
      
      if (playerId && severity === 'yellow') {
        const currentYellows = (yellowCards[playerId] || 0) + 1
        yellowCards[playerId] = currentYellows
        if (currentYellows >= 2) {
          redCards[playerId] = true
        }
      } else if (playerId && severity === 'red') {
        redCards[playerId] = true
      }

      return { fouls, yellowCards, redCards }
    }),
  setOffsideData: (data) => set({ offsideData: data }),
  setSetPieceState: (state) => set({ setPieceState: state }),
  setTacticalPreset: (preset) => set({ tacticalPreset: preset }),
  setTeam1Players: (players) => set({ team1Players: players }),
  setTeam2Players: (players) => set({ team2Players: players }),
  setSelectedPlayer: (player) => set({ selectedPlayer: player }),
  setMoveInput: (input) => set({ moveInput: input }),
  triggerAction: (action) => set({ activeAction: action }),
  setIsSprinting: (sprinting) => set({ isSprinting: sprinting }),
  updatePlayerDistance: (id, dist) => {
    const map = get().playerDistancesToBall
    if (Math.abs((map[id] || 0) - dist) > 0.5) {
      set({ playerDistancesToBall: { ...map, [id]: dist } })
    }
  },
  updatePlayerPosition: (id, pos) => {
    const map = get().playerPositions
    const prev = map[id]
    if (!prev || Math.hypot(prev[0] - pos[0], prev[2] - pos[2]) > 0.35) {
      set({ playerPositions: { ...map, [id]: pos } })
    }
  },
  switchPlayerToClosest: () => {
    const { team1Players, selectedPlayer, playerDistancesToBall, redCards } = get()
    if (!team1Players.length) return

    const candidates = team1Players.filter((p) => {
      if (redCards[p.id]) return false
      if (team1Players.length > 1 && p.id === selectedPlayer?.id) return false
      if (team1Players.length > 2 && p.position === 'goalkeeper') return false
      return true
    })

    if (!candidates.length) return

    candidates.sort((a, b) => {
      const distA = playerDistancesToBall[a.id] ?? 999
      const distB = playerDistancesToBall[b.id] ?? 999
      return distA - distB
    })

    set({ selectedPlayer: candidates[0] })
  },
  setBallPosition: (pos) => {
    const prev = get().ballPosition
    const diff = Math.hypot(prev[0] - pos[0], prev[1] - pos[1], prev[2] - pos[2])
    if (diff > 0.04) {
      set({ ballPosition: pos })
    }
  },
  setBallVelocity: (vel) => {
    const prev = get().ballVelocity
    const diff = Math.hypot(prev[0] - vel[0], prev[1] - vel[1], prev[2] - vel[2])
    if (diff > 0.1) {
      set({ ballVelocity: vel })
    }
  },
  setBallPossession: (team) => set({ ballPossession: team }),
  applyKick: (impulse) => set({ kickImpulse: impulse }),
  setDribbleVelocity: (vel: [number, number, number] | null) => void set({ dribbleVelocity: vel }),
  updateMatchTime: (time: number) => set({ matchTime: time }),
  resetMatch: () => set(initialState),
  setCameraView: (view) => set({ cameraView: view }),
  setPlayerStamina: (stamina) => set({ playerStamina: Math.max(0, Math.min(100, stamina)) }),
}))
