<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="120" alt="WhatsApp Logo"/>
  
  # 🍕 Cravey-Crust-bot & Automation Gateway
  
  **A premium, multi-account WhatsApp automation platform powered by Baileys, integrated seamlessly with n8n and AI.**

  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Baileys](https://img.shields.io/badge/Baileys-v6.7+-25D366?logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
  [![n8n](https://img.shields.io/badge/n8n-Ready-FF6600?logo=n8n&logoColor=white)](https://n8n.io)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

---

## 🌟 Welcome to the Future of WhatsApp Automation

**Cravey-Crust-bot** is not just a chatbot—it is a full-fledged WhatsApp microservice and automation gateway. Whether you are running a pizza shop, a customer support desk, or a personal AI assistant, this bot provides the ultimate bridge between your WhatsApp accounts and your backend workflows.

Built on the lightning-fast **Baileys WebSocket API**, it bypasses the need for official Cloud API limits, offering a completely independent, stealthy, and feature-rich WhatsApp engine.

---

## 🔥 Signature Features

### 📍 Intelligent Location Routing
- **Current & Live Locations:** Automatically detects WhatsApp location pins and live location streams.
- **Google Maps Integration:** Instantly converts coordinates into Google Maps URLs.
- **URL Extraction:** Identifies Google Maps links dropped in plain text.
- **Workflow Ready:** Forwards highly structured location payloads directly to your CRM or n8n workflow for seamless delivery tracking.

### 🤖 n8n Bi-Directional Webhook Bridge
Turn WhatsApp into a dynamic frontend for your low-code workflows.
- **Inbound:** Forwards customer messages, locations, and media directly to your `N8N_WEBHOOK_URL`.
- **Outbound:** A dedicated REST endpoint (`/api/n8n/send-message`) allows n8n to send AI-generated replies, receipts, and updates back to the customer.
- **Stealth Mode:** Automatically ignores owner commands and bot replies to prevent infinite webhook loops.

### 💻 Glassmorphism Web Dashboard
Manage your bot like a pro with a stunning, modern UI.
- **No QR Code Needed:** Connect instantly using an **8-Digit Pairing Code** directly to your phone number.
- **Multi-Account:** Run 2, 3, or more WhatsApp numbers on the same server.
- **Live Terminal:** Watch real-time bot activity, errors, and webhook dispatches from your browser.


## 🚀 Quick Start

Getting started is incredibly easy. The bot is fully Dockerized for production.

### Using Docker (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/workwithasim/Cravey-Crust-bot.git
cd Cravey-Crust-bot

# 2. Configure your environment
cp .env.example .env
nano .env # Add your Phone Number and n8n Webhook URL

# 3. Launch the platform
docker compose up -d --build
```
Once running, open **`http://localhost:3000`** in your browser to access the Web Dashboard and link your WhatsApp!

> 📘 **Detailed Installation:** Need to run without Docker, on Windows, or via Portainer? \
> Check out the complete **[Installation & Deployment Guide](INSTALLATION_GUIDE.md)**.

---

## 🏗️ Architecture Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js (ESM)** | Core runtime environment (v20+ recommended) |
| **Baileys (v6.7)** | WhatsApp Web Socket Protocol emulation |
| **Express.js** | Web dashboard backend and API endpoints |
| **FFmpeg & Sharp** | High-performance media transcoding (Stickers & Audio) |
| **Docker** | Containerized deployment and process isolation |

---

## 🔐 Privacy & Security First
- **No Third-Party Tracking:** Your session keys stay locally on your server in the `auth/` directory.
- **Stealth Output:** Bot commands and error logs are sent *only* to the owner's private chat.
- **Secure Webhooks:** n8n communications are protected by an `X-Bot-Secret` cryptographic header.

---
<div align="center">
  <i>Crafted for high-performance automation and premium customer experiences.</i>
</div>
