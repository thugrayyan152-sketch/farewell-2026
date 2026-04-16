# Backend Deployment Guide

## Problem
Netlify only hosts static files (HTML/CSS/JS). The backend server (`server.js`) with SQLite database needs to be deployed separately.

## Solution
Deploy backend to Render.com (Free) and connect to Netlify frontend.

---

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name**: `farewell-2026-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 1.3 Set Environment Variables
In Render dashboard → Environment:
```
NODE_ENV=production
```

### 1.4 Update CORS in server.js
Your Netlify URL is already added to allowed origins:
```javascript
const allowedOrigins = ['https://farewellentry.netlify.app', ...];
```

### 1.5 Deploy
Click "Create Web Service"

**Your backend URL will be:** `https://farewell-2026-backend.onrender.com`

---

## Step 2: Update Frontend API URLs

After backend is deployed, update these files with your backend URL:

### Edit: `public/student.html`, `public/guard.html`, `public/admin.html`

Change this line in each file:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''  // Empty for localhost
    : 'https://your-backend-url.onrender.com';  // <-- REPLACE THIS
```

To:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''  // Empty for localhost
    : 'https://farewell-2026-backend.onrender.com';  // <-- YOUR RENDER URL
```

---

## Step 3: Redeploy Frontend

1. Commit changes to GitHub
2. Netlify will auto-deploy

---

## Alternative: Deploy Backend to Railway

If Render is slow:
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repo, deploy
4. Get URL and update frontend

---

## Testing

After deployment:
1. Open `https://farewellentry.netlify.app`
2. Check browser console for API errors
3. Test adding a student in admin panel
4. Test QR generation
5. Test QR scan

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `404` on API calls | Check API_BASE_URL is correct |
| `CORS error` | Add Netlify URL to server.js allowedOrigins |
| `Network error` | Backend might be sleeping (Free tier) |
| Database empty | SQLite resets on deploy, use persistent storage |

## Free Tier Limits

- **Render**: Sleeps after 15 min inactivity (30 sec cold start)
- **Railway**: $5/month free credit
- **SQLite**: Data persists on Render (disk), resets on Railway (ephemeral)
