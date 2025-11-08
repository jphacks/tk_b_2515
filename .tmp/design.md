# Agora WebRTC Implementation Design

## Overview
Replace the current custom WebSocket signaling implementation with Agora RTC SDK to enable WebRTC video calls in production environment (Cloudflare Workers).

## Background
The current implementation uses Node.js WebSocket server (`ws` package) for WebRTC signaling, which does not work in Cloudflare Workers environment. This causes sessions to disconnect immediately in production.

## Requirements

### Functional Requirements
1. 1-to-1 video calling between user and partner
2. Audio/video toggle controls
3. Call duration tracking
4. Connection status monitoring
5. Graceful call termination

### Non-Functional Requirements
1. Works in Cloudflare Workers environment
2. Low latency (< 300ms for domestic connections)
3. Reliable connection establishment
4. Mobile browser support (iOS Safari, Android Chrome)

## Architecture

### Current Architecture
```
Frontend (Next.js)
  ↓ WebSocket
Backend (Node.js) - WebSocket Signaling Server
  ↓ (relay messages)
Frontend ←→ Frontend (WebRTC P2P)
```

### New Architecture (Agora)
```
Frontend (Next.js)
  ↓ HTTPS (get token)
Backend (Cloudflare Workers) - Agora Token Generator
  ↓ (returns RTC token)
Frontend
  ↓ Agora SDK
Agora Cloud (Global Infrastructure)
  ↓ WebRTC
Frontend ←→ Frontend (via Agora)
```

## Components

### Backend Changes
1. **Agora Token Generation API**
   - Endpoint: `POST /api/agora/token`
   - Input: `{ channelName, userId, role }`
   - Output: `{ token, appId }`
   - Uses Agora RTC Token Builder library

2. **Environment Variables**
   - `AGORA_APP_ID`: Agora project App ID
   - `AGORA_APP_CERTIFICATE`: Agora project certificate (for token generation)

### Frontend Changes
1. **Install Agora SDK**
   - Package: `agora-rtc-sdk-ng`
   - TypeScript support included

2. **Replace WebRTC Logic**
   - Remove custom RTCPeerConnection setup
   - Remove WebSocket connection logic
   - Use Agora client methods for media handling

3. **Update Session Page**
   - Initialize Agora client
   - Fetch token from backend
   - Join channel with token
   - Publish local tracks
   - Subscribe to remote tracks

## Data Flow

### Call Initialization
1. User opens `/session/[sessionId]?role=user`
2. Frontend requests camera/microphone permissions
3. Frontend calls `POST /api/agora/token` with sessionId as channelName
4. Backend generates Agora RTC token with 24h expiry
5. Frontend initializes Agora client with token
6. Frontend joins Agora channel
7. Frontend publishes local audio/video tracks

### Partner Joins
1. Partner opens `/session/[sessionId]?role=partner`
2. Same flow as user (steps 2-7)
3. Agora automatically connects both participants
4. Both receive `user-joined` event
5. Both subscribe to remote tracks

### Call Termination
1. User clicks "End Call" button
2. Frontend unpublishes local tracks
3. Frontend leaves Agora channel
4. Frontend navigates to home page
5. Other participant receives `user-left` event
6. Other participant's call also ends

## Security Considerations

### Token-Based Authentication
- Use RTC tokens with `RtcRole.PUBLISHER` for both user and partner
- Set token expiration to 24 hours (86400 seconds)
- Generate unique token per session
- Never expose App Certificate to frontend

### Channel Access Control
- Use sessionId as Agora channel name (UUID format)
- Unpredictable channel names prevent unauthorized access
- Optional: Implement backend validation to check if user is authorized for session

## Migration Strategy

### Phase 1: Implementation
1. Install Agora SDK on frontend
2. Implement token generation API on backend
3. Update session page to use Agora
4. Keep old WebSocket implementation (not imported)

### Phase 2: Testing
1. Test in development environment (localhost)
2. Verify connection establishment
3. Test audio/video quality
4. Test error handling (permission denied, network issues)

### Phase 3: Cleanup
1. Remove WebSocket signaling server code
2. Remove `ws` package dependency
3. Update documentation

## Rollback Plan
If Agora implementation has issues:
1. Deploy Node.js server to separate hosting (Railway, Render)
2. Update `NEXT_PUBLIC_API_URL` to point to WebSocket server
3. Revert frontend to use custom WebRTC implementation

## Cost Estimation
- Free tier: 10,000 minutes/month (167 hours)
- Usage estimate: 5 min/session × 100 sessions/day × 30 days = 15,000 min/month
- Overage: 5,000 minutes × $3.99/1000 min = ~$20/month
- Total: $0-20/month depending on usage

## Success Metrics
1. Connection success rate > 95%
2. Time to connect < 5 seconds
3. Zero production crashes related to WebRTC
4. Support for both desktop and mobile browsers
