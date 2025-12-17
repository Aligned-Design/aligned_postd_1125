/**
 * Multi-Step Crawler for Vercel
 * 
 * Each step is a separate, time-boxed operation:
 * - Step A: Fast HTTP fetch (5-10s)
 * - Step B: Browser render (15-20s, optional)
 * - Step C: AI generation (10-15s)
 * 
 * No step exceeds 25 seconds, making it Vercel-safe.
 */

import { logger } from '../lib/logger';
import { CrawlErrorCode, type CrawlErrorCodeType } from '../lib/crawl-error-codes';

// ============================================================================
// Constants
// ============================================================================

const STEP_A_TIMEOUT = 10000; // 10s for HTTP fetch
const STEP_B_TIMEOUT = 20000; // 20s for browser render
const STEP_C_TIMEOUT = 15000; // 15s for AI generation

const MAX_PAGES = 2; // Homepage + 1 extra (about/contact)
const MAX_LINKS = 30; // Limit sitemap explosion

// Skip these patterns
const SKIP_PATTERNS = [
  /^#/,              // Hash links
  /\/(en|fr|de|es|it|nl|pt|ja|zh|sv|no|da|fi)-[a-z]{2}/i, // Locale routes
  /\/(sitemap|jobs|newsroom|blog|press|legal|privacy|terms|cookie)/i, // Standard skips
];

// ============================================================================
// Types
// ============================================================================

export interface StepAResult {
  title?: string;
  description?: string;
  url: string;
  favicon?: string;
  appleTouchIcon?: string;
  ogImage?: string;
  twitterImage?: string;
  logoCandidates: Array<{
    url: string;
    source: 'og' | 'twitter' | 'favicon' | 'header' | 'nav';
    alt?: string;
  }>;
  heroText?: string;
  aboutText?: string;
  links: string[];
  needsBrowser: boolean; // True if site is JS-heavy or data is thin
  durationMs: number;
}

export interface StepBResult {
  renderedHeroText?: string;
  renderedLogos: Array<{
    url: string;
    source: 'rendered-header' | 'rendered-nav' | 'bg-image';
    alt?: string;
  }>;
  visibleImages: Array<{
    url: string;
    role: 'logo' | 'hero' | 'photo' | 'other';
  }>;
  durationMs: number;
}

export interface StepCResult {
  brandKit: any; // Your existing brand kit structure
  durationMs: number;
}

export interface StepError {
  code: CrawlErrorCodeType;
  message: string;
  details?: any;
}

// ============================================================================
// Step A: Fast HTTP Fetch (No Browser)
// ============================================================================

export async function executeFetchStep(url: string): Promise<StepAResult | StepError> {
  const startTime = Date.now();
  
  logger.info('[StepA] Starting fast HTTP fetch', { url });
  
  try {
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STEP_A_TIMEOUT);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandCrawler/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return {
          code: CrawlErrorCode.FETCH_BLOCKED,
          message: `Website returned ${response.status}`,
        };
      }
      return {
        code: CrawlErrorCode.FETCH_FAILED,
        message: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    const durationMs = Date.now() - startTime;
    
    // Parse HTML (using regex for now, could use cheerio if needed)
    const result: StepAResult = {
      url,
      title: extractTag(html, 'title'),
      description: extractMetaContent(html, 'description'),
      ogImage: extractMetaContent(html, 'og:image'),
      twitterImage: extractMetaContent(html, 'twitter:image'),
      favicon: extractFavicon(html, url),
      appleTouchIcon: extractAppleTouchIcon(html, url),
      logoC andidates: extractLogoCandidates(html, url),
      heroText: extractHeroText(html),
      aboutText: '', // Optional: extract first paragraphs
      links: extractLinks(html, url),
      needsBrowser: detectNeedsBrowser(html),
      durationMs,
    };
    
    logger.info('[StepA] Fetch complete', {
      url,
      durationMs,
      title: result.title,
      logoCount: result.logoCandidates.length,
      linkCount: result.links.length,
      needsBrowser: result.needsBrowser,
    });
    
    return result;
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      logger.warn('[StepA] Fetch timeout', { url, durationMs });
      return {
        code: CrawlErrorCode.FETCH_TIMEOUT,
        message: 'Website took too long to respond',
      };
    }
    
    logger.error('[StepA] Fetch failed', { url, error: error.message, durationMs });
    return {
      code: CrawlErrorCode.FETCH_FAILED,
      message: error.message || 'Failed to load website',
    };
  }
}

// ============================================================================
// Step B: Browser Render (Optional, Only if Step A is thin)
// ============================================================================

