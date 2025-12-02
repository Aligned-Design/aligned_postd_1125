# POSTD Phase 3 Setup Guide - Brand Intake + Website Crawler

> **Status:** ✅ Active – This is an active setup guide for POSTD Phase 3 features.  
> **Last Updated:** 2025-01-20

This guide walks through setting up all Phase 3 integrations: file uploads, website crawler, AI summaries, and embeddings.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
pnpm exec playwright install chromium --with-deps
```

**New packages added:**

- `playwright` - Headless browser for website crawling
- `openai` - AI summaries and embeddings
- `node-vibrant` - Color extraction from images
- `robots-parser` - Respect robots.txt

---

## 🔧 Environment Configuration

### 1. Add Environment Variables

Create `.env.local` (or update existing `.env`):

```bash
# Supabase (existing)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Website Crawler Configuration
CRAWL_MAX_PAGES=50
CRAWL_TIMEOUT_MS=30000
CRAWL_USER_AGENT=POSTDBot/1.0 (+contact: hello@aligned-by-design.com)
```

### 2. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `OPENAI_API_KEY` in `.env.local`

**Note**: If you don't have an OpenAI key, the system will fall back to rule-based summaries (no embeddings).

---

## 🗄️ Database Setup

### 1. Enable pgvector Extension

In Supabase Dashboard → SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Migration

Apply the brand_embeddings migration:

```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Copy SQL to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20250115_create_brand_embeddings.sql
```

### 3. Create Storage Bucket

In Supabase Dashboard → Storage:

1. Create bucket: `brand-assets`
2. **Make it public** (for easy access to logos/images)
3. Set RLS policies:

```sql
-- Allow authenticated users to upload to their brand folders
CREATE POLICY "Users can upload to their brand folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT brand_id::text
    FROM brand_members
    WHERE user_id = auth.uid()
  )
);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

-- Allow users to delete their brand files
CREATE POLICY "Users can delete their brand files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT brand_id::text
    FROM brand_members
    WHERE user_id = auth.uid()
  )
);
```

---

## ⚡ Deploy Edge Function

### 1. Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### 2. Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy Edge Function

```bash
supabase functions deploy process-brand-intake
```

### 4. Set Edge Function Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

**Verify deployment:**

```bash
supabase functions list
```

You should see `process-brand-intake` in the list.

---

## 🧪 Testing the Integration

### 1. Test File Uploads

1. Go to `/brand-intake?brandId=YOUR_BRAND_ID`
2. Upload a logo in Section 3 (Visual Identity)
3. Submit the form
4. Check Supabase Storage → `brand-assets` bucket
5. Verify `brand_assets` table has records

### 2. Test Website Import

1. Go to `/brand-intake?brandId=YOUR_BRAND_ID`
2. Enter a website URL in Section 1 (e.g., `https://example.com`)
3. Click "Import from Website"
4. Wait ~30-60 seconds
5. Verify form fields populate with extracted data

**Expected behavior:**

- Primary/Secondary/Accent colors update
- Tone keywords populate
- Brand personality fills in
- Short description appears

### 3. Test Embeddings

Check if embeddings were created:

```sql
SELECT brand_id, created_at, LENGTH(content) as content_length
FROM brand_embeddings;
```

If `OPENAI_API_KEY` is set, you should see a record per brand.

### 4. Test Vector Search

```sql
-- Example: Search for similar brands (requires OpenAI key)
SELECT * FROM search_similar_brands(
  (SELECT embedding FROM brand_embeddings LIMIT 1),
  0.8,
  5
);
```

---

## 🔍 Crawler Configuration

### Crawler Rules (enforced in code)

| Rule                   | Value            | Configurable          |
| ---------------------- | ---------------- | --------------------- |
| **Scope**              | Same-domain only | ❌                    |
| **Max pages**          | 50               | ✅ `CRAWL_MAX_PAGES`  |
| **Max depth**          | 3 levels         | ❌                    |
| **Crawl delay**        | 1 second         | ❌                    |
| **Timeout**            | 30 seconds       | ✅ `CRAWL_TIMEOUT_MS` |
| **Respect robots.txt** | Yes              | ❌                    |
| **Render JS**          | Yes (Playwright) | ❌                    |
| **Extract PDFs**       | No               | ❌                    |

### What Gets Extracted

From each page:

- Title (`<title>`)
- Meta description (`<meta name="description">`)
- Headings (H1, H2, H3)
- Visible body text (excluding nav, footer)
- Color palette (from hero images)

### Deduplication

Pages are deduplicated by MD5 hash of body text. Identical content = 1 entry.

---

## 🤖 AI Processing

### OpenAI Models Used

| Task           | Model                    | Purpose                       |
| -------------- | ------------------------ | ----------------------------- |
| **Summaries**  | `gpt-4-turbo-preview`    | Extract tone, style, keywords |
| **Embeddings** | `text-embedding-ada-002` | 1536-dim vectors              |

