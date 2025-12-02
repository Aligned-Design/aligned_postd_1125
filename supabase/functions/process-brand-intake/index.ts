import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrandKitData {
  voice_summary: {
    tone: string[];
    style: string;
    avoid: string[];
    audience: string;
    personality: string[];
  };
  keyword_themes: string[];
  about_blurb: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    confidence: number;
  };
  source_urls: string[];
}

/**
 * ⚠️ DEPRECATED: This Edge Function should NOT be used.
 * 
 * All brand intake scraping should use the real crawler API:
 * POST /api/crawl/start?sync=true
 * 
 * This Edge Function is kept for backward compatibility only.
 * It will return an error directing clients to use the real crawler.
 * 
 * @deprecated Use /api/crawl/start instead
 */
function generateBrandKitFallback(url: string): BrandKitData {
  // ⚠️ This function should not be called - return error structure instead
  throw new Error(
    "This Edge Function is deprecated. Please use POST /api/crawl/start?sync=true instead. " +
    "The real crawler provides accurate brand data extraction."
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { brandId, websiteUrl } = await req.json();

    if (!brandId || !websiteUrl) {
      return new Response(
        JSON.stringify({ error: "brandId and websiteUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ⚠️ DEPRECATED: This Edge Function should NOT be used.
    // All brand intake scraping should use the real crawler API:
    // POST /api/crawl/start?sync=true
    // 
    // This Edge Function is kept for backward compatibility only.
    // It will return an error directing clients to use the real crawler.
    return new Response(
      JSON.stringify({
        error: "This Edge Function is deprecated",
        message: "Please use POST /api/crawl/start?sync=true instead. The real crawler provides accurate brand data extraction.",
        deprecated: true,
        alternativeEndpoint: "/api/crawl/start?sync=true",
      }),
      {
        status: 410, // 410 Gone - indicates resource is deprecated
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

    // ⚠️ CODE BELOW IS UNREACHABLE - KEPT FOR REFERENCE ONLY
    /*
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Edge Function] Processing brand intake for ${brandId}`);

    // For now, generate fallback brand kit
    // In the future, call to separate crawler service or use a different approach
    const brandKit = generateBrandKitFallback(websiteUrl);

    // Update brand with generated data
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        brand_kit: {
          ...brandKit,
          processed_at: new Date().toISOString(),
        },
        voice_summary: brandKit.voice_summary,
        visual_summary: {
          colors: brandKit.colors,
          style: "extracted from website",
        },
        primary_color: brandKit.colors.primary,
      })
      .eq("id", brandId);

    if (updateError) {
      throw new Error(`Failed to update brand: ${updateError.message}`);
    }

    console.log(`[Edge Function] Successfully processed brand ${brandId}`);

    return new Response(
      JSON.stringify({
        success: true,
        brandKit,
        message: "Brand intake processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
    */
  } catch (error) {
    console.error("[Edge Function] Error:", error);

    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Failed to process brand intake",
        details: (error as Error).stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
