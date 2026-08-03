# SQL Setup Guide

## Neon Database-ga SQL Kiritish

### Step 1: Neon Console-ga Boring
1. https://console.neon.tech ga boring
2. O'zingizning PROJECT-ni tanlang
3. "SQL Editor" yoki "Query Editor" ni bosing

### Step 2: DATABASE_SETUP.sql - Kiritish

`DATABASE_SETUP.sql` faylidan barcha SQL-ni copy qiling va Neon-ga paste qiling:

```sql
-- Yuqorida ko'rgan barcha SQL commands
-- 1. Players table
-- 2. Matches table
-- 3. Match_players table
-- 4. Statistics table
-- 5. Game_sessions table
-- 6. Demo player
-- 7-10. Indexes va verification
```

**Execute qiling** - Barcha tables create bo'ladi ✓

### Step 3: BETTER_AUTH_SETUP.sql - Kiritish

`BETTER_AUTH_SETUP.sql` faylidan SQL-ni copy qiling:

```sql
-- Better Auth tables
-- 1. User table
-- 2. Account table
-- 3. Session table
-- 4. Verification table
-- Demo user insert (demo@futbol.uz)
-- Indexes
```

**Execute qiling** - Auth tables ready ✓

## Database Schema

### Players Table
```
id (UUID)
user_id (UUID) - from "user" table
name (TEXT)
rating (INTEGER)
avatar_url (TEXT)
wins, losses (INTEGER)
goals_scored, goals_conceded (INTEGER)
created_at, updated_at (TIMESTAMP)
```

### Matches Table
```
id (UUID)
match_type ('1v1', '11v11', 'sandbox')
team1_id, team2_id (UUID)
winner_id (UUID)
team1_score, team2_score (INTEGER)
duration_seconds (INTEGER)
played_at (TIMESTAMP)
```

### Match Players Table
```
id (UUID)
match_id (UUID) - FK matches
player_id (UUID)
team (1 or 2)
goals, assists (INTEGER)
position (TEXT)
```

### Statistics Table
```
id (UUID)
player_id (UUID)
match_id (UUID) - FK matches
goals, assists, tackles (INTEGER)
possession_percentage, pass_accuracy (FLOAT)
shots_on_target (INTEGER)
passes_completed, passes_attempted (INTEGER)
```

### Game Sessions Table
```
id (UUID)
user_id (UUID)
match_id (UUID) - FK matches
connected_at, disconnected_at (TIMESTAMP)
status (TEXT)
```

### Better Auth Tables
```
"user" - player account
"account" - password hashes
"session" - login sessions
"verification" - email verification tokens
```

## Demo User

**Email:** demo@futbol.uz
**Password:** Demo123456!

Bu user automat insert bo'ladi BETTER_AUTH_SETUP.sql run qilganda.

## Verification

SQL run qilgandan keyin, verify qilish:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check demo user
SELECT * FROM "user" WHERE email = 'demo@futbol.uz';

-- Check demo account
SELECT * FROM "account" WHERE "providerAccountId" = 'demo@futbol.uz';
```

## Errors va Solutions

### Error: "relation does not exist"
- [ ] DATABASE_SETUP.sql run qilganingiz?
- [ ] BETTER_AUTH_SETUP.sql run qilganingiz?

### Error: "duplicate key value"
- Tables allaqachon create bo'lgan - OK
- Demo user allaqachon insert qilgan - OK

### Connection Error
- [ ] Neon project-ni tanlagan ekanligingizni check qiling
- [ ] Network connection check qiling

## Next Steps

1. ✓ SQL run qiling
2. ✓ Tables verify qiling
3. Play Now button-ni bosing
4. Sign in: demo@futbol.uz / Demo123456!
5. O'yin boshlanadi!

Tayyor!
