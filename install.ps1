#Requires -Version 5.1
<#
.SYNOPSIS
    Syncthing Central — Windows Install Script

.DESCRIPTION
    Installs Syncthing Central, builds the frontend, and registers it as a
    persistent PM2 service that starts with Windows.

.PARAMETER Port
    Port to run the server on (default: 3001)

.PARAMETER InstallDir
    Directory to install the app (default: C:\SyncthingCentral)

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Port 8080 -InstallDir "D:\Apps\SyncthingCentral"
#>

param(
    [int]$Port = 3001,
    [string]$InstallDir = "C:\SyncthingCentral",
    [string]$RepoUrl = "https://github.com/mrose5736/SyncThingWebManager.git"
)

$ErrorActionPreference = "Stop"
$PM2_SERVICE_NAME = "syncthing-central"
$NODE_MIN = 18

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Step([string]$msg)    { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Success([string]$msg) { Write-Host "✔ $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)    { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg)    { Write-Host "✘ $msg" -ForegroundColor Red; exit 1 }

function Command-Exists([string]$cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Syncthing Central — Windows Installer" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Install dir : $InstallDir"
Write-Host "  Port        : $Port"
Write-Host "  PM2 name    : $PM2_SERVICE_NAME"
Write-Host ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
Write-Step "1/5  Checking Node.js"

if (-not (Command-Exists "node")) {
    Write-Warn "Node.js not found. Attempting install via winget..."
    if (Command-Exists "winget") {
        winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + `
                    [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-Fail "Please install Node.js v$NODE_MIN+ from https://nodejs.org and re-run this script."
    }
}

$nodeVer = (node -e "process.stdout.write(process.versions.node.split('.')[0])")
if ([int]$nodeVer -lt $NODE_MIN) {
    Write-Fail "Node.js v$nodeVer found — need v$NODE_MIN+. Please update: https://nodejs.org"
}

Write-Success "Node.js $(node --version)"

# ── 2. Check Git ──────────────────────────────────────────────────────────────
Write-Step "2/5  Checking Git"

if (-not (Command-Exists "git")) {
    Write-Warn "Git not found. Attempting install via winget..."
    if (Command-Exists "winget") {
        winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + `
                    [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-Fail "Please install Git from https://git-scm.com and re-run this script."
    }
}

Write-Success "Git $(git --version)"

# ── 3. Clone or update repo ───────────────────────────────────────────────────
Write-Step "3/5  Fetching Source Code"

if (Test-Path "$InstallDir\.git") {
    Write-Host "  Repository exists — pulling latest changes..."
    git -C $InstallDir pull --ff-only
    Write-Success "Repository updated"
} else {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    # If running from inside the repo already, copy instead of clone
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (Test-Path "$scriptDir\package.json") {
        Write-Host "  Detected local source — copying to $InstallDir..."
        Copy-Item "$scriptDir\*" -Destination $InstallDir -Recurse -Force -Exclude @("node_modules","dist",".git")
        Write-Success "Source copied"
    } else {
        Write-Host "  Cloning from $RepoUrl..."
        git clone $RepoUrl $InstallDir
        Write-Success "Repository cloned"
    }
}

Set-Location $InstallDir

# ── 4. Install deps + build ───────────────────────────────────────────────────
Write-Step "4/5  Installing Dependencies & Building"

Write-Host "  Running npm install..."
npm install --production=false
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed" }

Write-Host "  Building frontend (~30s)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "npm run build failed" }

Write-Success "Build complete — dist\ ready"

# ── 5. Set up PM2 ────────────────────────────────────────────────────────────
Write-Step "5/5  Setting Up PM2 Service"

if (-not (Command-Exists "pm2")) {
    Write-Host "  Installing PM2 globally..."
    npm install -g pm2
    npm install -g pm2-windows-startup
}

Write-Success "PM2 $(pm2 --version)"

# Write PM2 ecosystem config
$ecosystemPath = "$InstallDir\ecosystem.config.cjs"
@"
module.exports = {
  apps: [{
    name: '$PM2_SERVICE_NAME',
    script: '$($InstallDir.Replace('\','\\'))\proxy-server.mjs',
    cwd: '$($InstallDir.Replace('\','\\'))',
    env: {
      PORT: '$Port',
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
    },
    restart_delay: 3000,
    max_restarts: 10,
    watch: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
"@ | Set-Content $ecosystemPath -Encoding UTF8

# Remove old PM2 instance if present
pm2 delete $PM2_SERVICE_NAME 2>$null

# Start the app
pm2 start $ecosystemPath
pm2 save

# Register as Windows startup service
if (Command-Exists "pm2-startup") {
    Write-Host "  Registering PM2 Windows startup..."
    pm2-startup install
    Write-Success "PM2 will start automatically with Windows"
} else {
    Write-Warn "Optional: run 'npm install -g pm2-windows-startup && pm2-startup install' to auto-start on boot."
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Syncthing Central installed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Get local IP
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress

Write-Host "  Local:   http://localhost:$Port" -ForegroundColor White
Write-Host "  Network: http://${localIp}:$Port" -ForegroundColor White
Write-Host ""
Write-Host "  Useful PM2 commands:" -ForegroundColor Gray
Write-Host "    pm2 status                          # Check service"
Write-Host "    pm2 logs $PM2_SERVICE_NAME                 # View logs"
Write-Host "    pm2 restart $PM2_SERVICE_NAME              # Restart"
Write-Host "    pm2 stop $PM2_SERVICE_NAME                 # Stop"
Write-Host ""
Write-Host "  To update later:" -ForegroundColor Gray
Write-Host "    cd $InstallDir; git pull; npm install; npm run build; pm2 restart $PM2_SERVICE_NAME"
Write-Host ""

# Offer to open in browser
$open = Read-Host "Open in browser now? [Y/n]"
if ($open -ne "n" -and $open -ne "N") {
    Start-Process "http://localhost:$Port"
}
