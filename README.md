# G6 Dynamic Pricing Agent
### AI-Powered Revenue Management · G6 Hospitality (Motel 6 / Studio 6)

> Final Semester Project — AI Engineering | OYO Rooms US Business Internship

---

## What It Does

Three specialist AI agents run in a single secure backend call:

| Agent | Task |
|---|---|
| 🔵 Market Intel Agent | Searches real competitor hotel rates (Booking.com, Expedia) |
| 🟡 Demand Scout Agent | Finds local events driving hotel demand |
| 🟢 Pricing Engine | Generates specific rate recommendation + revenue impact |

**Key design**: API key lives only on the server (Vercel env variable). Frontend has zero access to it.

---

## Architecture

```
Browser (React)
     │
     │  POST /api/analyze  { property, dates }
     ▼
Vercel Serverless Function  ← GEMINI_API_KEY lives here only
     │
     │  calls Gemini 2.0 Flash + Google Search
     ▼
AI Agent (Market Intel + Demand Scout + Pricing Engine)
     │
     ▼
JSON response → Browser renders results
```

---

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "G6 Dynamic Pricing Agent"
git remote add origin https://github.com/YOUR_USERNAME/g6-pricing-agent.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New Project** → select your repo
3. Click **Environment Variables** → add:
   - Key: `GEMINI_API_KEY`
   - Value: your Gemini API key from [aistudio.google.com](https://aistudio.google.com)
4. Click **Deploy**

Done. You get a live URL — open it in your browser, no key needed anywhere.

---

## Run Locally

```bash
npm install
npm install -g vercel

# Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run with Vercel dev (loads env + serverless functions)
vercel dev
```

---

## Tech Stack

- **Frontend**: React + Vite (no API key, no secrets)
- **Backend**: Vercel Serverless Function (`/api/analyze.js`)
- **AI Model**: Gemini 2.0 Flash with Google Search grounding
- **Data**: 100% public — Booking.com, Expedia, Google Events

---

## Business Case

G6 has 1,500+ properties. Revenue managers manually check competitor rates and event calendars — 2-3 hours per property per week. This agent does it in ~30 seconds. At scale, that's thousands of hours saved weekly, plus better pricing decisions = direct margin improvement.

---

*Built during internship at OYO Rooms US — G6 Hospitality / Motel 6 division*
