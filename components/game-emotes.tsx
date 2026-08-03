'use client'

import { useEffect } from 'react'
import {
  useMatchmakingStore,
  EMOTE_SYMBOLS,
  EMOTE_LABELS,
  EMOTE_KEY_MAP,
  type EmoteType,
} from '@/lib/matchmaking'

export function GameEmotes() {
  const { emoteQueue, broadcastEmote } = useMatchmakingStore()

  // Listen for number keys to send emotes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const emote = EMOTE_KEY_MAP[e.key]
      if (emote) {
        e.preventDefault()
        // In real app, would send to opponent via WebSocket
        broadcastEmote('player1', emote)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [broadcastEmote])

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 space-y-2">
      {/* Emote buttons */}
      <div className="bg-black/60 rounded-lg p-2 space-y-1 flex flex-col">
        {(Object.entries(EMOTE_KEY_MAP) as Array<[string, EmoteType]>).map(([key, emote]) => (
          <button
            key={emote}
            onClick={() => broadcastEmote('player1', emote)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
            title={`${EMOTE_LABELS[emote]} (Press ${key})`}
          >
            <span className="text-lg">{EMOTE_SYMBOLS[emote]}</span>
            <span className="hidden sm:inline">{EMOTE_LABELS[emote]}</span>
            <span className="text-xs opacity-60">{key}</span>
          </button>
        ))}
      </div>

      {/* Display active emotes */}
      <div className="space-y-2 mt-4">
        {emoteQueue.map((item, i) => (
          <div
            key={`${item.playerId}-${i}`}
            className="text-4xl animate-bounce"
            style={{
              animation: `bounce 0.6s ease-in-out`,
              opacity: 1 - (Date.now() - item.timestamp) / 3000,
            }}
          >
            {EMOTE_SYMBOLS[item.emote]}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchmakingUI() {
  const { matchmakeMode, matchCode, isSearching, generateMatchCode, setMatchmakeMode } =
    useMatchmakingStore()

  if (!matchmakeMode) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 text-white max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {matchmakeMode === 'quick' ? 'Quick Match' : 'Private Room'}
        </h2>

        {matchmakeMode === 'private' && matchCode && (
          <div className="bg-slate-800 rounded p-4 mb-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Share this code with a friend:</p>
            <p className="text-3xl font-bold font-mono tracking-widest">{matchCode}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(matchCode)
              }}
              className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
            >
              Copy Code
            </button>
          </div>
        )}

        {isSearching && (
          <div className="text-center mb-4">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full" />
            <p className="mt-2 text-gray-400">Searching for opponents...</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setMatchmakeMode(null)}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
