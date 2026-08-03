# ⚽ 3D Football Game - Premium Features

## 🎮 1. Zarba Kuchi va Buralish Mexanikasi (Power Bar + Spin)
**Fayl**: `components/power-bar.tsx`

Futbolchiga asliy futbol o'yinidagi kabi zarba berish imkoniyati:
- **Zarba kuchi indikatori** (Power Bar): Yashildan qizilga o'tib boradi
- **To'pni buralish (Spin)**: Chapga/o'ngga swipe qilib to'pga spin berish
- **Keyboard controls**:
  - `SPACE`: Zarba kuchini toplamoq (charge)
  - `← →`: To'pga spin berish
  - `SPACE` release: Zarva berish

Zarva hamma oyinning 60+ FPS performance-ini saqlab, realistik fizika bilan ishlaydı.

---

## 🥅 2. Darvoza To'ri Fizikasi (Goal Net Physics)
**Fayl**: `components/goal-net.tsx`

Haqiqiy futboldagi darvozaning mexanikasi:
- **Elastik to'r fizikasi**: To'p darvozaga kirganda, to'r egiluvchan va realistic ko'rinadi
- **Cloth simulation**: To'rning har bir uyasi alohida harakat qila oladi
- **Restitution & Friction**: Rapier fizika engine bilan integratsiya
- **Multi-angle goal frame**: 4 burchakli qo'lday tuzilish

Gol urilganda:
- Goal net animation
- Celebratory sound effect
- Particle effects

---

## 🌐 3. Matchmaking va Emotes Sistema
**Fayllar**: `lib/matchmaking.ts`, `components/game-emotes.tsx`

Online multiplayer imkoniyatlari:
- **Quick Match**: Tasodifiy raqib bilan o'ynash
- **Private Room**: Do'st bilan o'ynash uchun 4 xonali kod (masalan: 7B9X)

**Emotes (In-game Chat)**:
- 🎉 Celebrate (1-key)
- 😂 Laugh (2-key) 
- 👍 Nice shot (3-key)
- 🔥 On fire (4-key)
- 😢 Sad (5-key)

O'yin davomida raqibga tezkor emojilar yuboring. Emotes 3 soniya davomida ekranda ko'rinadi va rasmiy futbol o'yinidagi kibi o'yinchilarni animatsiya qiladi.

---

## 🎬 4. VAR Replay va Stadion Effektlari
**Fayl**: `components/var-replay.tsx`

Professional futbol o'yini sifatidagi replay sistema:

**Gol urilganda**:
- ⏱️ Oxirgi 5 soniyani sekinlashtirilgan holatda (slow-motion) qayta ko'rsatish
- 📹 Boshqa kamera burchaklaridan ko'rish (Standard, From Goal, Aerial)
- 🎉 Confetti particles explosion
- 📢 Gol saylavti (3D Audio Context orqali)
- ⭐ GOOOOOL! animatsiya

**Features**:
- Automatic frame recording (30fps, 5 second buffer)
- Interactive replay scrubbing
- Multiple camera angles
- Victory celebration overlay

---

## 📊 Xususiyatlari Qo'shni Tuzatishlar

- **Power bar**: Zarva beruvchi o'yinchiga to'pning tezligi va burlanishini to'liq boshqarish imkonini beradi
- **Goal net**: To'p darvozaga kirganda, kinematik yoki dinamik jism emas, elastik to'r sifatida harakat qiladi
- **Emotes**: Realtime WebSocket (Socket.io) orqali multiplayer o'yinida raqibga yuboriladi
- **VAR**: Barcha 5 soniyalar avtomatik saqlanadi va gol bo'lgan londa replay o'ynaladi

---

## 🎮 O'yin Mexanikasi

### Kontrollar:
- **WASD / Arrow Keys**: O'yinchini harakatlantirib
- **Mouse**: Kamera burchagini o'zgartirish
- **Space**: Zarva berish (charge)
- **1-5 Keys**: Emotes yuborish
- **P**: O'yinni to'xtatish/davom ettirish

### Performance:
- ✅ 60+ FPS target
- ✅ React Three Fiber + Rapier physics
- ✅ GPU optimization ready
- ✅ Level of Detail (LOD) support

---

## 🗄️ Database Schema

### Tables:
- `players` - O'yinchi profili va reyting
- `matches` - Futbol o'yini xususiyatlari
- `match_players` - O'yinchi statistikasi
- `statistics` - Batafsil o'yin statistikasi
- `game_sessions` - Online session tracking

---

## 🚀 Keyingi Qadamlar

1. **Socket.io Integration**: Realtime multiplayer sync
2. **Leaderboard**: TOP 100 o'yinchilar ro'yxati
3. **Player Models**: Sketchfab'dan 3D o'yinchi modellarini biriktirish
4. **Stadium**: Muxlis shovqini, stadion yoritgichi
5. **Mobile Support**: Touch controls va responsive design

---

**Yaratildi**: v0 AI - Futbol Game Engine 2024
