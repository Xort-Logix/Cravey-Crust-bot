# 🤖 WhatsApp Multi-Account Bot & Automation Platform
### Complete Installation & Deployment Guide (Docker, Non-Docker, Windows & Live VPS)

---

## 📋 Table of Contents
1. [Overview & Features](#-overview--features)
2. [Project Structure & Prerequisites](#-project-structure--prerequisites)
3. [Environment Configuration (.env)](#-environment-configuration-env)
4. [Method 1: Run with Docker & Docker Compose (Recommended)](#-method-1-run-with-docker--docker-compose-recommended)
5. [Method 2: Deploy via Portainer GUI (Linux Mint / VPS)](#-method-2-deploy-via-portainer-gui-linux-mint--vps)
6. [Method 3: Run Without Docker on Linux (Node.js + PM2)](#-method-3-run-without-docker-on-linux-nodejs--pm2)
7. [Method 4: Run on Windows 10 / 11 (Native & Docker)](#-method-4-run-on-windows-10--11-native--docker)
8. [Method 5: Production Live Server with Domain & SSL (Nginx)](#-method-5-production-live-server-with-domain--ssl-nginx)
9. [Multi-Account Management Guide](#-multi-account-management-guide)
10. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview & Features

This project is a high-performance, multi-device WhatsApp automation platform built with **Node.js (ESM)**, **Baileys (v6.7+)**, and a modern **Glassmorphism Web Dashboard**.

- **Multi-WhatsApp Accounts**: Run 2, 3, or more WhatsApp numbers concurrently 24/7 on a single server or PC.
- **Privacy & Stealth Mode**: All bot command responses (`.menu`, `.ping`, `.ai`, etc.) and error notices are sent **privately to the account owner's chat**, never in external or group chats.
- **Interactive Web Dashboard**:
  - Instant **8-Digit Pairing Code** (no QR scanner needed).
  - High-res **QR Code Scanner** flow.
  - Interactive **Web Terminal / Console** with live log streaming.
  - **Account Switcher & Management**: Add, switch, delete (`✕`), or bulk clean inactive accounts.
  - 100% Mobile & Desktop responsive.
- **Rich Automation Suite**:
  - `Anti-Delete`: Automatically detects deleted messages/media and sends recovered copies to the owner.
  - `View-Once Saver (.vv)`: Extracts and saves single-view photos/videos.
  - `AI Assistant (.ai)`: Powered by OpenAI GPT models.
  - `Sticker Creator (.sticker)`: Instant photo/video to sticker conversion (via FFmpeg).
  - `Downloader (.download)`: Video and audio media fetching.
  - `Group Admin Tools`: `.kick`, `.mute`, `.tagall`, `.antilink`, welcome/goodbye greetings.

---

## 📂 Project Structure & Prerequisites

```text
whatsappbot-main/
├── bot.js                  # Main server, multi-session manager & Baileys socket engine
├── Dockerfile              # Production multi-stage Docker container specification
├── docker-compose.yml      # Service orchestration & persistent volume definition
├── package.json            # Node.js dependencies
├── .env.example            # Environment variable template
├── commands/               # Modular bot command files (.menu, .ping, .ai, etc.)
├── public/                 # Responsive web dashboard (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── auth/                   # Persistent WhatsApp session keys & ratchets
│   └── sessions/           # Subfolders per connected account
└── downloads/              # Temporary storage for media & stickers
```

### System Requirements
| Requirement | Minimum | Recommended |
|---|---|---|
| **CPU** | 1 Core | 2 Cores |
| **RAM** | 512 MB (1 account) | 1 GB - 2 GB (multi-account) |
| **Storage** | 2 GB free space | 10 GB SSD |
| **Node.js** (Non-Docker) | v18.x | v20.x LTS or higher |
| **FFmpeg** (Non-Docker) | Required for stickers/audio | Installed & in system PATH |

---

## ⚙️ Environment Configuration (.env)

Before starting the bot, create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create `.env` manually with a text editor:

```ini
# Port where the web dashboard will be accessible
PORT=3000

# Bot command prefix (e.g. .menu, !menu, /menu)
PREFIX=.

# Your primary WhatsApp number with country code (no + or spaces)
OWNER_NUMBER=923320000000

# Optional: OpenAI API Key for the .ai command
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🐳 Method 1: Run with Docker & Docker Compose (Recommended)

Docker is the cleanest method because FFmpeg and Node.js 20 are pre-configured inside the container, and session data is safely persisted on your host machine.

### Step 1: Install Docker & Docker Compose
- **Ubuntu / Debian / Linux Mint**:
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose
  sudo systemctl enable --now docker
  sudo usermod -aG docker $USER
  # Log out and log back in for group changes to take effect
  ```

### Step 2: Build & Start the Container
Navigate to the project directory and run:

```bash
cd "/path/to/whatsappbot-main"
docker compose up -d --build
```

### Step 3: Monitor Logs & Status
```bash
# View live container logs
docker compose logs -f

# Check container status
docker compose ps

# Restart the bot
docker compose restart

# Stop the bot
docker compose down
```

### Step 4: Open Dashboard
Open your browser and visit:
👉 **`http://localhost:3000`** (or `http://<your-server-ip>:3000`)

---

## 🎛️ Method 2: Deploy via Portainer GUI (Linux Mint / VPS)

If you have **Portainer** installed on Linux Mint or a home server:

1. Open your **Portainer Web Interface** (`https://<your-mint-ip>:9443` or `http://<your-mint-ip>:9000`).
2. Go to **Primary Environment** → Click **Stacks** in the left sidebar.
3. Click **"+ Add stack"**.
4. Name the stack: `whatsapp-bot`.
5. Choose **"Web editor"** and paste the contents of `docker-compose.yml`:

```yaml
services:
  whatsapp-bot:
    image: node:20-bookworm-slim
    container_name: whatsapp-bot
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - PREFIX=.
      - OWNER_NUMBER=923320000000
      - OPENAI_API_KEY=
    volumes:
      - /home/YOUR_USERNAME/whatsapp-bot/auth:/app/auth
      - /home/YOUR_USERNAME/whatsapp-bot/downloads:/app/downloads
    working_dir: /app
    command: sh -c "apt-get update && apt-get install -y ffmpeg && npm install --omit=dev && npm start"
```
*(Or upload the full project folder and select the build method)*.

6. Under **Environment variables**, supply your `OWNER_NUMBER` and `OPENAI_API_KEY`.
7. Click **"Deploy the stack"**.
8. Once running, access the dashboard at: `http://<linux-mint-ip>:3000`.

---

## 🐧 Method 3: Run Without Docker on Linux (Node.js + PM2)

If you do not want to use Docker, you can run the bot directly on any Linux distribution (Ubuntu, Debian, Linux Mint, Fedora, CentOS).

### Step 1: Install Node.js 20 LTS & FFmpeg
```bash
# Update package lists
sudo apt update

# Install curl and FFmpeg
sudo apt install -y curl ffmpeg git

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should output v20.x.x
ffmpeg -version
```

### Step 2: Install Project Dependencies
```bash
cd "/path/to/whatsappbot-main"
npm install --omit=dev
```

### Step 3: Run the Bot Directly (Testing)
```bash
npm start
```
You will see:
```text
🌐 Dashboard web server running at http://localhost:3000
📦 Total commands loaded: 12
```

### Step 4: Run in the Background 24/7 with PM2 (Production)
PM2 ensures the bot automatically restarts if it crashes or if the server reboots:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the bot under PM2
pm2 start bot.js --name "whatsapp-bot"

# Set up PM2 to auto-start on system boot
pm2 startup
# (Run the sudo command that PM2 prints in the terminal)

# Save the process list
pm2 save

# Useful PM2 commands:
pm2 logs whatsapp-bot       # View live logs
pm2 status                  # Check memory & CPU usage
pm2 restart whatsapp-bot    # Restart the bot
pm2 stop whatsapp-bot       # Stop the bot
```

---

## 🪟 Method 4: Run on Windows 10 / 11 (Native & Docker)

You can run the bot on Windows either via **Docker Desktop** or **Native Node.js**.

### Option A: Using Docker Desktop for Windows
1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) (enable WSL 2 backend).
2. Extract the `whatsapp-bot-deploy.zip` to a folder (e.g., `C:\whatsapp-bot`).
3. Open **PowerShell** or **Command Prompt** inside that folder:
   ```powershell
   cd C:\whatsapp-bot
   docker compose up -d --build
   ```
4. Access `http://localhost:3000` in Chrome/Edge.

---

### Option B: Native Windows (Without Docker)

#### 1. Install Node.js
Download and install **Node.js LTS (v20+)** from [nodejs.org](https://nodejs.org/). Check the box to install build tools.

#### 2. Install FFmpeg on Windows
FFmpeg is required for `.sticker` and media conversions:
- **Via winget (Easiest)**:
  ```powershell
  winget install Gyan.FFmpeg
  ```
- **Or Manual**:
  1. Download the FFmpeg release zip from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
  2. Extract it to `C:\ffmpeg`.
  3. Add `C:\ffmpeg\bin` to your Windows **System Environment PATH**.
  4. Verify in a new Command Prompt by running `ffmpeg -version`.

#### 3. Install & Start the Bot
Open Command Prompt / PowerShell in the bot folder:
```powershell
# Navigate to folder
cd C:\Users\YourUser\Downloads\whatsappbot-main

# Install dependencies
npm install

# Start the bot
npm start
```
Open your browser at `http://localhost:3000`.

---

## ☁️ Method 5: Production Live Server with Domain & SSL (Nginx)

To run your bot on a VPS (DigitalOcean, Hetzner, AWS, Linode, Contabo) with a custom domain (e.g. `https://bot.yourdomain.com`) and free SSL:

### Step 1: Point Your Domain DNS
Create an **A record** in your DNS provider (Cloudflare, Namecheap, GoDaddy):
- **Host**: `bot` (or `@`)
- **Points to**: `YOUR_VPS_PUBLIC_IP`

### Step 2: Install Nginx & Certbot on VPS
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 3: Configure Nginx Reverse Proxy
Create a new configuration file:
```bash
sudo nano /etc/nginx/sites-available/whatsapp-bot
```

Paste the following configuration (replace `bot.yourdomain.com` with your domain):

```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support for live logs & status
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Issue Free SSL Certificate with Let's Encrypt
```bash
sudo certbot --nginx -d bot.yourdomain.com
```
Choose the option to automatically redirect HTTP to HTTPS.

Your dashboard is now live and secure at:
👉 **`https://bot.yourdomain.com`**

---

## 📱 Multi-Account Management Guide

### 1. Connecting the First Account
1. Open the dashboard at `http://localhost:3000`.
2. Enter your phone number with country code (e.g., `923320000000`).
3. Click **"Get 8-Digit Pairing Code"** (or click **"Scan with QR Code"**).
4. On your phone: Open **WhatsApp → Linked Devices → Link a Device → Link with phone number instead**.
5. Type the 8-digit code shown on screen.
6. The account will immediately connect and show 🟢 **ONLINE**.

### 2. Linking Additional WhatsApp Accounts
1. Click the green **`+ Add WhatsApp`** button on the top accounts bar.
2. Enter the second phone number (e.g. `923465400131`).
3. Enter the pairing code on the second phone.
4. Both accounts will now run in parallel 24/7!

### 3. Switching & Deleting Accounts
- **Switch View**: Click any account pill to view its live uptime, details, or disconnect it.
- **Delete Account**: Click the **`✕`** icon on any account pill to delete its session slot and clear stored authentication keys.
- **Clean Inactive**: Click **`Clean Inactive`** to remove all unlinked or disconnected slots in 1 click.

---

## ❓ Troubleshooting & FAQs

### Q1: Pairing Code says "Timeout" or does not show on screen
- Make sure you entered the phone number with the full country code and without leading zeroes or `+` (e.g. `923320000000`, NOT `03320000000`).
- WhatsApp's servers occasionally throttle pairing code requests. If it fails, click **"Scan with QR Code"** as an instant alternative.

### Q2: FFmpeg Error when generating Stickers (`.sticker`)
- **If running Docker**: FFmpeg is already installed inside the container.
- **If running Non-Docker Linux**: Run `sudo apt install -y ffmpeg`.
- **If running Windows**: Run `winget install Gyan.FFmpeg` and restart your terminal.

### Q3: Port 3000 is already in use
- If another service is using port 3000:
  1. Open `.env` and change `PORT=3001`.
  2. If using Docker, update `docker-compose.yml` to `"3001:3001"`.
  3. Restart the bot.

### Q4: Will my WhatsApp session stay logged in after server reboot?
- **Yes!** The session keys are saved in `./auth/sessions/`. As long as you don't manually click Logout or Delete (`✕`), the bot will automatically reconnect without needing a QR scan or pairing code.

---

### 🛡️ License & Credits
Developed with ❤️ using **Baileys**, **Node.js**, and modern web standards. Built for privacy, speed, and 24/7 stability.
