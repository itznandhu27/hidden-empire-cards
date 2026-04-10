<<<<<<< HEAD
# Hidden Empire Cards 👑

A real-life social bluffing party game. Players sit together in the same room — phones are used only for secret roles, police decisions, and scoring. All discussion, bluffing, and accusations happen face-to-face.

## Features

- **Online Multiplayer** — up to 10 players, real-time sync via Supabase
- **Pass & Play** — single device, phone passed between players
- **Invite Links** — share `?room=CODE` URL, auto-joins
- **Full game loop** — roles → discussion timer → police accusation → reveal → scoreboard → winner
- **Special Titles** — Best Detective, Master Thief, Rich King
- **Mobile-first** — dark medieval theme, works on any phone browser

## Roles & Points

| Role | Points | Notes |
|------|--------|-------|
| 👑 King | 1000 | |
| 💎 Queen | 800 | |
| 🏛️ Minister | 600 | |
| ⚔️ Soldier | 500 | |
| 🪙 Seller | 400 | |
| 🚔 Police | 0 | Catches the Thief (+700 if correct, -200 if wrong) |
| 🗡️ Thief | 0 | Escapes for +700 pts |

---

## Quick Start (Local)

```bash
git clone https://github.com/YOUR_USERNAME/hidden-empire-cards
cd hidden-empire-cards
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
# Open http://localhost:5173
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://xwqnnvvophmxvoyvpcns.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XgGSoZPTd8g5t6hvOJgrxQ_Psp-TkZ1
```

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create hidden-empire-cards --public --push
# or: git remote add origin https://github.com/YOU/hidden-empire-cards && git push -u origin main
```

### 2. Deploy with Vercel CLI
```bash
npm i -g vercel
vercel --prod
```
When prompted, accept defaults. Then in **Vercel Dashboard → Project → Settings → Environment Variables**, add:
```
VITE_SUPABASE_URL     = https://xwqnnvvophmxvoyvpcns.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_XgGSoZPTd8g5t6hvOJgrxQ_Psp-TkZ1
```
Redeploy once after adding env vars.

### 3. Or import via Vercel Dashboard
1. Go to vercel.com → Add New Project
2. Import your GitHub repo
3. Add the two env vars above
4. Deploy

---

## Supabase Setup (already done for this project)

If setting up fresh:
```sql
-- Run this in Supabase SQL Editor
CREATE TABLE empire_rooms (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  host_id      TEXT NOT NULL,
  phase        TEXT NOT NULL DEFAULT 'lobby',
  round        INT  NOT NULL DEFAULT 0,
  total_rounds INT  NOT NULL DEFAULT 10,
  players      JSONB NOT NULL DEFAULT '[]',
  scores       JSONB NOT NULL DEFAULT '{}',
  last_deltas  JSONB NOT NULL DEFAULT '{}',
  police_guess TEXT,
  thief_caught BOOLEAN,
  stats        JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE empire_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON empire_rooms FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE empire_rooms;
```

Then in **Supabase Dashboard → Realtime** make sure `empire_rooms` is enabled.

---

## Project Structure

```
src/
├── App.jsx                    # Root — routes between screens/modes
├── main.jsx                   # React entry point
├── lib/
│   ├── gameLogic.js           # Pure game logic (roles, scoring, stats)
│   └── supabase.js            # Supabase client
├── hooks/
│   ├── useRoom.js             # Online multiplayer state + Supabase
│   └── usePassAndPlay.js      # Single-device game state
├── components/
│   ├── UI.jsx / UI.module.css              # Shared primitives
│   ├── RoleCard.jsx / .module.css          # 3D flip card
│   ├── TimerRing.jsx / .module.css         # SVG countdown ring
│   ├── Confetti.jsx / .module.css          # Winner confetti
│   ├── PlayerList.jsx / .module.css        # Lobby player list
│   └── Scoreboard.jsx / .module.css        # Scores + titles
└── screens/
    ├── HomeScreen.jsx / .module.css        # Create / Join / Pass&Play
    ├── LobbyScreen.jsx / .module.css       # Room lobby
    ├── GameScreen.jsx / .module.css        # All online game phases
    └── PassAndPlayScreen.jsx / .module.css # All P&P phases
```

---

## How to Play

1. One player creates a room and shares the code (or invite link)
2. All players join on their own phones
3. Host starts — everyone taps their card to see their secret role
4. Phones go down — discuss, bluff, and accuse for 20 seconds
5. Police privately selects who they think the Thief is
6. Roles revealed, points awarded
7. Repeat for all rounds — highest total score wins!
=======
# hidden-empire-cards
>>>>>>> d8be0961e35fbcf2cbab7b1fb84a485b426b941c
