# Mama Strong 🌿

Adaptive prenatal fitness app — personalized daily workouts with smart weekly tracking, Bible verses, and trimester-aware safety guidelines.

## Features
- Daily check-in (energy, nausea, soreness, preference)
- AI-generated workouts tailored to how she feels
- Smart weekly tracking — adapts suggestions based on what's been completed
- Bible verse of the day — rotates through 40 encouraging scriptures
- Week-by-week safety guidelines from medical literature
- Beautiful mobile-first UI, works like a native app on iPhone

## Deploy to Railway (free, 5 minutes)

### Step 1 — Push to GitHub
Upload these files to your GitHub repo (see upload instructions below).

### Step 2 — Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your `mama-strong` repository
5. Railway auto-detects Node.js and deploys

### Step 3 — Add your API key
1. In Railway, click your project → **Variables**
2. Add: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
3. Railway auto-redeploys

### Step 4 — Get your URL
Railway gives you a URL like `mama-strong-production.up.railway.app`

### Step 5 — Add to iPhone home screen
1. Open the URL in Safari on her phone
2. Tap the Share button (box with arrow)
3. Scroll down → **"Add to Home Screen"**
4. Name it "Mama Strong" → tap Add
5. It appears on her home screen like a native app! 🎉

## Local development
```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
# Open http://localhost:3000
```
