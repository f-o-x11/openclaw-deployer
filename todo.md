# OpenClaw Deployer - Final Features Before Deployment

## WhatsApp QR Code Integration
- [x] Install whatsapp-web.js package
- [x] Create WhatsApp service for QR code generation
- [x] Add QR code endpoint to backend
- [ ] Display QR code in wizard Step 3
- [ ] Show pairing status updates
- [ ] Handle QR code refresh

## Bot Logs Viewer
- [x] Create logs viewer page component
- [x] Add logs route to App.tsx
- [x] Implement real-time log streaming from Docker
- [x] Add log filtering (stdout/stderr/system)
- [x] Add search functionality
- [x] Add auto-scroll toggle
- [x] Style logs with monospace font
- [x] Add "View Logs" button to dashboard

## GitHub & Railway Deployment
- [x] Initialize git repository
- [x] Create .gitignore file
- [x] Commit all changes
- [x] Push to GitHub (with user login)
- [x] Deploy to Railway
- [x] Configure environment variables
- [ ] Test live deployment

## Authentication System (Railway)
- [ ] Replace Manus OAuth with email/password authentication
- [ ] Create user registration endpoint
- [ ] Create login endpoint with JWT tokens
- [ ] Update frontend login form
- [ ] Add password hashing (bcrypt)
- [ ] Test authentication flow on Railway

## Railway Database Fix
- [ ] Replace PostgreSQL with MySQL on Railway
- [ ] Update DATABASE_URL environment variable
- [ ] Test database connection and migrations

## OpenClaw GitHub Integration
- [ ] Update deployment service to clone openclaw.ai GitHub repository
- [ ] Configure Docker deployment with bot personality settings from database
- [ ] Map bot configuration to OpenClaw config.yaml format
- [ ] Test actual OpenClaw deployment with real repository

## In-App Chat Interface
- [ ] Create chat page component with message UI
- [ ] Add real-time WebSocket message handling
- [ ] Connect chat to deployed bot instances via HTTP/WebSocket
- [ ] Add message history display and persistence
- [ ] Add chat route and navigation

## WhatsApp QR Code Integration (Complete)
- [ ] Complete QR code display in wizard Step 3
- [ ] Show pairing status updates in real-time
- [ ] Handle QR code refresh when expired
- [ ] Test end-to-end WhatsApp connection

## Remove Authentication (Priority - Do First)
- [x] Remove protectedProcedure from all tRPC routers
- [x] Remove auth middleware checks
- [x] Remove login/register pages and routes
- [x] Make dashboard default landing page
- [x] Remove auth context and useAuth hook usage
## Bug Fixes
- [ ] Fix Railway crash: "Failed to construct URL" from missing VITE_OAUTH_PORTAL_URL env var
- [ ] Make frontend handle missing OAuth env vars gracefully
