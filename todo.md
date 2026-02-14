# OpenClaw Deployer TODO

## Core Architecture
- [x] Basic 3-step wizard (Bot Basics → Personality → Channels)
- [x] Bot CRUD operations (create, list, delete)
- [x] Switch from PostgreSQL to MySQL/TiDB (Manus DB is MySQL-compatible)
- [x] Update drizzle schema to use mysqlTable instead of pgTable
- [x] Update db.ts to use mysql2 drizzle driver
- [x] Add messages table for chat history
- [x] Railway deployment with auto-deploy from GitHub

## Deploy/Activate System
- [x] Replace process-based deployment with LLM-based bot activation
- [x] Deploy button = Activate bot (uses Manus built-in LLM)
- [x] Bot status management (stopped → running via DB flag)
- [x] Remove Docker/process spawning code (not needed for Manus hosting)
- [x] Fix deployment router (remove getStatus, keep deploy/start/stop/restart/logs)

## In-App Chat Interface
- [x] Create chat page component with message bubbles
- [x] Add chat route /chat/:botId
- [x] Connect chat to Manus built-in LLM with bot's system prompt
- [x] Store message history in database
- [x] Add chat button to dashboard bot cards
- [x] Suggested prompts for new conversations
- [x] Clear chat history button

## UI/Design (Lobster.cash Style)
- [x] Orange/lime color scheme
- [x] Dashed border cards
- [x] Clean minimalist layout
- [x] Google Fonts (Inter) loaded via index.html
- [x] Fix CSS @import order warning
- [x] Responsive grid layout for bot cards
- [x] Better bot cards with status indicators

## Testing
- [x] Fix auth.logout test (sameSite: lax not none)
- [x] Fix deployment test (remove getStatus, test deploy/stop)
- [x] Fix bots test (remove unauthorized access test, add NOT_FOUND test)
- [x] Add chat functionality tests (9 tests)
- [x] All 20 tests passing across 4 test files

## GitHub Integration
- [x] Push to f-o-x11/openclaw-deployer repository

## Future Enhancements
- [ ] Real-time typing indicators
- [ ] WhatsApp QR Code Integration
- [ ] Telegram Integration
- [ ] Mobile responsive improvements
- [ ] Improve landing/dashboard design
- [ ] Add proper navigation

## Completed (Previous)
- [x] Remove authentication (public access)
- [x] Fix PostgreSQL .returning() for inserts
- [x] Remove confirm() dialogs
- [x] Deploy to Railway
- [x] Push to GitHub
