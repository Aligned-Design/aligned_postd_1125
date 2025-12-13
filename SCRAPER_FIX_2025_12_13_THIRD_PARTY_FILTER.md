# 🚨 SCRAPER CRITICAL FIX — Third-Party Embed Filter

**Date:** 2025-12-13  
**Severity:** BLOCKER  
**Status:** ✅ **FIXED & VERIFIED**

---

## **PROBLEM**

Scraper returned **15/15 images as "logo"** for Squarespace site (sdirawealth.com).

**Root Cause:** Google Maps tiles were being extracted and classified as logos instead of brand images.

---

## **THE FIX**

**File:** `server/workers/brand-crawler.ts`  
**Line:** 2117

### **Code Change:**

```typescript
// ✅ FIX 2025-12-13: Filter out third-party embeds (maps, ads, tracking pixels)
const thirdPartyDomains = [
  "maps.googleapis.com",
  "maps.google.com",
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.com/tr",
  "linkedin.com/px",
  "ads.",
  "adservice.",
  "pixel.",
  "track.",
];

const urlLowerCheck = normalizedUrl.toLowerCase();
const isThirdPartyEmbed = thirdPartyDomains.some(domain => urlLowerCheck.includes(domain));

if (isThirdPartyEmbed) {
  // Skip third-party embeds (maps, ads, tracking)
  return;
}
```

---

## **BEFORE vs AFTER**

### **BEFORE:**
```
Total images: 15
Role breakdown: { logo: 15 }
First 5 roles: logo, logo, logo, logo, logo

All images: maps.googleapis.com/maps/vt (map tiles)
```

### **AFTER:**
```
Total images: 15
Role breakdown: { hero: 5, photo: 3, subject: 1, logo: 2, partner_logo: 4 }
First 5 roles: hero, hero, hero, hero, hero

Images: Real brand photos from Squarespace CDN
```

---

## **VERIFICATION**

**Test Site:** https://sdirawealth.com (Squarespace)  
**Brand ID:** `aaaaaaaa-bbbb-cccc-dddd-222222222222`

### **Results:**

| Check | Status |
|-------|--------|
| Host detected correctly | ✅ PASS (squarespace) |
| Brand images before logos | ✅ PASS (5 hero images first) |
| Logo count ≤ 2 | ✅ PASS (2 logos) |
| GIFs filtered | ✅ PASS |
| Color palette quality | ✅ PASS (3 colors) |
| Canonical storage only | ✅ PASS |

---

## **WHY THIS MATTERS**

1. **Financial/Real Estate sites** heavily use Google Maps embeds
2. **15 map tiles** would dominate brand image gallery
3. **User experience:** Customer sees map tiles instead of brand photos
4. **Color extraction:** Would extract grey/white (map colors) instead of brand colors

---

## **DEPLOYMENT NOTES**

1. ✅ Fix applied to `main` branch
2. ✅ Dev server restarted (verified at 02:53 UTC)
3. ✅ Runtime verification passed
4. ⚠️ **Action Required:** Add integration test for third-party filtering

---

## **MONITORING**

### **First 5 Production Scrapes:**

Watch for:
```sql
-- Check for "all logos" regression
SELECT brand_id, 
  COUNT(*) as total_images,
  COUNT(*) FILTER (WHERE metadata->>'role' = 'logo') as logo_count
FROM media_assets
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY brand_id
HAVING COUNT(*) FILTER (WHERE metadata->>'role' = 'logo') > 5;
-- Expected: 0 rows
```

---

**Generated:** 2025-12-13 02:57 UTC  
**Fix Verified:** ✅ Squarespace site scrape successful

