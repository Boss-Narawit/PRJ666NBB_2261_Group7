# Docker Setup Guide

This guide covers installing Docker Desktop and verifying the ReDrobe local dev environment works correctly.

## Why Docker?

ReDrobe uses Docker to run MongoDB and the mongo-express GUI locally. Every teammate gets an identical database environment regardless of their OS — no manual MongoDB installation required.

---

## Install Docker Desktop

### macOS

1. Go to https://www.docker.com/products/docker-desktop/
2. Download **Docker Desktop for Mac** (choose Apple Silicon or Intel depending on your chip)
3. Open the downloaded `.dmg` and drag Docker to Applications
4. Launch Docker from Applications — the whale icon appears in your menu bar
5. Wait for "Docker Desktop is running" status

**Or via Homebrew:**
```bash
brew install --cask docker
```

---

### Windows

1. Go to https://www.docker.com/products/docker-desktop/
2. Download **Docker Desktop for Windows**
3. Run the installer — enable **WSL 2** integration when prompted (recommended)
4. Restart your machine if asked
5. Launch Docker Desktop from the Start menu
6. Wait for "Docker Desktop is running" in the system tray

> **Note:** WSL 2 requires Windows 10 version 1903+ or Windows 11. If you are on an older version, use the Hyper-V backend instead.

---

### Linux (Ubuntu/Debian)

Docker Desktop is available for Linux but the CLI alone is sufficient:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

---

## Verify Installation

```bash
docker --version
docker compose version
```

Expected output (versions may differ):
```
Docker version 27.x.x, build ...
Docker Compose version v2.x.x
```

---

## Start the ReDrobe Dev Database

From the repo root:

```bash
npm run db:up
```

This starts two containers:

| Container         | What it is          | Port  |
|-------------------|---------------------|-------|
| `redrobe-mongo`   | MongoDB 7 database  | 27017 |
| `redrobe-mongo-ui`| mongo-express GUI   | 8081  |

Check they are running:

```bash
docker compose ps
```

Both containers should show **Up** or **running** status.

Open `http://localhost:8081` in your browser — you should see the mongo-express dashboard.

---

## Useful Commands

| Command | Description |
|---|---|
| `npm run db:up` | Start MongoDB + mongo-express in the background |
| `npm run db:down` | Stop and remove containers (data is preserved) |
| `npm run db:reset` | Wipe all data and restart fresh |
| `docker compose logs -f` | Stream logs from all containers |
| `docker compose logs mongodb` | Logs from MongoDB only |

---

## Troubleshooting

**Port 27017 already in use**
You have a local MongoDB instance running. Stop it first:
```bash
# macOS/Linux
sudo systemctl stop mongod
# or
brew services stop mongodb-community
```

**Port 8081 already in use**
Another service is on 8081. Change the host port in `docker-compose.yml`:
```yaml
ports:
  - "8082:8081"   # change left side only
```
Then access mongo-express at `http://localhost:8082`.

**Docker Desktop not starting on macOS**
Open Activity Monitor, search for `Docker`, force-quit any hung processes, then relaunch Docker Desktop.

**Permission denied (Linux)**
You need to log out and back in after the `usermod` step, or run `newgrp docker` in your current shell.

---

## Not Using Docker?

If you prefer to run MongoDB natively, install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) for your OS, start the `mongod` service, and update `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/redrobe
```

Note that without authentication you can drop the username/password from the URI. The mongo-express GUI will not be available unless you set it up separately.
