'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface LeaderboardEntry {
  rank: number
  playerName: string
  rating: number
  wins: number
  losses: number
  goalDiff: number
  winRate: number
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    playerName: '⚽ Messi_Master',
    rating: 2850,
    wins: 156,
    losses: 12,
    goalDiff: 89,
    winRate: 92.9,
  },
  {
    rank: 2,
    playerName: '🔥 Ronaldo_7',
    rating: 2790,
    wins: 152,
    losses: 18,
    goalDiff: 76,
    winRate: 89.4,
  },
  {
    rank: 3,
    playerName: '⭐ VanDijk_Pro',
    rating: 2650,
    wins: 138,
    losses: 24,
    goalDiff: 64,
    winRate: 85.2,
  },
  {
    rank: 4,
    playerName: '🎯 GoalHunter',
    rating: 2520,
    wins: 125,
    losses: 35,
    goalDiff: 51,
    winRate: 78.1,
  },
  {
    rank: 5,
    playerName: '💎 Elite_Striker',
    rating: 2450,
    wins: 118,
    losses: 42,
    goalDiff: 47,
    winRate: 73.8,
  },
  {
    rank: 6,
    playerName: '🏆 Champion99',
    rating: 2380,
    wins: 110,
    losses: 48,
    goalDiff: 42,
    winRate: 69.6,
  },
  {
    rank: 7,
    playerName: '⚡ SpeedDemon',
    rating: 2310,
    wins: 103,
    losses: 55,
    goalDiff: 38,
    winRate: 65.2,
  },
  {
    rank: 8,
    playerName: '🌟 StarPlayer',
    rating: 2240,
    wins: 96,
    losses: 62,
    goalDiff: 34,
    winRate: 60.8,
  },
  {
    rank: 9,
    playerName: '🎮 ProGamer',
    rating: 2170,
    wins: 89,
    losses: 69,
    goalDiff: 30,
    winRate: 56.3,
  },
  {
    rank: 10,
    playerName: '👑 Futbol_King',
    rating: 2100,
    wins: 82,
    losses: 76,
    goalDiff: 26,
    winRate: 51.9,
  },
]

export function Leaderboard() {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('week')

  return (
    <>
      {/* Leaderboard Button */}
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="fixed top-4 right-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg z-40 transition shadow-lg"
      >
        🏆 Leaderboard
      </button>

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-20 right-4 bg-slate-900 rounded-lg p-6 text-white max-w-md w-full max-h-96 overflow-y-auto z-40 shadow-2xl border-2 border-yellow-500"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🏆 TOP 10 Players</h2>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2 mb-4">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`flex-1 py-1 rounded text-sm font-medium transition ${
                  filterPeriod === period
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-2">
            {MOCK_LEADERBOARD.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  i === 0
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-lg'
                    : i === 1
                      ? 'bg-gradient-to-r from-gray-400 to-gray-300'
                      : i === 2
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500'
                        : 'bg-slate-800 hover:bg-slate-700 transition'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg w-6">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className="font-bold">{entry.playerName}</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    {entry.wins}W - {entry.losses}L ({entry.winRate.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-yellow-300">{entry.rating}</div>
                  <div className={`text-xs font-medium ${entry.goalDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.goalDiff > 0 ? '+' : ''}{entry.goalDiff}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-gray-400 text-center">
            Updated every 5 minutes • Your rank: #247
          </div>
        </motion.div>
      )}
    </>
  )
}
