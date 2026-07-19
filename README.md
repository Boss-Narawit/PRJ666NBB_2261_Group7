# ReDrobe

A smart digital wardrobe platform that helps users reduce fashion waste, reduce impulse spending, and maximize their existing wardrobe.

## Brief summary

ReDrobe is a comprehensive digital wardrobe management platform designed
to reduce fashion waste, curb impulsive spending, and optimize personal style. Users digitally
catalog their clothing, track usage, create and manage outfits, and receive intelligent reminders
about underutilized items. The platform integrates a “thoughtful purchasing” feature that
combats impulse buys through a timed consideration period and similarity checks against
existing items.With clear data visualizations and an annual Style Recap, ReDrobe turns daily
habits into insights, while a community board, marketplace integration, and an AI stylist chatbot
help users find new outfit ideas and give unused clothing a second life through resale, donation,
or upcycling.

## Problem

Most people own far more clothes than they actually wear, leading to wasted money, impulsive purchases, and unnecessary environmental harm. Existing wardrobe apps focus on organization, but fail to discourage overconsumption or provide insights on clothing usage.

## Solution

ReDrobe is an all-in-one digital wardrobe management platform that allows users to:

- Digitally catalog their clothing
- Track wear frequency
- Create and save outfits
- Receive reminders for underutilized items
- Prevent impulse purchases through a built-in “cooling-off” system
- Gain insights through analytics and an annual “Style Recap”

## Our Team Members

- Nada Khan – Lead UI/UX Designer & Frontend Developer
- Narawit Sawatdecha – Project Manager & Backend Developer
- Trinity Ma – QA & Analytics Developer
- Seulgi Lee – Data & AI / Algorithm Developer
- Beomgu Jeon – Technical Lead & System Architect

## Setup & Installation

To install all dependencies for the entire project (root, frontend, and backend) at once, run the following command in the root folder:

```powershell
npm run install:all
```

## Running Unit Tests

You can run unit tests for both the backend and frontend at once from the root folder, or navigate to individual directories to run them separately.

### Run All Tests at Once
To run both backend and frontend tests sequentially with a single command from the root directory:
```powershell
npm run test:all
```

### Run Separately
- **Backend Tests:**
  ```powershell
  cd backend
  npm run test
  ```
- **Frontend Tests:** (run sequentially and force exit to prevent timeouts/warnings from background timers)
  ```powershell
  cd frontend
  npm run test -- --runInBand --forceExit
  ```

## Frontend Run

Before running any frontend commands, make sure you are in the `frontend` folder:

```powershell
cd frontend
```

Check the local React Native environment:

```powershell
npx react-native doctor
```

Run Android:

```powershell
npx react-native run-android
```

## Backend Run

Before running the backend, make sure you have set up the environment variables (see below).

### - Run from the `backend` folder
Alternatively, navigate to the `backend` folder and run the development script:
```powershell
cd backend
npm run dev
```

## Environment Variables & Database Setup

Create your own local environment file by duplicating the `.env.example` within the `backend` folder:
```powershell
cp backend/.env.example backend/.env
```

Open your newly created `backend/.env` file and configure the variables:

#### - Database Connection (`MONGODB_URI`)
You can connect to the shared MongoDB Atlas cloud cluster:
```powershell
MONGODB_URI=mongodb+srv://<username>:<password>@cluster-redrobe.xkfghee.mongodb.net/?appName=cluster-redrobe
```

> [!TIP]
> **DNS / Connection Issues (`querySrv ECONNREFUSED`):**
> If Node.js throws a `querySrv ECONNREFUSED` error when trying to connect to the cloud database (common on some Windows/DNS configurations), you can use the standard replica set connection string instead:
> ```powershell
> MONGODB_URI=mongodb://<username>:<password>@ac-6hv3spd-shard-00-00.xkfghee.mongodb.net:27017,ac-6hv3spd-shard-00-01.xkfghee.mongodb.net:27017,ac-6hv3spd-shard-00-02.xkfghee.mongodb.net:27017/redrobe?replicaSet=atlas-dxwvyn-shard-0&ssl=true&authSource=admin
> ```

Update the default placeholder of `JWT_SECRET` variable in your `.env` file with a secure, random string.

## AI Microservice Setup (Thoughtful Purchasing)

The AI microservice runs a FashionCLIP model that converts clothing images into vector embeddings. It must be running alongside the backend for the similarity check feature to work.

### Prerequisites

- Python **3.10 or higher**
- `pip` (bundled with Python 3.10+)

Verify your Python version from any terminal:

```powershell
python --version
```

---

### 1. Navigate to the AI service folder

Open a **dedicated terminal window** for the AI service and navigate to it from the project root:

```powershell
cd ai-service
```

> All remaining commands in steps 2–5 must be run from inside the `ai-service` folder in this terminal window.

---

### 2. Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` prefixed to your terminal prompt once activated.

---

### 3. Install Python dependencies

```powershell
pip install -r requirements.txt
```

