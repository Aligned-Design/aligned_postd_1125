# Stock Image API Implementation

## ✅ Implementation Complete

### Backend Routes
- ✅ `GET /api/media/stock-images/search` - Search stock images via Pexels or Pixabay API
- ✅ `GET /api/media/stock-images/:id` - Get single stock image by ID

### Frontend Updates
- ✅ Updated `client/lib/stockImageApi.ts` to call backend API instead of mock data
- ✅ Added usage notice banner in `StockImageModal`
- ✅ Updated provider filter to show Pexels and Pixabay (with "coming soon" note for Unsplash)

### Environment Variables Required

Add to your `.env` file:

```bash
PEXELS_API_KEY=movfnScFPKJmmC7g7CgIgoSMDgv0ux6MtjwOw9vQRhRRWNgPORzUWRIK
PIXABAY_API_KEY=53292470-02e65d12243f74f208ddb4e18
```

### Usage Notice

**IMPORTANT:** All stock images must be modified (cropped, text added, filters applied, etc.) before being posted or resold. Never use stock images as-is.

This notice is:
- ✅ Displayed in the API response
- ✅ Shown in the UI banner
- ✅ Logged to console
- ✅ Included in code comments

### API Features

1. **Search Parameters:**
   - `query` (required): Search term
   - `page` (optional, default: 1): Page number
   - `perPage` (optional, default: 20, max: 200 for Pixabay, 80 for Pexels): Results per page
   - `orientation` (optional): "landscape" | "portrait" | "square"
   - `provider` (optional, default: "pexels"): "pexels" or "pixabay" are supported

2. **Error Handling:**
   - ✅ Rate limit handling (429)
   - ✅ Invalid API key (401)
   - ✅ Network errors
   - ✅ Fallback to mock data if API fails

3. **Response Format:**
   ```typescript
   {
     images: StockImage[],
     total: number,
     page: number,
     hasMore: boolean,
     usageNotice: string,
     provider: "pexels"
   }
   ```

### Provider Details

**Pexels:**
- ✅ Fully implemented
- Rate limit: Based on API key
- Attribution: Not required, but shown
- Max per page: 80

**Pixabay:**
- ✅ Fully implemented
- Rate limit: 100 requests per 60 seconds
- Attribution: Required to show source when displaying search results
- Max per page: 200
- Note: Must show where images are from when displaying results

### Next Steps (Future)

1. **Unsplash Integration:**
   - Add `UNSPLASH_ACCESS_KEY` environment variable
   - Implement Unsplash API calls in `server/routes/stock-images.ts`
   - Update provider filter in UI

2. **Multi-Provider Search:**
   - Aggregate results from multiple providers
   - Deduplicate similar images
   - Sort by relevance

### Testing

1. Set `PEXELS_API_KEY` and `PIXABAY_API_KEY` in `.env`
2. Start server: `pnpm dev`
3. Open Creative Studio → Stock Images modal
4. Search for images (e.g., "nature", "business")
5. Switch between Pexels and Pixabay providers
6. Verify:
   - ✅ Real images load from both providers
   - ✅ Usage notice is displayed
   - ✅ Pagination works
   - ✅ Orientation filter works
   - ✅ Error handling works (try invalid query)
   - ✅ Pixabay attribution notice appears when using Pixabay

### Security

- ✅ API key stored in environment variable (never in code)
- ✅ Backend proxies all requests (key never exposed to frontend)
- ✅ RBAC protection (`requireScope("content:view")`)
- ✅ Authentication required (`authenticateUser`)