### Fallback Behavior

If `OPENAI_API_KEY` is not set:

- ✅ Website crawling still works
- ✅ Color extraction still works
- ✅ Rule-based summaries (basic keyword extraction)
- ❌ No embeddings created
- ⚠️ Warning logged to console

### Brand Kit Output

```json
{
  "voice_summary": {
    "tone": ["professional", "innovative", "friendly"],
    "style": "conversational",
    "avoid": ["jargon", "slang"],
    "audience": "small business owners",
    "personality": ["trustworthy", "approachable"]
  },
  "keyword_themes": ["marketing", "automation", "content", "AI", "brands"],
  "about_blurb": "An intelligent brand content platform that helps agencies...",
  "colors": {
    "primary": "#8B5CF6",
    "secondary": "#F0F7F7",
    "accent": "#EC4899",
    "confidence": 0.85
  },
  "source_urls": ["https://aligned.ai"]
}
```

---

## 🚨 Troubleshooting

### Issue: "OPENAI_API_KEY not set"

**Solution**: Add OpenAI API key to `.env.local` or Edge Function secrets

```bash
# Local development
echo "OPENAI_API_KEY=sk-your-key" >> .env.local

# Edge Function
supabase secrets set OPENAI_API_KEY=sk-your-key
```

### Issue: "Failed to upload file"

**Possible causes:**

1. Storage bucket `brand-assets` doesn't exist → Create it
2. RLS policies blocking upload → Check policies
3. File too large → Check bucket size limits

### Issue: "Crawler timeout"

**Solutions:**

- Increase `CRAWL_TIMEOUT_MS` (default: 30000)
- Check if website blocks bots
- Verify website is accessible

### Issue: "pgvector extension not found"

**Solution**: Enable in Supabase Dashboard

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Edge Function not found"

**Solution**: Redeploy

```bash
supabase functions deploy process-brand-intake --no-verify-jwt
```

---

## 📊 Performance Expectations

| Operation                    | Time   | Notes                 |
| ---------------------------- | ------ | --------------------- |
| **File upload (5 files)**    | 2-5s   | Depends on file size  |
| **Website crawl (10 pages)** | 10-20s | 1s delay per page     |
| **Website crawl (50 pages)** | 50-60s | Max pages limit       |
| **OpenAI summary**           | 3-5s   | API latency           |
| **Color extraction**         | 2-3s   | Screenshot + analysis |
| **Embedding creation**       | 1-2s   | Per brand             |

**Total import time**: 30-90 seconds (depending on website size)

---

## 🔐 Security & Privacy

### Brand Isolation (RLS)

- ✅ Each brand has unique `brand_id`
- ✅ Embeddings scoped to `brand_id`
- ✅ File uploads scoped to `brand_id` folder
- ✅ RLS prevents cross-brand access

**Test isolation:**

```sql
-- As User A, try to access User B's brand
SELECT * FROM brand_embeddings WHERE brand_id = 'user-b-brand-id';
-- Should return 0 rows
```

### Crawler Ethics

- ✅ Respects `robots.txt`
- ✅ 1-second delay between requests
- ✅ Identifies as `POSTDBot` (not spoofing)
- ✅ Doesn't follow external links
- ✅ Doesn't download large files (PDFs skipped)

---

## 📦 File Structure

```
server/
  workers/
    brand-crawler.ts          # Main crawler logic (478 lines)

supabase/
  functions/
    process-brand-intake/
      index.ts                # Edge Function trigger (81 lines)
  migrations/
    20250115_create_brand_embeddings.sql  # pgvector setup

client/
  lib/
    fileUpload.ts             # Upload utilities (102 lines)
  pages/
    BrandIntake.tsx           # Updated with import button

.env.example                  # Updated with new vars
package.json                  # New dependencies added
```

---

## ✅ Acceptance Criteria (from Phase 3 spec)

- [x] Given a brand URL, "Import from Website" populates Brand Kit in ≤ 60s
- [x] All data saved under current `brand_id`
- [x] RLS verified (no cross-brand access)
- [x] Retry on transient errors
- [x] Friendly status messages (in-progress / done / failed)
- [x] Fallback if `OPENAI_API_KEY` missing

---

## 🎉 You're Ready!

**Next steps:**

1. Add OpenAI API key
2. Run migration
3. Deploy Edge Function
4. Test website import
5. Move to Phase 4 (AI Agent Integration)

**Need help?** Check logs:

- Edge Function: Supabase Dashboard → Edge Functions → Logs
- Browser: Dev Tools → Console
- Server: `pnpm dev` terminal output

---

**Updated**: January 2025  
**Author**: Fusion AI  
**Phase 3 Status**: ✅ Complete
