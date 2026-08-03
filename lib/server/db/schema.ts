import { pgTable, text, timestamp, boolean, integer, real } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// --- Football Game Tables -------------------------------------------------

export const player = pgTable('player', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  rating: integer('rating').notNull().default(1000),
  avatarUrl: text('avatarUrl'),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  goalsScored: integer('goalsScored').notNull().default(0),
  goalsConceded: integer('goalsConceded').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const match = pgTable('match', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  matchType: text('matchType').notNull(), // '1v1' | '11v11' | 'sandbox'
  team1Id: text('team1Id').notNull(),
  team2Id: text('team2Id'),
  winnerId: text('winnerId'),
  team1Score: integer('team1Score').notNull().default(0),
  team2Score: integer('team2Score').notNull().default(0),
  durationSeconds: integer('durationSeconds').notNull().default(0),
  playedAt: timestamp('playedAt').notNull().defaultNow(),
})

export const matchPlayer = pgTable('matchPlayer', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  matchId: text('matchId').notNull(),
  playerId: text('playerId').notNull(),
  team: integer('team').notNull(), // 1 or 2
  goals: integer('goals').notNull().default(0),
  assists: integer('assists').notNull().default(0),
  position: text('position').notNull().default('midfielder'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const statistic = pgTable('statistic', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  playerId: text('playerId').notNull(),
  matchId: text('matchId').notNull(),
  goals: integer('goals').notNull().default(0),
  assists: integer('assists').notNull().default(0),
  possessionPercentage: real('possessionPercentage').notNull().default(0),
  passAccuracy: real('passAccuracy').notNull().default(0),
  shotsOnTarget: integer('shotsOnTarget').notNull().default(0),
  tackles: integer('tackles').notNull().default(0),
  passesCompleted: integer('passesCompleted').notNull().default(0),
  passesAttempted: integer('passesAttempted').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const gameSession = pgTable('gameSession', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  matchId: text('matchId').notNull(),
  connectedAt: timestamp('connectedAt').notNull().defaultNow(),
  disconnectedAt: timestamp('disconnectedAt'),
  status: text('status').notNull().default('active'), // 'active' | 'disconnected' | 'ended'
})
