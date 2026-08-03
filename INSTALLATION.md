# 🚀 3D Football Game - Installation Guide

## System Requirements
- Node.js 18+
- pnpm (or npm/yarn)
- Modern web browser with WebGL support

## Installation Steps

### 1. Clone/Download Project
```bash
cd /vercel/share/v0-project
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables
Create `.env.local` file with:
```
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_URL=<your-neon-db-connection-string>
```

### 4. Start Development Server
```bash
pnpm dev
```

Open browser: http://localhost:3000

## 🎮 How to Play

### Authentication
1. Sign up with email/password
2. Sign in to access the game

### Game Modes
- **1v1**: Solo vs AI opponent
- **11v11**: Full team match
- **Sandbox**: Free practice mode

### Controls
```
WASD / Arrow Keys  - Move player
Mouse             - Control camera view
SPACE             - Charge shot power
← →               - Add spin to ball
1-5 Keys          - Send emotes to opponent
P                 - Pause/Resume
```

### Power Bar Mechanics
1. Press **SPACE** to start charging
2. Bar turns green → yellow → red (more power)
3. Use **← →** to add spin to the ball
4. Release **SPACE** to kick

### Emotes (In-game Chat)
- Press **1**: 🎉 Celebrate
- Press **2**: 😂 Laugh
- Press **3**: 👍 Nice shot
- Press **4**: 🔥 On fire
- Press **5**: 😢 Sad

### VAR Replay
- Triggered automatically when goal is scored
- Watch the last 5 seconds in slow-motion
- Multiple camera angles available
- Celebration effects and sounds

### Leaderboard
- Click 🏆 button in top-right
- View top 10 players
- Filter by: This Week / This Month / All Time
- Shows: Rank, Rating, Win Rate, Goal Difference

## 📁 Project Structure

```
components/
├── football-field.tsx      # 3D pitch with markings
├── football-ball.tsx       # Ball with physics
├── player-character.tsx    # Player models
├── game-scene.tsx          # Main game canvas
├── game-menu.tsx           # Game mode selector
├── power-bar.tsx          # Shot power + spin UI
├── goal-net.tsx           # Realistic goal net
├── game-emotes.tsx        # Emotes & matchmaking
├── var-replay.tsx         # VAR replay system
├── leaderboard.tsx        # Player rankings
└── auth-form.tsx          # Sign in/up

lib/
├── server/
│   ├── auth.ts            # Better Auth setup
│   └── db/
│       ├── index.ts       # Drizzle ORM client
│       └── schema.ts      # Database tables
├── game-store.ts          # Game state (Zustand)
├── game-store.ts          # Game state management
├── ai-player.ts           # AI opponent logic
├── matchmaking.ts         # Matchmaking system
└── auth-client.ts         # Client auth hooks

app/
├── page.tsx               # Main game page
├── sign-in/page.tsx       # Login page
├── sign-up/page.tsx       # Signup page
├── api/auth/[...all]/     # Auth endpoints
└── actions/game.ts        # Server actions
```

## 🎨 Key Features

### 1. Power Bar System
- Real-time power indication (0-100%)
- Spin control (-30° to +30°)
- Color feedback (green/yellow/red)

### 2. Goal Net Physics
- Realistic cloth simulation
- Elastic restitution
- Multiple goal angles

### 3. Matchmaking
- Quick match (random opponent)
- Private rooms (4-digit codes)
- Emote communication

### 4. VAR Replay
- Automatic 5-second recording
- Slow-motion playback
- Multiple camera angles
- Celebration effects

### 5. Leaderboard
- Real-time rankings
- Rating system (ELO-style)
- Win/loss tracking
- Goal difference stats

## 🗄️ Database Setup

Tables automatically created with schema:
- `user` - Better Auth user
- `session` - Better Auth session
- `account` - Better Auth OAuth
- `verification` - Better Auth verification
- `player` - Game player profile
- `match` - Game history
- `match_player` - Player in match
- `statistic` - Detailed stats
- `game_session` - Active session

## 🎯 Performance Tips

1. **First Load**: Wait for Three.js to initialize
2. **Graphics**: Use Physics optimization
3. **Multiplayer**: Keep opponent list under 100
4. **Mobile**: Reduce poly count for lower-end devices

## 🐛 Troubleshooting

### "pg not found" error
- Fixed: Moved auth/db to `lib/server/` directory
- Server-side only imports

### Auth not working
- Verify `BETTER_AUTH_SECRET` is set
- Check `DATABASE_URL` connection
- Clear browser cookies

### 3D not rendering
- Enable WebGL in browser
- Update graphics drivers
- Use Chrome/Firefox/Edge

### Physics not working
- Restart dev server
- Clear browser cache
- Check Rapier physics bounds

## 🚀 Deployment

```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel deploy

# Or deploy elsewhere
npm run start
```

## 📞 Support

For issues:
1. Check console errors (F12 → Console)
2. Verify environment variables
3. Check database connection
4. Review browser console logs

## 📚 Technologies Used

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **3D Graphics**: Three.js, React Three Fiber
- **Physics**: Rapier (rigid body physics)
- **State Management**: Zustand
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Auth**: Better Auth
- **Animations**: Framer Motion
- **UI**: shadcn/ui components

---

**Created**: 2024 - v0 AI Football Engine
**Version**: 1.0.0
