# Canva Integration

This directory contains the Canva API integration scaffolding for Aligned-20AI.

## Overview

The Canva integration allows users to:
- Open designs in Canva's editor from the Creative Studio
- Import designs from Canva into the Library
- Export Canva designs as brand assets

## Architecture

### Integration Modes

Canva supports multiple integration modes:

1. **OAuth Mode** (Recommended)
   - Full OAuth 2.0 flow
   - Users authenticate with Canva
   - Access token stored in `platform_connections` table
   - Supports all Canva API features

2. **Editor-Only Mode** (Alternative)
   - Opens Canva editor in iframe/popup
   - No OAuth required
   - Limited to editor functionality
   - Designs must be exported manually

3. **Single Sign-On (SSO)** (Future)
   - Enterprise SSO integration
   - Requires Canva Enterprise plan

### Expected API Endpoints

Based on Canva API documentation (v1):

```
POST /v1/oauth/authorize          # Initiate OAuth flow
POST /v1/oauth/token              # Exchange code for token
GET  /v1/designs/{designId}       # Get design metadata
POST /v1/designs/{designId}/editor # Open design in editor
POST /v1/designs/{designId}/exports # Export design as image
GET  /v1/templates                # List available templates
POST /v1/templates/{templateId}/editor # Start from template
```

### Data We Expect to Receive

**From OAuth Callback:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**From Design Export:**
```json
{
  "designId": "string",
  "exportUrl": "https://...",
  "format": "png" | "jpg" | "pdf",
  "width": 1080,
  "height": 1080,
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**From Design Metadata:**
```json
{
  "designId": "string",
  "title": "string",
  "thumbnailUrl": "https://...",
  "imageUrl": "https://...",
  "width": 1080,
  "height": 1080,
  "format": "png",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

## Environment Variables

Add these to your `.env` file:

```bash
# Canva OAuth Credentials
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
CANVA_REDIRECT_URI=https://your-domain.com/api/integrations/canva/callback
```

## Database Schema

Canva connections are stored in the `platform_connections` table:

```sql
INSERT INTO platform_connections (
  brand_id,
  platform,
  account_id,
  access_token,
  refresh_token,
  expires_at,
  status
) VALUES (
  'brand-uuid',
  'canva',
  'canva-user-id',
  'access-token',
  'refresh-token',
  '2025-01-01T00:00:00Z',
  'connected'
);
```

## Implementation Status

### ✅ Completed
- Integration scaffolding (`canva-client.ts`)
- Type definitions
- Placeholder functions
- README documentation

### 🔄 TODO (When API Keys Available)
1. **OAuth Flow**
   - [ ] Implement `initiateCanvaEditorSession()` with real API calls
   - [ ] Implement `handleCanvaCallback()` with token exchange
   - [ ] Store tokens in `platform_connections` table
   - [ ] Add token refresh logic

2. **Design Management**
   - [ ] Implement `getCanvaDesignMetadata()` to fetch design info
   - [ ] Implement `saveCanvaDesignToLibrary()` to download and save
   - [ ] Add design sync/import functionality

3. **UI Integration**
   - [ ] Connect "Design in Canva" button to `initiateCanvaEditorSession()`
   - [ ] Connect "Import from Canva" to design picker
   - [ ] Add "Open in Canva" action in Approvals

4. **Error Handling**
   - [ ] Handle expired tokens
   - [ ] Handle API rate limits
   - [ ] Handle network errors
   - [ ] Add retry logic

## Testing

Once implemented, test the integration:

1. **OAuth Flow**
   ```bash
   # Initiate OAuth
   curl -X POST http://localhost:8080/api/integrations/canva/oauth/initiate \
     -H "Content-Type: application/json" \
     -d '{"brandId": "brand-uuid"}'
   
   # Handle callback (after user authorizes)
   curl -X GET "http://localhost:8080/api/integrations/canva/callback?code=...&state=..."
   ```

2. **Editor Session**
   ```bash
   curl -X POST http://localhost:8080/api/integrations/canva/editor/initiate \
     -H "Content-Type: application/json" \
     -d '{"brandId": "brand-uuid", "designId": "optional-design-id"}'
   ```

3. **Import Design**
   ```bash
   curl -X POST http://localhost:8080/api/integrations/canva/import \
     -H "Content-Type: application/json" \
     -d '{"brandId": "brand-uuid", "designId": "canva-design-id"}'
   ```

## Resources

- [Canva API Documentation](https://www.canva.dev/docs/)
- [Canva OAuth Guide](https://www.canva.dev/docs/authentication/)
- [Canva Design API](https://www.canva.dev/docs/designs/)

## Notes

- Canva API requires HTTPS in production
- OAuth redirect URIs must be whitelisted in Canva Developer Portal
- Rate limits: 100 requests/minute per access token
- Design exports expire after 1 hour (download immediately)

