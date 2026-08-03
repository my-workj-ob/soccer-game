import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Simple .env parser for standalone execution
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      process.env[key] = val
    }
  })
} catch (e) {
  console.log('No local .env file found or read error:', e.message)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function fixAuthSchema() {
  const client = await pool.connect()
  try {
    console.log('🔄 Checking and upgrading PostgreSQL database schema for Better Auth...')
    await client.query('BEGIN')

    // 1. Upgrade 'account' table
    await client.query(`
      ALTER TABLE "account" 
      ADD COLUMN IF NOT EXISTS "accountId" TEXT,
      ADD COLUMN IF NOT EXISTS "providerId" TEXT,
      ADD COLUMN IF NOT EXISTS "idToken" TEXT,
      ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();
    `)
    console.log('✓ Account table schema upgraded')

    // Migrate old data if present
    await client.query(`
      UPDATE "account" SET "accountId" = COALESCE("accountId", "providerAccountId", id) WHERE "accountId" IS NULL;
      UPDATE "account" SET "providerId" = COALESCE("providerId", provider, 'email') WHERE "providerId" IS NULL;
    `)
    console.log('✓ Account data backfill applied')

    // 2. Upgrade 'session' table
    await client.query(`
      ALTER TABLE "session" 
      ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
    `)
    console.log('✓ Session table schema upgraded')

    // Migrate old data if present
    await client.query(`
      UPDATE "session" SET "expiresAt" = COALESCE("expiresAt", expires_at, NOW() + INTERVAL '7 days') WHERE "expiresAt" IS NULL;
    `)
    console.log('✓ Session data backfill applied')

    // 3. Upgrade 'user' table
    await client.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();
    `)
    console.log('✓ User table schema upgraded')

    // 4. Upgrade 'verification' table
    await client.query(`
      ALTER TABLE "verification" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();
    `)
    console.log('✓ Verification table schema upgraded')

    await client.query('COMMIT')
    console.log('🎉 Better Auth database schema update completed successfully!')
    process.exit(0)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Schema update error:', error.message)
    process.exit(1)
  } finally {
    client.release()
  }
}

fixAuthSchema()
