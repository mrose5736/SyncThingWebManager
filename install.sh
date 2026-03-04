#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Syncthing Central — Linux Install Script
#  Installs the app, builds the frontend, and sets it up as a persistent
#  PM2 service that survives reboots.
#
#  Usage:
#    chmod +x install.sh && ./install.sh
#
#  Optional env vars:
#    PORT=8080 ./install.sh        # Change the port (default: 3001)
#    REPO_URL=https://...          # Override git clone URL
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
APP_NAME="syncthing-central"
APP_DIR="${INSTALL_DIR:-/opt/syncthing-central}"
PORT="${PORT:-3001}"
NODE_MIN_VERSION=18
REPO_URL="${REPO_URL:-https://github.com/mrose5736/SyncThingWebManager.git}"
PM2_SERVICE_NAME="$APP_NAME"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✔${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "${RED}✘ ERROR:${RESET} $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}━━━━ $* ━━━━${RESET}\n"; }

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  warn "Not running as root. Some steps (PM2 startup) may need 'sudo'."
fi

header "Syncthing Central Installer"
echo -e "  ${BOLD}App directory:${RESET} $APP_DIR"
echo -e "  ${BOLD}Port:${RESET}          $PORT"
echo -e "  ${BOLD}PM2 name:${RESET}      $PM2_SERVICE_NAME"
echo ""

# ── 1. Check / install Node.js ────────────────────────────────────────────────
header "1/5  Checking Node.js"

install_node() {
  info "Installing Node.js v20 LTS..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    dnf install -y nodejs npm
  elif command -v yum &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  elif command -v pacman &>/dev/null; then
    pacman -Sy --noconfirm nodejs npm
  else
    error "Cannot auto-install Node.js. Please install Node.js v${NODE_MIN_VERSION}+ manually: https://nodejs.org"
  fi
}

if ! command -v node &>/dev/null; then
  warn "Node.js not found."
  install_node
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]]; then
  warn "Node.js v$NODE_VERSION found — need v$NODE_MIN_VERSION+."
  install_node
fi

success "Node.js $(node --version) found"

# ── 2. Check / install git ────────────────────────────────────────────────────
header "2/5  Checking Git"

if ! command -v git &>/dev/null; then
  info "Installing git..."
  if command -v apt-get &>/dev/null; then apt-get install -y git
  elif command -v dnf &>/dev/null; then dnf install -y git
  elif command -v yum &>/dev/null; then yum install -y git
  elif command -v pacman &>/dev/null; then pacman -Sy --noconfirm git
  else error "Please install git manually."; fi
fi

success "git $(git --version | awk '{print $3}') found"

# ── 3. Clone or update the repo ───────────────────────────────────────────────
header "3/5  Fetching Source Code"

if [[ -d "$APP_DIR/.git" ]]; then
  info "Repository already exists — pulling latest changes..."
  git -C "$APP_DIR" pull --ff-only
  success "Repository updated"
else
  info "Cloning into $APP_DIR ..."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
  success "Repository cloned"
fi

cd "$APP_DIR"

# ── 4. Install dependencies and build ─────────────────────────────────────────
header "4/5  Installing Dependencies & Building"


info "Running npm install..."
# npm 7+ includes devDependencies by default; --include=dev is explicit for clarity
npm install --include=dev

# Ensure locally installed binaries (tsc, vite) are on PATH — critical on some
# Linux systems where the shell doesn't inherit node_modules/.bin automatically.
export PATH="$APP_DIR/node_modules/.bin:$PATH"

info "Building frontend (this may take ~30s)..."
NODE_ENV=production npm run build

success "Build complete — dist/ is ready"

# ── 5. Set up PM2 ─────────────────────────────────────────────────────────────
header "5/5  Setting Up PM2 Service"

if ! command -v pm2 &>/dev/null; then
  info "Installing PM2 globally..."
  npm install -g pm2
fi

success "PM2 $(pm2 --version) found"

# Create PM2 ecosystem config
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: '${PM2_SERVICE_NAME}',
    script: '${APP_DIR}/proxy-server.mjs',
    cwd: '${APP_DIR}',
    env: {
      PORT: '${PORT}',
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
    },
    restart_delay: 3000,
    max_restarts: 10,
    watch: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
EOF

# Stop existing instance if running
pm2 delete "$PM2_SERVICE_NAME" 2>/dev/null || true

# Start fresh
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save

# Set up startup script (survives reboots)
info "Configuring PM2 to start on boot..."
STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo env" || true)
if [[ -n "$STARTUP_CMD" ]]; then
  warn "Run the following command to enable boot auto-start:"
  echo -e "\n  ${YELLOW}${STARTUP_CMD}${RESET}\n"
else
  success "PM2 startup configured"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Syncthing Central installed successfully!${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Get local IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "<server-ip>")

echo -e "  ${BOLD}Local:${RESET}   http://localhost:${PORT}"
echo -e "  ${BOLD}Network:${RESET} http://${LOCAL_IP}:${PORT}"
echo ""
echo -e "  ${BOLD}Useful commands:${RESET}"
echo -e "    pm2 status                  # Check service status"
echo -e "    pm2 logs ${PM2_SERVICE_NAME}   # View logs"
echo -e "    pm2 restart ${PM2_SERVICE_NAME} # Restart"
echo -e "    pm2 stop ${PM2_SERVICE_NAME}    # Stop"
echo ""
echo -e "  ${BOLD}To update later:${RESET}"
echo -e "    cd ${APP_DIR} && git pull && npm install && npm run build && pm2 restart ${PM2_SERVICE_NAME}"
echo ""
