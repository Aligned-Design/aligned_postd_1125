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
 * Fallback brand kit generation without crawler
 * Used when the crawler is not available or fails
 */
function generateBrandKitFallback(url: string): BrandKitData {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace("www.", "");

  return {
    voice_summary: {
      tone: ["professional", "trustworthy"],
      style: "Clear and direct",
      avoid: ["jargon", "slang"],
      audience: "Business professionals",
      personality: ["helpful", "reliable"],
    },
    keyword_themes: [domain],
    about_blurb: `Brand from ${domain}. Please complete intake form for more details.`,
    colors: {
      primary: "#8B5CF6",
      secondary: "#F0F7F7",
      accent: "#EC4899",
      confidence: 0,
    },
    source_urls: [url],
  };
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
