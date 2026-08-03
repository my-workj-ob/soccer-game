-- ============================================================================
-- FOOTBALL GAME DATABASE SETUP SQL
-- O'ziz Neon database-ga kiritish uchun
-- ============================================================================

-- 1. Create Players Table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rating INTEGER DEFAULT 1000,
  avatar_url TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_scored INTEGER DEFAULT 0,
  goals_conceded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type TEXT NOT NULL CHECK (match_type IN ('1v1', '11v11', 'sandbox')),
  team1_id UUID NOT NULL,
  team2_id UUID,
  winner_id UUID,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  played_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Match Players Table
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  team INTEGER NOT NULL CHECK (team IN (1, 2)),
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  position TEXT DEFAULT 'midfielder',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create Statistics Table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  possession_percentage FLOAT DEFAULT 0,
  pass_accuracy FLOAT DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  passes_completed INTEGER DEFAULT 0,
  passes_attempted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- ============================================================================
-- DEMO USER SETUP (Optional - for testing)
-- ============================================================================

-- 6. Insert Demo Player Profile
INSERT INTO players (id, user_id, name, rating, avatar_url, wins, losses, goals_scored, goals_conceded)
VALUES (
  gen_random_uuid(),
  'demo-user-001',
  'Demo Player',
  1200,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoPlayer',
  5,
  2,
  15,
  8
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================

-- 7. Create Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_team1_id ON matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team2_id ON matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_statistics_player_id ON statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_statistics_match_id ON statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_match_id ON game_sessions(match_id);

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================

-- 8. Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 9. Check players count
SELECT COUNT(*) as total_players FROM players;

-- 10. Check matches count
SELECT COUNT(*) as total_matches FROM matches;

-- ============================================================================
-- KIRITISH TARTIBI:
-- 1. Yuqoridagi SQL-ni copy qiling
-- 2. Neon console-ga boring
-- 3. SQL Editor-ga paste qiling
-- 4. "Execute" tugmasini bosing
-- 5. Tayyou! Database ready!
-- ============================================================================