export async function executeRenderStep(
  url: string,
  rawData: StepAResult
): Promise<StepBResult | StepError> {
  const startTime = Date.now();
  
  logger.info('[StepB] Starting browser render', { url, reason: 'thin data from Step A' });
  
  try {
    // Import Playwright dynamically (only when needed)
    const { chromium } = await import('playwright-core');
    
    // TODO: Import your existing browser launch logic
    // For now, return a placeholder
    
    const result: StepBResult = {
      renderedHeroText: '',
      renderedLogos: [],
      visibleImages: [],
      durationMs: Date.now() - startTime,
    };
    
    logger.info('[StepB] Render complete', {
      url,
      durationMs: result.durationMs,
      logosFound: result.renderedLogos.length,
      imagesFound: result.visibleImages.length,
    });
    
    return result;
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      logger.warn('[StepB] Render timeout', { url, durationMs });
      return {
        code: CrawlErrorCode.RENDER_TIMEOUT,
        message: 'Website rendering timed out',
      };
    }
    
    logger.error('[StepB] Render failed', { url, error: error.message, durationMs });
    return {
      code: CrawlErrorCode.RENDER_CRASH,
      message: error.message || 'Browser crashed',
    };
  }
}

// ============================================================================
// Step C: AI Generation (Isolated, No Fallback Chain)
// ============================================================================

export async function executeGenerateStep(
  url: string,
  rawData: StepAResult,
  renderedData?: StepBResult
): Promise<StepCResult | StepError> {
  const startTime = Date.now();
  
  logger.info('[StepC] Starting AI generation', { url });
  
  try {
    // TODO: Import your AI generation logic
    // For now, return a placeholder
    
    const result: StepCResult = {
      brandKit: {},
      durationMs: Date.now() - startTime,
    };
    
    logger.info('[StepC] Generation complete', {
      url,
      durationMs: result.durationMs,
    });
    
    return result;
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    if (error.message?.includes('timeout')) {
      logger.warn('[StepC] AI timeout', { url, durationMs });
      return {
        code: CrawlErrorCode.AI_TIMEOUT,
        message: 'AI processing took too long',
      };
    }
    
    if (error.message?.includes('No content generated')) {
      logger.warn('[StepC] AI returned empty', { url, durationMs });
      return {
        code: CrawlErrorCode.AI_EMPTY,
        message: 'AI failed to generate brand kit',
      };
    }
    
    logger.error('[StepC] AI generation failed', { url, error: error.message, durationMs });
    return {
      code: CrawlErrorCode.UNKNOWN_ERROR,
      message: error.message || 'AI generation failed',
    };
  }
}

// ============================================================================
// Helper Functions (HTML Parsing)
// ============================================================================

function extractTag(html: string, tag: string): string | undefined {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match?.[1]?.trim();
}

function extractMetaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["']`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  
  return undefined;
}

function extractFavicon(html: string, baseUrl: string): string | undefined {
  const match = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
  if (!match) return undefined;
  return new URL(match[1], baseUrl).href;
}

function extractAppleTouchIcon(html: string, baseUrl: string): string | undefined {
  const match = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
  if (!match) return undefined;
  return new URL(match[1], baseUrl).href;
}

function extractLogoCandidates(html: string, baseUrl: string): StepAResult['logoCandidates'] {
  const candidates: StepAResult['logoCandidates'] = [];
  
  // Header images
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  if (headerMatch) {
    const imgMatches = headerMatch[1].matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi);
    for (const match of imgMatches) {
      candidates.push({
        url: new URL(match[1], baseUrl).href,
        source: 'header',
        alt: match[2],
      });
    }
  }
  
  // Limit to top 5
  return candidates.slice(0, 5);
}

function extractHeroText(html: string): string | undefined {
  // Extract first h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return h1Match?.[1]?.trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const matches = html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi);
  
  for (const match of matches) {
    try {
      const url = new URL(match[1], baseUrl);
      
      // Skip if not same origin
      if (url.origin !== new URL(baseUrl).origin) continue;
      
      // Skip patterns
      if (SKIP_PATTERNS.some(pattern => pattern.test(url.pathname))) continue;
      
      links.push(url.href);
      
      if (links.length >= MAX_LINKS) break;
    } catch {
      // Invalid URL, skip
    }
  }
  
  return links.slice(0, MAX_LINKS);
}

function detectNeedsBrowser(html: string): boolean {
  // Signals that site is JS-heavy
  const jsHeavySignals = [
    html.includes('__NEXT_DATA__'),
    html.includes('__nuxt'),
    html.includes('ng-app'),
    html.includes('react-root'),
    html.includes('vue-app'),
    html.length < 5000, // Very thin HTML
    !html.includes('<h1'), // No h1 tag
  ];
  
  return jsHeavySignals.filter(Boolean).length >= 2;
}

