import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function setupDemo() {
  try {
    const userId = crypto.randomUUID()
    
    // Insert user
    await pool.query(
      `INSERT INTO "user" (id, email, name, "emailVerified", image, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET "emailVerified" = true`,
      [
        userId,
        'demo@futbol.uz',
        'Demo Player',
        true,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoPlayer',
      ]
    )

    console.log('✓ Demo user created/updated')

    // Get the user ID
    const userRes = await pool.query(
      `SELECT id FROM "user" WHERE email = $1`,
      ['demo@futbol.uz']
    )
    
    if (userRes.rows.length === 0) {
      console.error('✗ Demo user not found after insert')
      process.exit(1)
    }

    const realUserId = userRes.rows[0].id

    // Insert account with password hash
    await pool.query(
      `INSERT INTO "account" (id, "userId", type, provider, "providerId", "providerAccountId", "accountId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $4, $5, $5, $6, NOW(), NOW())
       ON CONFLICT (provider, "providerAccountId") DO UPDATE SET password = EXCLUDED.password, "accountId" = EXCLUDED."accountId", "providerId" = EXCLUDED."providerId"`,
      [
        crypto.randomUUID(),
        realUserId,
        'email',
        'email',
        'demo@futbol.uz',
        '$2b$10$dZsJS.ZT8/8OupWjAKHlmOa6CVpv98HEOOYVk06kRcpii.YMQHd.K',
      ]
    )

    console.log('✓ Demo account created/updated')
    console.log('Email: demo@futbol.uz')
    console.log('Password: Demo123456!')
    
    process.exit(0)
  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  }
}

setupDemo()
