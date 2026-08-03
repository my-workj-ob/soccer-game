# 🚀 Quick Start - 3 Bosqich

## 1️⃣ Environment Variables (2 ta)

`.env.local` faylga qo'y:

```env
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz.neon.tech/neondb
BETTER_AUTH_SECRET=generated-random-secret-key
```

**Shuncha! 🎉**

---

## 2️⃣ Database Setup

Terminal-da:

```bash
# SQL scripts copy to project
cd /vercel/share/v0-project

# Better Auth tables create
cat BETTER_AUTH_SETUP.sql | psql $DATABASE_URL

# Game tables create  
cat DATABASE_SETUP.sql | psql $DATABASE_URL
```

---

## 3️⃣ Run App

```bash
pnpm dev
```

Open: http://localhost:3000

**Demo Login:**
- Email: `demo@futbol.uz`
- Password: `Demo123456!`

---

## 📊 Env Var Explanation

| Variable | Purpose | Required | Value |
|----------|---------|----------|-------|
| `DATABASE_URL` | Neon database connection | YES | From Neon Console |
| `BETTER_AUTH_SECRET` | Authentication secret | YES | `openssl rand -base64 32` |
| `PGHOST`, `PGUSER`, etc. | Auto from DATABASE_URL | NO | Auto-detected |
| `NEON_*` | Neon dashboard | NO | Not used |
| `VERCEL_*` | Production deploy | NO | Vercel only |

---

## ✅ Checklist

- [ ] `.env.local` created
- [ ] `DATABASE_URL` filled
- [ ] `BETTER_AUTH_SECRET` generated
- [ ] `BETTER_AUTH_SETUP.sql` executed
- [ ] `DATABASE_SETUP.sql` executed
- [ ] `pnpm dev` running
- [ ] http://localhost:3000 working

**Done! O'yin tayyorlangan 🎮**
