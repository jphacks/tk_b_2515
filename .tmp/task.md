# Agora WebRTC Implementation Tasks

## Phase 1: Backend Implementation

- [ ] 1.1 Install Agora token builder package in backend
  - `npm install agora-token`
- [ ] 1.2 Create Agora routes module (`backend/src/routes/modules/agora.routes.ts`)
  - POST `/token` endpoint
  - Input validation (channelName, userId, role)
  - Token generation with 24h expiry
- [ ] 1.3 Add Agora routes to main API router
  - Mount at `/api/agora`
- [ ] 1.4 Add environment variables
  - `AGORA_APP_ID` in `.env`
  - `AGORA_APP_CERTIFICATE` in `.env`
  - Update `.env.example`
- [ ] 1.5 Test token generation endpoint with curl/Postman

## Phase 2: Frontend Implementation

- [ ] 2.1 Install Agora SDK in frontend
  - `npm install agora-rtc-sdk-ng`
- [ ] 2.2 Create Agora utility hooks
  - `frontend/src/hooks/useAgoraClient.ts` - client initialization
  - `frontend/src/hooks/useAgoraCall.ts` - call management
- [ ] 2.3 Update session page to use Agora
  - Import Agora SDK and hooks
  - Fetch token from backend API
  - Replace WebRTC connection logic with Agora client
  - Handle local/remote tracks with Agora methods
  - Update connection status based on Agora events
- [ ] 2.4 Update test-call page
  - Remove localStorage-based connection monitoring (optional)
  - Agora handles connection state internally
- [ ] 2.5 Update config to expose Agora App ID
  - Add `NEXT_PUBLIC_AGORA_APP_ID` to frontend config

## Phase 3: Cleanup

- [ ] 3.1 Remove WebSocket signaling server
  - Delete `backend/src/services/signaling-node.ts`
  - Remove SignalingServer initialization from `backend/src/server.ts`
- [ ] 3.2 Remove WebSocket dependencies
  - Remove `ws` package from `backend/package.json`
  - Run `npm install` to update lock file
- [ ] 3.3 Update documentation
  - Update README if it mentions WebSocket setup
  - Add Agora setup instructions

## Phase 4: Testing

- [ ] 4.1 Test in development environment
  - User joins session
  - Partner joins session
  - Both see each other's video
  - Audio works both ways
  - Video/audio toggle works
  - Call duration tracking works
  - End call works correctly
- [ ] 4.2 Test error scenarios
  - Camera/microphone permission denied
  - Network disconnection
  - One participant leaves unexpectedly
  - Invalid token (expired/wrong channel)
- [ ] 4.3 Test on mobile browsers
  - iOS Safari
  - Android Chrome
- [ ] 4.4 Deploy to production and verify
  - Cloudflare Workers deployment succeeds
  - Production sessions connect successfully
  - No console errors

## Phase 5: Deployment

- [ ] 5.1 Update Cloudflare Workers secrets
  - Add `AGORA_APP_ID` to Workers environment
  - Add `AGORA_APP_CERTIFICATE` to Workers environment
- [ ] 5.2 Update frontend environment variables
  - Set `NEXT_PUBLIC_AGORA_APP_ID` in Vercel/deployment platform
- [ ] 5.3 Deploy backend to Cloudflare Workers
- [ ] 5.4 Deploy frontend to production
- [ ] 5.5 Verify production deployment
  - Test session creation
  - Test video call connection
  - Monitor for errors in logs

## Notes
- Keep old WebSocket implementation commented out until Agora is fully tested
- Monitor Agora usage in dashboard to track free tier consumption
- Set up alerts if approaching free tier limit
