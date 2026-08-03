'use server'

import { auth } from '@/lib/server/auth'
import { db } from '@/lib/server/db'
import { player, match, matchPlayer, statistic } from '@/lib/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createPlayer(name: string, avatarUrl?: string) {
  const userId = await getUserId()

  const newPlayer = await db.insert(player).values({
    id: `player_${Date.now()}`,
    userId,
    name,
    avatarUrl: avatarUrl || null,
    rating: 1000,
  }).returning()

  return newPlayer[0]
}

export async function getPlayerStats() {
  const userId = await getUserId()

  const playerStats = await db
    .select()
    .from(player)
    .where(eq(player.userId, userId))

  return playerStats
}

export async function createMatch(matchType: '1v1' | '11v11' | 'sandbox', team1PlayerId: string, team2PlayerId?: string) {
  const userId = await getUserId()

  const newMatch = await db.insert(match).values({
    id: `match_${Date.now()}`,
    userId,
    matchType,
    team1Id: team1PlayerId,
    team2Id: team2PlayerId || null,
  }).returning()

  return newMatch[0]
}

export async function addGoalToMatch(matchId: string, team: 1 | 2, playerId: string) {
  const userId = await getUserId()

  // Update match score
  const currentMatch = await db.select().from(match).where(and(
    eq(match.id, matchId),
    eq(match.userId, userId)
  ))

  if (!currentMatch.length) throw new Error('Match not found')

  if (team === 1) {
    await db.update(match)
      .set({ team1Score: (currentMatch[0].team1Score || 0) + 1 })
      .where(eq(match.id, matchId))
  } else {
    await db.update(match)
      .set({ team2Score: (currentMatch[0].team2Score || 0) + 1 })
      .where(eq(match.id, matchId))
  }

  // Record the goal
  await db.insert(matchPlayer).values({
    id: `mp_${Date.now()}`,
    userId,
    matchId,
    playerId,
    team,
    goals: 1,
  })

  return { success: true }
}

export async function endMatch(matchId: string, team1Score: number, team2Score: number, durationSeconds: number) {
  const userId = await getUserId()

  const winnerId = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : null

  await db.update(match)
    .set({
      team1Score,
      team2Score,
      durationSeconds,
      winnerId,
    })
    .where(and(eq(match.id, matchId), eq(match.userId, userId)))

  return { success: true }
}

export async function recordStatistic(
  playerId: string,
  matchId: string,
  stats: {
    goals: number
    assists: number
    possessionPercentage: number
    passAccuracy: number
    shotsOnTarget: number
    tackles: number
    passesCompleted: number
    passesAttempted: number
  }
) {
  const userId = await getUserId()

  await db.insert(statistic).values({
    id: `stat_${Date.now()}`,
    userId,
    playerId,
    matchId,
    ...stats,
  })

  return { success: true }
}

export async function getMatchHistory() {
  const userId = await getUserId()

  const matches = await db
    .select()
    .from(match)
    .where(eq(match.userId, userId))
    .orderBy(match.playedAt)

  return matches
}
