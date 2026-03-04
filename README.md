<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="Syncthing Central logo" />

# Syncthing Central

**A centralized management dashboard for multiple distributed [Syncthing](https://syncthing.net) instances.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

[Features](#-features) · [Install](#-install) · [Usage](#-adding-a-server) · [Development](#-development) · [Architecture](#-project-structure)

</div>

---

## ✨ Features

| | Feature |
|---|---|
| 🖥️ | **Multi-server dashboard** — Monitor unlimited Syncthing instances from one page |
| 📊 | **Live metrics** — CPU %, RAM, sync progress, uptime — polled on a configurable interval |
| 📁 | **Folder management** — Pause, Resume, and Rescan folders per-server or globally across all servers |
| ⚠️ | **Conflict & error detection** — Surfaces folders with pull errors across all servers |
| 🔀 | **CORS-free proxy** — Built-in Node.js proxy means no Syncthing config changes needed |
| 🌑 | **Dark-mode first** — Glassmorphism card design, animated status dots, brand gradient palette |
| 💾 | **Zero-config persistence** — Server list is saved to `localStorage`; no database or backend needed |
| 🔌 | **Detail drill-down** — Per-server view with folder sync bars, device connection table, and error list |

---

## 🚀 Install

### Linux / NAS (Synology, Proxmox, Ubuntu, Debian, etc.)

> Automatically installs Node.js 20 LTS, PM2, builds the app, and registers it as a boot-persistent service.

```bash
# One-liner (from GitHub):
curl -fsSL https://raw.githubusercontent.com/mrose5736/SyncThingWebManager/main/install.sh | bash

# Or from a cloned repo:
chmod +x install.sh && ./install.sh

# Custom port:
PORT=8080 ./install.sh
```

### Windows (PowerShell)

> Auto-installs Node.js via winget, builds, and sets up PM2 with Windows startup integration.

```powershell
# Allow scripts (one-time):
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Install (from inside the cloned repo):
.\install.ps1

# Custom options:
.\install.ps1 -Port 8080 -InstallDir "D:\Apps\SyncthingCentral"
```

### Manual (any platform)

```bash
git clone https://github.com/mrose5736/SyncThingWebManager.git
cd SyncThingWebManager
npm install
npm run build    # Build the frontend
npm start        # Serve on http://0.0.0.0:3001
```

After install, open the URL shown in the terminal from **any device on your network**:

```
✅ Syncthing Central running in PRODUCTION mode
🌐 Open from this machine:  http://localhost:3001
🌐 Open from your network:  http://10.20.99.132:3001
```

---

## 🔧 Adding a Server

1. Click **Add Server** in the dashboard header or the global action bar
2. Enter the **Syncthing GUI URL** — e.g. `http://192.168.1.100:8384`
3. Enter the **API Key** — found in Syncthing → Actions → Settings → API Key
4. Click **Test Connection** to verify the credentials live
5. Click **Add Server** — metrics start polling immediately

> Syncthing's API key is stored in your browser's `localStorage`. Suitable for self-hosted personal use.

---

## 🏗️ How It Works

```
Browser (any device on LAN)
      │  http://server-ip:3001
      ▼
┌─────────────────────────────────┐
│  Express Server  (port 3001)    │
│  ├── GET /          → dist/     │  ← Serves built React SPA
│  ├── GET /server/*  → dist/     │
│  └── POST /proxy               │  ← Forwards API calls to Syncthing
└────────────┬────────────────────┘
             │  Node.js fetch (no CORS)
    ┌────────┴──────────────────────────┐
    │  Syncthing REST API               │
    │  http://192.168.1.x:8384/rest/... │
    └───────────────────────────────────┘
```

The built-in proxy means **no changes to Syncthing's settings are needed** — the browser talks to `localhost`, and the proxy forwards requests server-to-server where CORS doesn't apply.

---

## 💻 Development

```bash
npm install
npm run dev       # Starts Vite (port 5173) + proxy (port 3001) concurrently
npm run typecheck # TypeScript check — 0 errors
npm run build     # Production build → dist/
npm start         # Production server on port 3001
```

| Script | Description |
|---|---|
| `npm run dev` | Hot-reload dev server + proxy (Vite :5173, proxy :3001) |
| `npm run build` | TypeScript check + Vite production bundle |
| `npm start` | Run production server (requires `dist/` to exist) |
| `npm run typecheck` | TypeScript type check without emitting |

**Custom port:**
```bash
PORT=8080 npm start
```

---

## 📁 Project Structure

```
SyncThingWebManager/
├── proxy-server.mjs         # Combined Express server (proxy + static serving)
├── install.sh               # Linux/NAS install script
├── install.ps1              # Windows PowerShell install script
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── types/
    │   └── syncthing.ts     # All TypeScript interfaces for Syncthing REST API
    ├── lib/
    │   ├── syncthingApi.ts  # Typed REST API client (SyncthingClient class)
    │   ├── apiError.ts      # SyncthingApiError with OFFLINE / AUTH / CORS types
    │   └── utils.ts         # formatBytes, formatUptime, calcSyncPercent, cn()
    ├── store/
    │   └── serverStore.ts   # Zustand store: multi-server state + polling + persistence
    ├── components/
    │   ├── ServerCard.tsx         # Live metrics card with expandable folder list
    │   ├── GlobalActionBar.tsx    # Cross-server Pause / Resume / Rescan All
    │   ├── AddServerDialog.tsx    # Add / edit server modal with live Test Connection
    │   ├── ConflictViewer.tsx     # Error folder detection with copy-path UI
    │   └── ServerStatusBadge.tsx  # Animated status pill component
    ├── layouts/
    │   └── AppLayout.tsx    # Collapsible sidebar with per-server status dots
    ├── pages/
    │   ├── Dashboard.tsx    # Responsive ServerCard grid + conflict alert
    │   ├── ServerDetail.tsx # Full server view: metrics, folders, devices, conflicts
    │   └── Settings.tsx     # Server list management, polling interval, CORS guide
    ├── App.tsx              # React Router v6 routes
    └── main.tsx             # Entry point
```

---

## 🔐 Security

| Concern | Detail |
|---|---|
| **API Key storage** | Stored in `localStorage`. Appropriate for a self-hosted, personal tool. Do not serve this app on a public network without adding authentication. |
| **Proxy exposure** | The proxy only forwards requests to URLs registered by the user in the UI. |
| **Network binding** | In production, the server binds to `0.0.0.0`. Restrict with a firewall if needed, or set `HOST=127.0.0.1 npm start` to limit to localhost only. |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | 5.7 |
| Build tool | Vite | 6 |
| Styling | Tailwind CSS | 3 |
| State management | Zustand | 5 |
| Routing | React Router | 6 |
| Server / proxy | Express | 5 |
| Icons | Lucide React | latest |
| Process manager | PM2 | latest |

---

## 📄 License

[MIT](LICENSE) © 2026 mrose5736
