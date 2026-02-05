#!/bin/bash

# OpenClaw Arena - Initial Setup Script
# Run this once to set up the repository structure

set -e

echo "🏗️  Setting up OpenClaw Arena repository..."
echo ""

# Create directory structure
echo "📁 Creating directories..."
mkdir -p code/{backend,frontend,plugin,shared}
mkdir -p docs
mkdir -p handoffs
mkdir -p reviews
mkdir -p tasks/{open,in-progress,done}

# Move existing files to correct locations
echo "📝 Moving initial files..."
if [ -f "INITIAL_TASKS.md" ]; then
    mv INITIAL_TASKS.md docs/
fi

# Create .gitignore
echo "🔒 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/
out/

# Database
*.db
*.db-journal

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Secrets (NEVER commit)
*.key
*.pem
private_keys/

# Plugin config (contains private keys)
.arena-keys.json

# Testing
coverage/

# Misc
.turbo/
EOF

# Create README if doesn't exist
if [ ! -f "README.md" ]; then
    echo "📄 Creating README..."
    cat > README.md << 'EOF'
# OpenClaw Arena

AI Bot Combat Platform - Privacy-preserving PvP battles with real stakes.

## Quick Start

### For Backend Developer

```bash
cd code/backend
# Follow instructions in tasks/open/001-backend-setup.md
```

### For Frontend Developer

```bash
cd code/frontend
# Follow instructions in tasks/open/002-frontend-setup.md
```

## Documentation

- [Initial Tasks](docs/INITIAL_TASKS.md) - Task list and timeline
- [API Contract](docs/API_CONTRACT.md) - REST API specification
- [WebSocket Events](docs/WEBSOCKET_EVENTS.md) - Real-time events
- [Architecture](docs/ARCHITECTURE.md) - System design

## Workflow

1. Pick a task from `tasks/open/`
2. Move it to `tasks/in-progress/` when starting
3. Commit work frequently
4. Create handoffs in `handoffs/` when blocking others
5. Move to `tasks/done/` when complete

## Communication

- **Async:** Git commits + handoffs folder
- **Sync:** Telegram for blockers only
- **Weekly:** Friday sync (15 min)

## Getting Started

Read and complete `tasks/open/000-contracts.md` together first!

🚀 Let's build!
EOF
fi

# Create empty handoff files
echo "💬 Creating handoff templates..."
cat > handoffs/to-backend.md << 'EOF'
# Messages for Backend Developer

(Add messages here when you need something from backend)

## Example:
- Auth API ready, can now build login UI
EOF

cat > handoffs/to-frontend.md << 'EOF'
# Messages for Frontend Developer

(Add messages here when you need something from frontend)

## Example:
- Please test the new /api/shop/items endpoint
EOF

# Create shared types file
echo "📦 Creating shared types..."
mkdir -p code/shared
cat > code/shared/types.ts << 'EOF'
// Shared TypeScript types for OpenClaw Arena
// Both backend and frontend import from here

export interface User {
  id: string
  username: string
  credits: number
  current_elo: number
  peak_elo: number
  total_matches: number
  wins: number
  losses: number
  created_at: string
}

export interface Bot {
  id: string
  user_id: string
  name: string
  level: number
  xp: number
  base_hp: number
  base_attack: number
  base_defense: number
  base_speed: number
  skin_id: string | null
  accessories: string[]
  created_at: string
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: 'skin' | 'accessory' | 'stat_boost' | 'emote' | 'effect'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  hp_bonus: number
  attack_bonus: number
  defense_bonus: number
  speed_bonus: number
  limited_edition: boolean
  stock_remaining: number | null
}

export interface Match {
  id: string
  bot1_id: string
  bot2_id: string
  winner_id: string | null
  rounds_fought: number
  duration_seconds: number
  match_type: string
  created_at: string
}

export interface CombatAction {
  match_id: string
  round: number
  bot_id: string
  action: 'attack' | 'defend' | 'skill'
  target: 'core' | 'armor' | 'processor'
  damage: number
  response_time: number
  timestamp: number
  nonce: string
}

export interface MatchEvent {
  round: number
  bot1_action: string
  bot2_action: string
  bot1_damage_dealt: number
  bot2_damage_dealt: number
  bot1_hp: number
  bot2_hp: number
}

// Add more types as needed...
EOF

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo "🎯 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial OpenClaw Arena setup"
    echo ""
    echo "✅ Git repository initialized"
    echo "   Next: Create remote repo and push"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Both developers: Read tasks/open/000-contracts.md"
echo "   2. Complete Task 000 together (define contracts)"
echo "   3. Backend dev: Start on task 001-backend-setup.md"
echo "   4. Frontend dev: Start on task 002-frontend-setup.md"
echo ""
echo "📚 Documentation:"
echo "   - docs/INITIAL_TASKS.md"
echo "   - docs/API_CONTRACT.md"
echo "   - docs/WEBSOCKET_EVENTS.md"
echo ""
echo "🚀 Happy building!"
