#!/usr/bin/env bash
# Shehnai.AI one-shot launcher
# - Installs Python + Node deps (first run only, cached afterwards)
# - Builds the React frontend
# - Starts the unified backend that serves the API + React on a single port
#
# Usage:
#   ./start.sh              # uses default port 8000
#   PORT=5050 ./start.sh    # override port
#   ./start.sh --rebuild    # force rebuild frontend even if build/ exists
#   ./start.sh --clean      # wipe node_modules + build and reinstall
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"
REBUILD=0
CLEAN=0
for arg in "$@"; do
    case "$arg" in
        --rebuild) REBUILD=1 ;;
        --clean)   CLEAN=1; REBUILD=1 ;;
        -h|--help)
            grep -E '^# ' "$0" | sed 's/^# //'
            exit 0
            ;;
    esac
done

log()  { printf '\033[1;35m[shehnai]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[shehnai]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[shehnai]\033[0m %s\n' "$*" >&2; }

# ---------- sanity checks ----------
command -v python3 >/dev/null || { err "python3 not found. Install Python 3.10+."; exit 1; }
command -v npm     >/dev/null || { err "npm not found. Install Node 18+."; exit 1; }

# ---------- free the port ----------
if lsof -Pi ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Port $PORT is in use. Killing existing listener(s)..."
    lsof -ti ":$PORT" | xargs -r kill -9 || true
    sleep 1
fi

# ---------- python deps ----------
PY_STAMP=".venv-deps.stamp"
PY_REQS=(fastapi uvicorn flask flask-cors requests python-dotenv beautifulsoup4 textblob aiohttp)
need_py_install=0
if [ ! -f "$PY_STAMP" ]; then
    need_py_install=1
else
    for pkg in "${PY_REQS[@]}"; do
        python3 -c "import importlib, sys; sys.exit(0 if importlib.util.find_spec('${pkg//-/_}') else 1)" \
            2>/dev/null || { need_py_install=1; break; }
    done
fi
if [ "$need_py_install" -eq 1 ]; then
    log "Installing Python dependencies..."
    if python3 -m pip install --upgrade "${PY_REQS[@]}" 2>/dev/null; then
        :
    else
        warn "Standard pip install failed; retrying with --break-system-packages"
        python3 -m pip install --break-system-packages --upgrade "${PY_REQS[@]}"
    fi
    date > "$PY_STAMP"
else
    log "Python dependencies already installed (delete $PY_STAMP to force)."
fi

# ---------- frontend deps + build ----------
FRONT_DIR="react-frontend"
if [ ! -d "$FRONT_DIR" ]; then
    err "react-frontend/ directory missing"
    exit 1
fi

if [ "$CLEAN" -eq 1 ]; then
    log "Cleaning node_modules and build/..."
    rm -rf "$FRONT_DIR/node_modules" "$FRONT_DIR/build"
fi

if [ ! -d "$FRONT_DIR/node_modules" ]; then
    log "Installing frontend dependencies (this may take a minute)..."
    (cd "$FRONT_DIR" && npm install --no-audit --no-fund)
else
    log "Frontend node_modules already present."
fi

if [ "$REBUILD" -eq 1 ] || [ ! -d "$FRONT_DIR/build" ]; then
    log "Building React frontend..."
    (cd "$FRONT_DIR" && npm run build)
else
    log "Using existing frontend build (pass --rebuild to force)."
fi

# ---------- launch ----------
log "Starting unified server on http://localhost:$PORT"
log "  • App:    http://localhost:$PORT/"
log "  • Health: http://localhost:$PORT/health"
log "  • Docs:   http://localhost:$PORT/api/docs"
echo
PORT="$PORT" HOST="$HOST" exec python3 unified_wedding_server.py
