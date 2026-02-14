# OpenClaw Deployer - Real Deployment System

## REBUILD: Real OpenClaw Instance Deployment

### UI Redesign (Lobster.cash Minimalist Style)
- [x] Remove all gradient backgrounds - use solid white/light gray
- [x] Simplify buttons - solid orange, no gradients
- [x] Remove decorative icons and badges
- [x] Increase whitespace significantly
- [x] Use dashed borders (lime green) for cards
- [x] Simplify navigation - minimal header
- [x] Clean up wizard - remove visual clutter
- [x] Simplify dashboard - basic list view
- [x] Remove chat interface (not needed for deployment tool)

### Backend - Real OpenClaw Process Management
- [ ] Install OpenClaw detection/setup script
- [ ] Child process spawning for OpenClaw gateway instances
- [ ] Port allocation system (assign unique ports per bot)
- [ ] Process ID tracking in database
- [ ] Process health monitoring
- [ ] Auto-restart on crash
- [ ] Process cleanup on bot deletion
- [ ] Log aggregation from OpenClaw stdout/stderr
- [ ] Configuration file generation (openclaw.json per instance)
- [ ] Environment variable injection per instance

### OpenClaw Configuration Generator
- [ ] Generate valid openclaw.json files
- [ ] Inject bot personality into system prompts
- [ ] Configure messaging channels (WhatsApp, Telegram)
- [ ] Set up gateway port and host
- [ ] Configure model preferences
- [ ] Set security policies
- [ ] Generate channel-specific tokens/credentials

### Bot Lifecycle Management
- [ ] Start bot - spawn OpenClaw process
- [ ] Stop bot - gracefully terminate process
- [ ] Restart bot - stop and start sequence
- [ ] Delete bot - cleanup process and files
- [ ] View logs - aggregate from process output
- [ ] Monitor status - check process health

### Database Schema Updates
- [x] Add processId field to bots table
- [x] Add port field to bots table
- [x] Add configPath field to bots table
- [x] Add logs table for process output
- [x] Remove chat_messages table (not needed)
- [x] Update status tracking for process states

### Simplified Wizard (3 Steps)
- [x] Step 1: Bot basics (name, description)
- [x] Step 2: Personality configuration
- [x] Step 3: Channel selection (WhatsApp/Telegram)
- [x] Remove owner details step (not needed)
- [x] Simplify form fields
- [x] Clean validation

### Dashboard Redesign
- [x] Simple list of bots
- [x] Status indicators (running/stopped/crashed)
- [x] Basic actions (start/stop/restart/delete)
- [x] View logs button
- [x] Remove analytics/charts
- [x] Minimal styling

### Testing & Deployment
- [ ] Test OpenClaw installation detection
- [ ] Test process spawning
- [ ] Test port allocation
- [ ] Test process monitoring
- [ ] Test auto-restart
- [ ] Test configuration generation
- [x] Write vitest tests
- [ ] Create deployment checkpoint
- [ ] Document Node.js ≥22 requirement
