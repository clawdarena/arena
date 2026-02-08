import { create } from 'zustand'
import type { User, Bot, MatchFoundPayload, RoundStartPayload, RoundCompletePayload, MatchEndPayload } from '../../shared/types'
import type { CosmeticCategory } from './cosmetics'

// ============================================================
// Auth Store
// ============================================================

interface AuthState {
  user: User | null
  bots: Bot[]
  token: string | null

  setUser: (user: User | null) => void
  setBots: (bots: Bot[]) => void
  setToken: (token: string | null) => void
  updateCredits: (credits: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bots: [],
  token: null,

  setUser: (user) => set({ user }),
  setBots: (bots) => set({ bots }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },

  updateCredits: (credits) =>
    set((state) => ({
      user: state.user ? { ...state.user, credits } : null,
    })),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('private_key')
    set({ user: null, bots: [], token: null })
  },
}))

// ============================================================
// Cosmetics Store
// ============================================================

interface CosmeticsState {
  // Items the player owns (by item id)
  ownedItems: Set<string>
  // Currently equipped item per slot
  equippedItems: Record<CosmeticCategory, string | null>
  // Preview skin color (for hovering in shop)
  previewSkinColor: string | null

  setOwnedItems: (items: Set<string>) => void
  addOwnedItem: (itemId: string) => void
  setEquippedItem: (slot: CosmeticCategory, itemId: string | null) => void
  setPreviewSkinColor: (color: string | null) => void
}

export const useCosmeticsStore = create<CosmeticsState>((set) => ({
  ownedItems: new Set<string>(),
  equippedItems: {
    skin: 'skin_neon_blue',
    taunt: null,
    dance: 'dance_basic',
    arena: 'arena_default',
    entrance: 'entrance_standard',
  },
  previewSkinColor: null,

  setOwnedItems: (items) => set({ ownedItems: items }),
  addOwnedItem: (itemId) =>
    set((state) => ({
      ownedItems: new Set([...state.ownedItems, itemId]),
    })),
  setEquippedItem: (slot, itemId) =>
    set((state) => ({
      equippedItems: { ...state.equippedItems, [slot]: itemId },
    })),
  setPreviewSkinColor: (color) => set({ previewSkinColor: color }),
}))

// ============================================================
// Match Store
// ============================================================

type MatchPhase = 'idle' | 'queuing' | 'found' | 'betting' | 'fighting' | 'result'

interface MatchState {
  phase: MatchPhase
  matchData: MatchFoundPayload | null
  currentRound: RoundStartPayload | null
  lastRoundResult: RoundCompletePayload | null
  matchResult: MatchEndPayload | null
  roundHistory: RoundCompletePayload[]

  setPhase: (phase: MatchPhase) => void
  setMatchData: (data: MatchFoundPayload) => void
  setCurrentRound: (round: RoundStartPayload) => void
  setRoundResult: (result: RoundCompletePayload) => void
  setMatchResult: (result: MatchEndPayload) => void
  reset: () => void
}

export const useMatchStore = create<MatchState>((set) => ({
  phase: 'idle',
  matchData: null,
  currentRound: null,
  lastRoundResult: null,
  matchResult: null,
  roundHistory: [],

  setPhase: (phase) => set({ phase }),
  setMatchData: (data) => set({ matchData: data, phase: 'found' }),
  setCurrentRound: (round) => set({ currentRound: round, phase: 'fighting' }),
  setRoundResult: (result) =>
    set((state) => ({
      lastRoundResult: result,
      roundHistory: [...state.roundHistory, result],
    })),
  setMatchResult: (result) => set({ matchResult: result, phase: 'result' }),
  reset: () =>
    set({
      phase: 'idle',
      matchData: null,
      currentRound: null,
      lastRoundResult: null,
      matchResult: null,
      roundHistory: [],
    }),
}))

// ============================================================
// Queue Store
// ============================================================

interface QueueState {
  isQueuing: boolean
  matchType: string | null
  queueStartTime: number | null

  startQueuing: (matchType: string) => void
  stopQueuing: () => void
}

export const useQueueStore = create<QueueState>((set) => ({
  isQueuing: false,
  matchType: null,
  queueStartTime: null,

  startQueuing: (matchType) =>
    set({
      isQueuing: true,
      matchType,
      queueStartTime: Date.now(),
    }),
  stopQueuing: () =>
    set({
      isQueuing: false,
      matchType: null,
      queueStartTime: null,
    }),
}))
