#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Storylock — localnet one-shot launcher
#
# Usage:  bash scripts/localnet.sh
#
# What it does:
#   1. Starts solana-test-validator (fresh ledger)
#   2. Waits until the validator is ready
#   3. Builds & deploys the Anchor program
#   4. Reads the deployed program ID and patches .env files
#   5. Airdrops SOL to your default keypair
#   6. Starts backend + frontend concurrently
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LOCALNET_URL="http://127.0.0.1:8899"
LEDGER_DIR=".anchor/test-ledger"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[localnet]${NC} $*"; }
success() { echo -e "${GREEN}[localnet]${NC} $*"; }
warn()    { echo -e "${YELLOW}[localnet]${NC} $*"; }
err()     { echo -e "${RED}[localnet] ERROR:${NC} $*" >&2; }

# ── Cleanup on exit ───────────────────────────────────────────────────────────
VALIDATOR_PID=""
cleanup() {
  if [[ -n "$VALIDATOR_PID" ]]; then
    info "Stopping solana-test-validator (PID $VALIDATOR_PID)..."
    kill "$VALIDATOR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ── Check prereqs ─────────────────────────────────────────────────────────────
for cmd in solana anchor node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    err "'$cmd' not found. Please install it first."
    exit 1
  fi
done

# ── Step 1: Start validator ───────────────────────────────────────────────────
info "Starting solana-test-validator (fresh ledger at $LEDGER_DIR)..."
mkdir -p "$(dirname "$LEDGER_DIR")"
solana-test-validator \
  --reset \
  --ledger "$LEDGER_DIR" \
  --quiet &
VALIDATOR_PID=$!
info "Validator PID: $VALIDATOR_PID"

# ── Step 2: Wait for validator ────────────────────────────────────────────────
info "Waiting for validator to be ready..."
ATTEMPTS=0
until solana cluster-version --url "$LOCALNET_URL" &>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge 30 ]]; then
    err "Validator did not start within 30 seconds."
    exit 1
  fi
  sleep 1
done
success "Validator is ready."

# ── Step 3: Build & deploy ────────────────────────────────────────────────────
info "Building Anchor program..."
anchor build

info "Deploying to localnet..."
anchor deploy --provider.cluster localnet 2>&1 | tee /tmp/anchor-deploy.log

# Extract program ID from deploy output
PROGRAM_ID=$(grep -oE '[A-Za-z0-9]{32,44}' /tmp/anchor-deploy.log | tail -1 || true)
if [[ -z "$PROGRAM_ID" ]]; then
  # Fall back to reading from the keypair
  KEYPAIR_FILE="target/deploy/storylock-keypair.json"
  if [[ -f "$KEYPAIR_FILE" ]]; then
    PROGRAM_ID=$(solana-keygen pubkey "$KEYPAIR_FILE")
  fi
fi

if [[ -n "$PROGRAM_ID" ]]; then
  success "Program deployed: $PROGRAM_ID"

  # Patch env files with real program ID
  sed -i.bak "s/PROGRAM_ID=.*/PROGRAM_ID=$PROGRAM_ID/" backend/.env
  sed -i.bak "s/VITE_PROGRAM_ID=.*/VITE_PROGRAM_ID=$PROGRAM_ID/" app/.env.local
  # Also patch Anchor.toml
  sed -i.bak "s/storylock = \"STRY.*/storylock = \"$PROGRAM_ID\"/" Anchor.toml
  success "Patched PROGRAM_ID in backend/.env, app/.env.local, Anchor.toml"
else
  warn "Could not auto-detect PROGRAM_ID. Update backend/.env and app/.env.local manually."
fi

# ── Step 4: Airdrop SOL ───────────────────────────────────────────────────────
WALLET_ADDR=$(solana address --url "$LOCALNET_URL" 2>/dev/null || true)
if [[ -n "$WALLET_ADDR" ]]; then
  info "Airdropping 100 SOL to $WALLET_ADDR..."
  solana airdrop 100 "$WALLET_ADDR" --url "$LOCALNET_URL" || warn "Airdrop failed (you may already have enough)"
  success "Balance: $(solana balance "$WALLET_ADDR" --url "$LOCALNET_URL")"
fi

# ── Step 5: Install deps if needed ───────────────────────────────────────────
if [[ ! -d "app/node_modules" ]]; then
  info "Installing app dependencies..."
  npm install --workspace=app
fi
if [[ ! -d "backend/node_modules" ]]; then
  info "Installing backend dependencies..."
  npm install --workspace=backend
fi

# ── Step 6: Start backend + frontend ─────────────────────────────────────────
success "Launching backend (port 4000) and frontend (port 3000)..."
echo ""
echo -e "  ${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:4000"
echo -e "  ${GREEN}Solana:${NC}   $LOCALNET_URL"
echo -e "  ${GREEN}Explorer:${NC} http://localhost:3000 (localnet — use solana explorer with custom RPC)"
echo ""

npm run dev
