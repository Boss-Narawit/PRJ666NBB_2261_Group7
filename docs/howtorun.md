# How to Run ReDrobe Locally

Full local stack for the iOS simulator. **Uses 4 terminal tabs** — start them in this order.
(If you don't need the AI similarity feature, you can skip Terminal 4 — everything else works, but the similarity check will show a "Similarity Check Failed" alert.)

| #   | Terminal   | What it runs                               | Port |
| --- | ---------- | ------------------------------------------ | ---- |
| 1   | Backend    | Express API + MongoDB (Atlas)              | 3000 |
| 2   | Metro      | React Native JS bundler                    | 8081 |
| 3   | iOS build  | Builds & installs the app on the simulator | —    |
| 4   | AI service | fashion-clip similarity embeddings         | 8000 |

---

## First-time setup (do once)

The AI service needs a Python virtual environment. Everything else is already installed (node_modules, CocoaPods).

```bash
cd ai-service
python3 -m venv venv                 # this machine's python3 is 3.14 — that's fine, torch has 3.14 wheels
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt      # torch + transformers + fashion-clip — takes a few minutes
```

Make sure `backend/.env` contains:

```
AI_SERVICE_URL=http://localhost:8000
```

---

## Every time — 4 terminals

### Terminal 1 — Backend

```bash
cd backend && npm run dev
```

Wait for `Server running on port 3000` and `MongoDB connected`.

> There is no `start` script. Use `npm run dev` (nodemon) — plain `node src/server.js` won't auto-reload and will silently serve stale code.

### Terminal 2 — Metro bundler

```bash
cd frontend && npx react-native start --reset-cache
```

Wait for `Dev server ready` / "Metro waiting on...".

### Terminal 3 — Build & install on the simulator

```bash
cd frontend && npx react-native run-ios --simulator "iPhone 17 Pro"
```

First build takes ~2–3 min. Ends with `success Successfully launched the app`.

### Terminal 4 — AI service (required for AI Similarity Check)

```bash
cd ai-service && source venv/bin/activate && uvicorn main:app --port 8000
```

First run downloads the fashion-clip model weights from Hugging Face — wait for `Application startup complete` (and `Model loaded successfully!`) before testing similarity.

> If this service is down, `POST /api/similarity/check` returns 500 and the app shows a "Similarity Check Failed" alert — it never shows a fake score.

---

## Confirmed working simulators

iPhone 17 Pro, iPhone 17 Pro Max, iPhone Air, iPhone 17.
Swap the name in the Terminal 3 command to use a different one.

---

## Troubleshooting

**Red "No script URL" screen** — Watchman needs Full Disk Access (project lives under `~/Documents`).
System Settings → Privacy & Security → Full Disk Access → add **Watchman**, then restart Metro (Terminal 2).

**AI Similarity Check shows an error alert** — Terminal 4 isn't running or the model hasn't finished loading. Check `http://localhost:8000` is up and the log shows `Application startup complete`.

**Similarity check returns "no similar items found"** — the logged-in account has no embedded wardrobe items. Real seeded dev users have items (e.g. the demo account); a brand-new account's wardrobe must be embedded first (`node scripts/backfillEmbeddings.js` from `backend/`, or add items which auto-embed on create).

**Quick backend-only smoke test of similarity** (no simulator needed), from `backend/`:

```bash
SECRET=$(grep '^JWT_SECRET=' .env | cut -d= -f2-)
TOKEN=$(JWT_SECRET="$SECRET" node -e "console.log(require('jsonwebtoken').sign({userId:'<a userId that owns embedded items>'}, process.env.JWT_SECRET, {expiresIn:'1h'}))")
curl -s -X POST http://127.0.0.1:3000/api/similarity/check \
  -H "Authorization: Bearer $TOKEN" -F "image=@/path/to/photo.jpg"
```

Note: mint the token with a plain node script that does **not** load dotenv — the backend uses dotenvx, which prints a banner to stdout and would corrupt the captured token.
