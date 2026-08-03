import { create } from 'zustand'

export type EmoteType = 'celebrate' | 'cry' | 'laugh' | 'thumbsup' | 'fire'

interface MatchmakingState {
  matchCode: string | null
  isSearching: boolean
  matchmakeMode: 'quick' | 'private' | null
  
  // Emotes
  emoteQueue: Array<{ playerId: string; emote: EmoteType; timestamp: number }>

  // Actions
  generateMatchCode: () => string
  setMatchmakeMode: (mode: 'quick' | 'private' | null) => void
  setIsSearching: (searching: boolean) => void
  setMatchCode: (code: string | null) => void
  
  // Emote actions
  broadcastEmote: (playerId: string, emote: EmoteType) => void
  clearOldEmotes: () => void
}

const EMOTE_DISPLAY_TIME = 3000 // 3 seconds

export const useMatchmakingStore = create<MatchmakingState>((set, get) => ({
  matchCode: null,
  isSearching: false,
  matchmakeMode: null,
  emoteQueue: [],

  generateMatchCode: () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    set({ matchCode: code })
    return code
  },

  setMatchmakeMode: (mode) => set({ matchmakeMode: mode }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setMatchCode: (code) => set({ matchCode: code }),

  broadcastEmote: (playerId, emote) => {
    set((state) => ({
      emoteQueue: [
        ...state.emoteQueue,
        {
          playerId,
          emote,
          timestamp: Date.now(),
        },
      ],
    }))

    // Clear after display time
    setTimeout(() => get().clearOldEmotes(), EMOTE_DISPLAY_TIME)
  },

  clearOldEmotes: () => {
    set((state) => ({
      emoteQueue: state.emoteQueue.filter(
        (e) => Date.now() - e.timestamp < EMOTE_DISPLAY_TIME
      ),
    }))
  },
}))

// Emote mappings
export const EMOTE_SYMBOLS: Record<EmoteType, string> = {
  celebrate: '🎉',
  cry: '😢',
  laugh: '😂',
  thumbsup: '👍',
  fire: '🔥',
}

export const EMOTE_LABELS: Record<EmoteType, string> = {
  celebrate: 'Celebrate',
  cry: 'Sad',
  laugh: 'Laugh',
  thumbsup: 'Nice',
  fire: 'On Fire',
}

// Quick emote keys
export const EMOTE_KEY_MAP: Record<string, EmoteType> = {
  '1': 'celebrate',
  '2': 'laugh',
  '3': 'thumbsup',
  '4': 'fire',
  '5': 'cry',
}
