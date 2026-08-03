-- ============================================================================
-- BETTER AUTH TABLES (Auto-created by Better Auth)
-- Agar Better Auth tables auto-create qilmasa, bu SQL-ni run qiling
-- ============================================================================

-- 1. User Table
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. Account Table (for password storage)
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT,
  provider TEXT,
  "providerAccountId" TEXT,
  "refreshToken" TEXT,
  "accessToken" TEXT,
  "expiresAt" BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  password TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

-- 3. Session Table
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Verification Table
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT,
  value TEXT,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP
);

-- ============================================================================
-- DEMO USER SETUP
-- ============================================================================

-- Insert demo user
INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
VALUES (
  'demo-user-001',
  'Demo Player',
  'demo@futbol.uz',
  TRUE,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoPlayer',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert demo account with password hash
-- Password: Demo123456!
-- Hash: $2b$10$dZsJS.ZT8/8OupWjAKHlmOa6CVpv98HEOOYVk06kRcpii.YMQHd.K
INSERT INTO "account" (
  id,
  "userId",
  type,
  provider,
  "providerAccountId",
  password,
  "createdAt"
)
VALUES (
  gen_random_uuid()::text,
  'demo-user-001',
  'email',
  'email',
  'demo@futbol.uz',
  '$2b$10$dZsJS.ZT8/8OupWjAKHlmOa6CVpv98HEOOYVk06kRcpii.YMQHd.K',
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON "account"(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT 'Users:' as table_name, COUNT(*) as count FROM "user"
UNION ALL
SELECT 'Accounts', COUNT(*) FROM "account"
UNION ALL
SELECT 'Sessions', COUNT(*) FROM "session";

-- ============================================================================
-- KIRITISH TARTIBI:
-- 1. Neon console-ga boring
-- 2. Bu SQL-ni paste qiling
-- 3. Execute qiling
-- 4. Demo user create bo'ladi: demo@futbol.uz / Demo123456!
-- ============================================================================
