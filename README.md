# Syncthing Central

A centralized management dashboard for multiple distributed [Syncthing](https://syncthing.net) instances. Built with React, TypeScript, Vite, Tailwind CSS, and Zustand.

## Features

- 🖥️ **Multi-server management** — Add, edit, and remove Syncthing instances with API key auth
- 📊 **Real-time metrics** — CPU %, RAM, and sync progress polled automatically
- 📁 **Folder management** — Pause/Resume/Rescan folders per server or globally
- ⚠️ **Conflict detection** — Highlights folders with sync errors across all servers
- 🌑 **Dark mode first** — Glassmorphism card design with brand cyan palette
- 💾 **Persistent config** — Server list saved to `localStorage` (no backend required)

## Quick Install

### Linux / NAS (Synology, Proxmox, Ubuntu, etc.)
```bash
curl -fsSL https://raw.githubusercontent.com/mrose5736/SyncThingWebManager/main/install.sh | bash
```
Or if you've cloned the repo:
```bash
chmod +x install.sh && ./install.sh
# Custom port:
PORT=8080 ./install.sh
```

### Windows (PowerShell)
```powershell
# Run from inside the cloned repo:
.\install.ps1

# Or with custom options:
.\install.ps1 -Port 8080 -InstallDir "D:\Apps\SyncthingCentral"
```

> **Note:** On first run, PowerShell may require you to allow script execution:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Development

## Adding a Server

1. Click **Add Server** in the dashboard or sidebar
2. Enter the Syncthing GUI URL (e.g. `http://192.168.1.100:8384`)
3. Enter the **API Key** (found in Syncthing → Actions → Settings → API Key)
4. Click **Test Connection** to verify, then **Add Server**

## CORS Requirement

Syncthing must have **Allow Cross-Origin Requests** enabled for the browser to connect:

1. Open Syncthing GUI
2. Go to **Actions → Settings → GUI**
3. Enable **Allow Cross-Origin Requests**
4. Save and restart Syncthing

## Project Structure

```
src/
├── components/          # UI components
│   ├── ServerCard.tsx   # Per-server metrics card
│   ├── GlobalActionBar.tsx
│   ├── AddServerDialog.tsx
│   ├── ConflictViewer.tsx
│   └── ServerStatusBadge.tsx
├── layouts/
│   └── AppLayout.tsx    # Sidebar + main area
├── lib/
│   ├── syncthingApi.ts  # Typed REST API client
│   ├── apiError.ts      # Error types
│   └── utils.ts         # Helpers
├── pages/
│   ├── Dashboard.tsx
│   ├── ServerDetail.tsx
│   └── Settings.tsx
├── store/
│   └── serverStore.ts   # Zustand store + polling
└── types/
    └── syncthing.ts     # All TypeScript interfaces

```

## Security

API keys are stored in `localStorage`. This is appropriate for a self-hosted, personal deployment. Do not expose this app publicly without adding additional authentication.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v3 |
| State | Zustand v5 |
| Routing | React Router v6 |
| Icons | Lucide React |

## License

MIT
