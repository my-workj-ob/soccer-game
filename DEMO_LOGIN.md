# Demo Login Guide

## Quick Start - Play Without Registration

O'yin Neon database bilan integrated qildi. Demo mode-da ishlash uchun:

### Method 1: Demo Button (Eng Oson)
1. Sign-in sahifasiga o'ting: `http://localhost:3000/sign-in`
2. "Play Demo (demo@futbol.uz)" tugmasini bosing
3. Auto-login BO'LADI faqat localStorage-ga session-ni saqlaydi
4. Game menu-ga o'tasiz - 3D o'yin tayyorlangan!

### Method 2: Manual Registration
1. Sign-up qilamiz: `http://localhost:3000/sign-up`
   - Name: Istalgan nom
   - Email: valid email address
   - Password: Min 8 characters
2. Account create qilindi
3. Sign-in qiling credentials bilan

## Demo Credentials

```
Email:    demo@futbol.uz  
Password: Demo123456!
```

Lekin **Better Auth origin validation issue** darsidagi Neon database-da hali demo user yo'q.
Demo button auto-create qiladi localStorage session.

## Features Available

✅ **Game Menu** - 3 o'yin rejimi (1v1, 11v11, Sandbox)
✅ **AI Difficulty** - Easy, Medium, Hard levels  
✅ **Performance** - 60+ FPS target, 3D graphics
✅ **Demo Session** - No auth required, localStorage-based
✅ **Stats** - Match statistics tracking available

## Technical Stack

- **Frontend**: React 19, React Three Fiber, Tailwind CSS
- **Backend**: Next.js 16, Better Auth, Neon PostgreSQL
- **3D**: Three.js, Rapier Physics Engine
- **State**: Zustand, Server Actions
- **Styling**: shadcn/ui components

## Known Issues & Solutions

### "Invalid origin" During Sign-up
This is Better Auth CORS checking. Use **Demo Button** instead - it bypasses auth and loads demo mode.

### 3D Canvas Not Rendering
The Three.js Canvas renders once game starts. Menu is UI layer, Canvas loads after "Start Game".

### Database Tables
Created via Drizzle schema in `lib/server/db/schema.ts`:
- players (user-scoped)
- matches (game records)
- match_players (player stats)
- statistics (detailed gameplay)
- game_sessions (multiplayer sync)

## Playing the Game

After demo login succeeds:

1. **Select Game Mode**
   - 1v1 Quick Match: vs AI opponent
   - 11v11 Full Match: team-based
   - Sandbox: free practice

2. **Choose Difficulty**
   - Easy: Beginner AI
   - Medium: Balanced (default)
   - Hard: Professional AI

3. **Start Playing**
   - WASD/Arrow Keys = Move player
   - Mouse = Camera control  
   - Right-click drag = Rotate view
   - Scroll = Zoom in/out
   - Click = Select player

## Architecture Highlights

### Demo Session Layer
```
localStorage → Demo Session (demo-session.ts)
              ↓
auth-form.tsx (demo button clicks)
              ↓
page.tsx (checks demo session)
              ↓
GameMenu + GameScene
```

### 3D Engine
- React Three Fiber Canvas
- Rapier physics (ball, players, collisions)
- OrbitControls + camera system
- Optimized for 60+ FPS

### Features Implemented

✅ Power bar + spin mechanics  
✅ Goal net soft-body physics  
✅ Matchmaking + emotes system  
✅ VAR replay with slow-motion  
✅ Leaderboard with ratings  
✅ Player statistics tracking  
✅ AI opponent system (3 levels)  

## Deployment

```bash
pnpm install
pnpm dev
# Visit http://localhost:3000
```

For production:
```bash
pnpm build
pnpm start
```

Environment variables required:
- DATABASE_URL (Neon)
- BETTER_AUTH_SECRET
- All Neon project vars

---

**Made with ❤️ using React Three Fiber & Rapier Physics**

Questions? Check INSTALLATION.md or FEATURES.md for details.
