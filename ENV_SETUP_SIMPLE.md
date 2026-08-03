# Environment Variables - Simple Setup

## ⚠️ ASOSIY - Faqat 2 ta kerak!

### 1. DATABASE_URL (Neon)
```
DATABASE_URL=postgresql://user:password@host/database
```
**Qayerdan olamiz:**
- Neon Dashboard → Projects → Your Project → Connection String
- Format: `postgresql://neondb_owner:****@ep-*.us-east-1.neon.tech/neondb`
- Paste shu value-ni

### 2. BETTER_AUTH_SECRET (Auth)
```
BETTER_AUTH_SECRET=your-random-secret-key-min-32-chars
```
**Generate qilish:**
```bash
openssl rand -base64 32
```
**Yoki online:** https://www.random.org/strings/

---

## ✅ Boshqa env var-lar (OPTIONAL)

Neon automatically beriyor:
- `PGHOST` - database host
- `PGUSER` - database user
- `PGPASSWORD` - database password
- `PGDATABASE` - database name
- `POSTGRES_URL` - DATABASE_URL copy
- `POSTGRES_PRISMA_URL` - DATABASE_URL copy

**Bu lar qo'shimcha qilish KERAK EMASdir!**

---

## 📋 Step-by-Step Setup

### 1. Neon Console
1. Neon dashboard → Projects
2. Your project tanlang
3. "Connection String" > "Nodejs"
4. Copy qilib ol

### 2. `.env.local` faylni update qil
```env
# ASOSIY - Bu ikkalasi kerak
DATABASE_URL=postgresql://...{NEON_CONNECTION_STRING}...
BETTER_AUTH_SECRET={GENERATED_SECRET}

# OPTIONAL - Bu lar Neon auto berov beradi
PGHOST={otomatik}
PGUSER={otomatik}
PGPASSWORD={otomatik}
PGDATABASE={otomatik}
POSTGRES_URL={otomatik}
```

### 3. Verify qilish
```bash
# Terminal da test
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing')"
```

---

## 🚫 Bu env-lar SKIP QIL!

```
AI_GATEWAY_API_KEY - (agar AI kerak bo'lsa kerak)
NEON_AUTH_BASE_URL - (development)
NEON_PROJECT_ID - (Neon CLI uchun)
VERCEL_* - (Vercel deploy uchun)
V0_* - (v0 debug uchun)
NEXT_PUBLIC_* - (client-side, Supabase uchun)
```

---

## ✨ FINAL - 2-Line Setup

**Bu ikkalasini .env.local-ga qo'y:**

```env
DATABASE_URL=postgresql://neondb_owner:****@ep-**.us-east-1.neon.tech/neondb
BETTER_AUTH_SECRET=your32characterrandomsecretkeyhere
```

**READY! 🎉**
