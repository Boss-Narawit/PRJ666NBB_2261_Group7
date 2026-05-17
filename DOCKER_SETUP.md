# Docker Setup Guide

ReDrobe uses **MongoDB Atlas** as its database. Docker is used for running the backend and AI service containers — no local MongoDB required.

---

## Install Docker Desktop

### macOS

```bash
brew install --cask docker
```

Or download from https://www.docker.com/products/docker-desktop/ and drag to Applications.

Launch Docker from Applications — wait for the whale icon in the menu bar to show "Docker Desktop is running".

---

### Windows

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Run the installer — enable **WSL 2** integration when prompted
3. Restart if asked, then launch Docker Desktop from the Start menu

---

### Linux (Ubuntu/Debian)

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

---

## Database Setup (Atlas)

ReDrobe connects to **MongoDB Atlas** — not a local database. To set up your environment:

1. Copy the backend env file:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Set your Atlas connection string in `backend/.env`:

   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
   ```

   Ask a teammate for the credentials.

3. Install **MongoDB Compass** to browse the database:
   ```bash
   brew install --cask mongodb-compass
   ```
   Then paste the same connection string into Compass and click Connect.

---

## Useful Commands

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `docker compose up -d`   | Start all service containers    |
| `docker compose down`    | Stop and remove containers      |
| `docker compose logs -f` | Stream logs from all containers |
| `docker compose ps`      | Check container status          |

---

## Troubleshooting

**Docker Desktop not starting on macOS**
Open Activity Monitor, search for `Docker`, force-quit any hung processes, then relaunch Docker Desktop.

**Permission denied (Linux)**
Log out and back in after the `usermod` step, or run `newgrp docker` in your current shell.
