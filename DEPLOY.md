# 🚀 Talkify Deployment Guide

> **Architecture:** Backend on [Render](https://render.com) · Frontend on [Vercel](https://vercel.com)

---

## Prerequisites

- [ ] GitHub account with this repo pushed
- [ ] [Render](https://render.com) account (free)
- [ ] [Vercel](https://vercel.com) account (free)
- [ ] [Cloudinary](https://cloudinary.com) account (free) — for profile picture uploads
- [ ] Firebase project with a service account JSON key

---

## Step 1 — Get Your Cloudinary Credentials

1. Go to [https://console.cloudinary.com](https://console.cloudinary.com)
2. On the Dashboard, copy:
   - **Cloud Name** (e.g. `dxyz12abc`)
   - **API Key** (15-digit number, e.g. `123456789012345`)
   - **API Secret** (long alphanumeric string)

---

## Step 2 — Get Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. Click ⚙️ **Project Settings** → **Service accounts** tab
3. Click **"Generate new private key"** → Download the JSON file
4. Open the file in a text editor and **copy the entire contents**
5. Minify it to one line (use [https://jsonformatter.org/json-minify](https://jsonformatter.org/json-minify))  
   You'll paste this as `FIREBASE_SERVICE_ACCOUNT_JSON` on Render

---

## Step 3 — Deploy Backend on Render

### Option A — One-click with render.yaml (Recommended)

1. Push this repo to GitHub (if not already)
2. Go to [https://dashboard.render.com](https://dashboard.render.com)
3. Click **"New"** → **"Blueprint"**
4. Connect your GitHub repo → Render auto-detects `render.yaml`
5. Click **"Apply"** — Render creates the `talkify-backend` web service

### Option B — Manual setup

1. Go to Render → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   | Field | Value |
   |---|---|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Node Version** | 20 |

### Set Environment Variables on Render

Go to your service → **Environment** tab and add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | any long random string (e.g. `openssl rand -hex 32`) |
| `CLIENT_URL` | your Vercel URL (add **after** frontend is deployed, e.g. `https://talkify.vercel.app`) |
| `ALLOW_VERCEL_PREVIEWS` | `true` |
| `CLOUDINARY_CLOUD_NAME` | from Step 1 |
| `CLOUDINARY_API_KEY` | from Step 1 |
| `CLOUDINARY_API_SECRET` | from Step 1 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | the minified JSON from Step 2 |

4. Click **"Save Changes"** → Render redeploys
5. **Copy your Render URL** — looks like `https://talkify-backend.onrender.com`

---

## Step 4 — Deploy Frontend on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   | Field | Value |
   |---|---|
   | **Root Directory** | `.` (root) |
   | **Framework Preset** | Vite |
   | **Build Command** | `cd frontend && npm install && npm run build` |
   | **Output Directory** | `frontend/dist` |

4. **Add Environment Variables** (before deploying):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render URL e.g. `https://talkify-backend.onrender.com` |
   | `VITE_SOCKET_URL` | same Render URL e.g. `https://talkify-backend.onrender.com` |

5. Click **Deploy** 🎉
6. **Copy your Vercel URL** — looks like `https://talkify.vercel.app`

---

## Step 5 — Connect Frontend ↔ Backend

1. Go back to **Render** → your `talkify-backend` service → **Environment**
2. Update `CLIENT_URL` to your actual Vercel URL:
   ```
   CLIENT_URL=https://talkify.vercel.app
   ```
3. Click **Save Changes** — Render redeploys (takes ~1 min)

---

## Step 6 — Verify Deployment

- [ ] Open your Vercel URL in browser
- [ ] Sign up / log in ✅
- [ ] Upload a profile picture ✅
- [ ] Open the app in two different browser tabs / devices
- [ ] Send a message → appears in real-time ✅
- [ ] Check typing indicator works ✅

---

## Troubleshooting

### "Internal Server Error" on profile picture upload
→ Your Cloudinary credentials are wrong. Double-check API Key is a 15-digit **number** only.

### Login works but messages don't load
→ Check `CLIENT_URL` on Render exactly matches your Vercel URL (no trailing slash).

### Real-time / socket not working
→ Make sure `VITE_SOCKET_URL` on Vercel points to the Render backend URL.

### Render goes to sleep (free tier)
→ Render free tier spins down after 15 min of inactivity. First request takes ~30s to wake up.  
→ Use [UptimeRobot](https://uptimerobot.com) (free) to ping your Render URL every 5 min to keep it awake.

---

## Local Development (unchanged)

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.