This installs `fastapi`, `uvicorn`, `fashion-clip`, and `python-multipart`. The first run also downloads the FashionCLIP model weights from Hugging Face (~1 GB) — this is a one-time download.

> [!TIP]
> If the download stalls or fails, ensure you have a stable internet connection and at least 2 GB of free disk space.

---

### 4. Configure the backend environment variable

In `backend/.env`, confirm the AI service URL uses the **IPv4 loopback address**:

```
AI_SERVICE_URL=http://127.0.0.1:8000
```

> [!WARNING]
> Do **not** use `http://localhost:8000`. Node.js resolves `localhost` to the IPv6 address `::1`, which Uvicorn rejects with an `ECONNREFUSED` error. Always use `127.0.0.1` explicitly.

---

### 5. Start the AI microservice

From the **`ai-service` terminal** with your virtual environment active:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

You should see output ending with:

```
Loading FashionCLIP model...
Model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Leave this terminal open. The AI service must stay running while you use the app.

---

### 6. Set up the MongoDB Atlas Vector Search index

The similarity check queries a vector index in MongoDB Atlas. This is a **one-time setup** per cluster.

1. Open [MongoDB Atlas](https://cloud.mongodb.com) and navigate to your cluster.
2. Go to **Atlas Search** → **Create Search Index**.
3. Select **Atlas Vector Search** (JSON editor) and apply the following definition to the `clothings` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "aiEmbedding",
      "numDimensions": 512,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

4. Name the index exactly **`vector_index`** — this name is hardcoded in the similarity controller.
5. Click **Create** and wait for the index status to show **Active** (typically 1–2 minutes).

> [!TIP]
> The `userId` filter field is required for user-scoped similarity searches. Without it, Atlas will refuse to apply the `filter` stage in the aggregation pipeline.

---

### 7. Generate a JWT Token

All clothing and similarity endpoints require a valid JWT in the `Authorization` header. The token is issued by the login (or register) endpoint and is valid for **7 days**.

Start the backend in a **separate terminal** from the project root if it is not already running:

```powershell
npm run dev:backend
```

Then, in a **new terminal** (any directory), register a new account or log in with an existing one.

#### Register a new account

**Windows (PowerShell):**
```powershell
curl.exe -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"Your Name\", \"email\": \"you@example.com\", \"password\": \"yourpassword\"}'
```

**macOS / Linux:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name", "email": "you@example.com", "password": "yourpassword"}'
```

#### Log in with an existing account

**Windows (PowerShell):**
```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"you@example.com\", \"password\": \"yourpassword\"}'
```

**macOS / Linux:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword"}'
```

Both endpoints return the same response. Copy the `token` value:

```json
{
  "_id": "...",
  "name": "Your Name",
  "email": "you@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use this token as a Bearer header in all subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!TIP]
> For ongoing testing, paste the token into [Postman](https://www.postman.com/) under **Authorization → Bearer Token** to avoid repeating the header on every request.

---

### 8. Verify the full pipeline

Run all verification commands from a **new terminal at the project root**. The backend must be running in its own terminal and the AI service must be running in the `ai-service` terminal.

**Step 1 — Confirm the AI service is live.**

Send a GET request — the expected response is `405 Method Not Allowed`, which confirms the service is up and the endpoint exists (it only accepts POST):

```powershell
curl.exe http://127.0.0.1:8000/api/ai/embed
```

Expected:
```json
{"detail":"Method Not Allowed"}
```

**Step 2 — Test the AI service directly with an image.**

The form field name must be `image_file` to match the FastAPI parameter:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/ai/embed -F "image_file=@C:\path\to\image.jpg"
```

Expected: a JSON object containing an `embedding` array of 512 floats:
```json
{"embedding":[0.032, -0.015, ...]}
```

**Step 3 — Upload a clothing image through the backend.**

The backend multer middleware uses the field name `image` (not `image_file`). The backend handles the re-naming when it forwards the buffer to the AI service internally:

```powershell
curl.exe -X POST http://localhost:3000/api/clothing/upload-image `
  -H "Authorization: Bearer <token>" `
  -F "image=@C:\path\to\image.jpg"
```

Expected: a `200` response with a Cloudinary URL and the AI embedding populated:
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/...",
  "aiEmbedding": [0.032, -0.015, ...]
}
```

**Step 4 — Run a similarity check.**

```powershell
curl.exe -X POST http://localhost:3000/api/similarity/check `
  -H "Authorization: Bearer <token>" `
  -F "image=@C:\path\to\image.jpg" `
  -F "threshold=0.70"
```

Expected:
```json
{
  "message": "Similarity check complete",
  "matchesFound": true,
  "matches": [
    { "id": "...", "name": "...", "imageUrl": "...", "similarityRate": "85%" }
  ]
}
```

> [!TIP]
> The similarity check only returns results if the logged-in user already has at least one clothing item saved with `aiEmbedding` populated. Complete Step 3 and save the item to the database before testing Step 4.

