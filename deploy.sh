#!/bin/bash
# Deploy KHUB frontend to Cloudflare Pages.
# The Supabase edge-function step is gone: the backend is the Rust API on
# api.khub.com.ng and owns email, escrow and realtime itself.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying KHUB frontend${NC}\n"

cd "$(dirname "$0")/frontend" || exit 1

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Typechecking...${NC}"
npx tsc --noEmit -p tsconfig.json

echo -e "${YELLOW}Testing...${NC}"
npm test

echo -e "${YELLOW}Building...${NC}"
npm run build

# SPA routing: every path falls through to index.html
echo -e "${YELLOW}Writing SPA redirects...${NC}"
echo "/* /index.html 200" > dist/_redirects

echo -e "${YELLOW}Checking every backend route has a screen...${NC}"
node scripts/route-audit.mjs | tail -5

echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=khub --branch=main

echo -e "\n${GREEN}Done. KHUB frontend is live on khub.com.ng${NC}"
echo "Backend: https://api.khub.com.ng (Rust · Loco · SQLite · Flutterwave)"
