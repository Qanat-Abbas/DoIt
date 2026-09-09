# Deploying DoIt!

The app is already built as **one deployable service**: the Express server
in `server/` serves both the API and the compiled React frontend
(`client/dist`), so a single free host is enough — no separate frontend/
backend deployments, no CORS setup.

This was verified locally: `npm run build && npm start` serves the full app,
API included, from one process on one port.

## 1. Push to GitHub

```bash
# from the project root
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

If you don't have an empty repo yet: create one at
[github.com/new](https://github.com/new) — leave it empty (no README, no
`.gitignore`, no license), so the push above doesn't conflict.

The first `git push` to GitHub over HTTPS on Windows will pop up a browser
sign-in via Git Credential Manager if you aren't already authenticated.

## 2. Deploy to Render (free)

The repo already includes [`render.yaml`](./render.yaml), a Render
Blueprint, so this is close to one click:

1. Sign up / log in at [render.com](https://render.com) (free, no card).
2. **New → Blueprint**, connect your GitHub account, pick this repo.
3. Render reads `render.yaml` and proposes one web service named `doit`
   with:
   - Build command: `npm run build` (installs both `server` and `client`
     deps, then builds the React app)
   - Start command: `npm start` (runs `server/index.js`)
4. When prompted, set the **`GROQ_API_KEY`** environment variable to your
   key from [console.groq.com/keys](https://console.groq.com/keys). This is
   the only secret the app needs.
5. Click **Deploy**. First deploy takes a few minutes (installing deps +
   building the client). You'll get a public URL like
   `https://doit-xxxx.onrender.com`.

That URL is what you hand to organizers.

### Notes on the free tier

- Render's free web services spin down after ~15 minutes of inactivity and
  take ~30–50s to wake back up on the next request. If you're demoing live,
  open the URL a minute or two beforehand so it's already warm.
- The 25MB audio upload limit and the app's own resilience fallback (FR-9 —
  cached transcript + tasks if a live call fails or times out) both still
  apply in production, so a cold-start hiccup on the very first request
  won't produce a visible error either way.

## 3. Sanity-check the deployed URL

Once live, confirm the same things I verified locally:

```bash
curl -s https://<your-app>.onrender.com/api/health
# → {"ok":true,"hasKey":true}
```

Then open the URL in a browser and run through: record (or "Try a sample")
→ transcript appears → tasks appear → "Add to Calendar" opens a pre-filled
Google Calendar event.
