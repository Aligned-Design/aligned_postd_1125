-- Consolidate Brand Guide Fields into brands.brand_kit
-- Migration: 009
-- Date: 2025-01-20
-- Purpose: Merge voice_summary, visual_summary, and tone_keywords into brand_kit JSONB

-- ============================================================================
-- MIGRATION STRATEGY
-- ============================================================================
--
-- This migration merges data from:
-- - brands.voice_summary (JSONB) → brands.brand_kit.voiceAndTone
-- - brands.visual_summary (JSONB) → brands.brand_kit.visualIdentity
-- - brands.tone_keywords (TEXT[]) → brands.brand_kit.voiceAndTone.tone
--
-- The merge is additive: we only add data that doesn't already exist in brand_kit.
-- This ensures we don't overwrite existing data.
--
-- After this migration:
-- - All Brand Guide data should be in brands.brand_kit
-- - voice_summary, visual_summary, tone_keywords are kept for backward compatibility
-- - Code should be updated to read/write only from brand_kit
-- - Future migration can drop legacy fields after code is updated

-- ============================================================================
-- MERGE voice_summary INTO brand_kit.voiceAndTone
-- ============================================================================

DO $$
DECLARE
  brand_record RECORD;
  brand_kit JSONB;
  voice_summary JSONB;
  merged_voice JSONB;
BEGIN
  FOR brand_record IN 
    SELECT id, brand_kit, voice_summary 
    FROM brands 
    WHERE voice_summary IS NOT NULL 
      AND jsonb_typeof(voice_summary) = 'object'
  LOOP
    brand_kit := COALESCE(brand_record.brand_kit, '{}'::jsonb);
    voice_summary := brand_record.voice_summary;
    
    -- Initialize voiceAndTone if it doesn't exist
    IF NOT (brand_kit ? 'voiceAndTone') THEN
      brand_kit := brand_kit || '{"voiceAndTone": {}}'::jsonb;
    END IF;
    
    merged_voice := brand_kit->'voiceAndTone';
    
    -- Merge voice_summary fields into voiceAndTone (only if not already present)
    IF voice_summary ? 'tone' AND NOT (merged_voice ? 'tone') THEN
      merged_voice := merged_voice || jsonb_build_object('tone', voice_summary->'tone');
    END IF;
    
    IF voice_summary ? 'friendlinessLevel' AND NOT (merged_voice ? 'friendlinessLevel') THEN
      merged_voice := merged_voice || jsonb_build_object('friendlinessLevel', voice_summary->'friendlinessLevel');
    END IF;
    
    IF voice_summary ? 'formalityLevel' AND NOT (merged_voice ? 'formalityLevel') THEN
      merged_voice := merged_voice || jsonb_build_object('formalityLevel', voice_summary->'formalityLevel');
    END IF;
    
    IF voice_summary ? 'confidenceLevel' AND NOT (merged_voice ? 'confidenceLevel') THEN
      merged_voice := merged_voice || jsonb_build_object('confidenceLevel', voice_summary->'confidenceLevel');
    END IF;
    
    IF voice_summary ? 'voiceDescription' AND NOT (merged_voice ? 'voiceDescription') THEN
      merged_voice := merged_voice || jsonb_build_object('voiceDescription', voice_summary->'voiceDescription');
    END IF;
    
    IF voice_summary ? 'writingRules' AND NOT (merged_voice ? 'writingRules') THEN
      merged_voice := merged_voice || jsonb_build_object('writingRules', voice_summary->'writingRules');
    END IF;
    
    IF voice_summary ? 'avoidPhrases' AND NOT (merged_voice ? 'avoidPhrases') THEN
      merged_voice := merged_voice || jsonb_build_object('avoidPhrases', voice_summary->'avoidPhrases');
    END IF;
    
    -- Update brand_kit with merged voiceAndTone
    brand_kit := brand_kit || jsonb_build_object('voiceAndTone', merged_voice);
    
    -- Update brands table
    UPDATE brands
    SET brand_kit = brand_kit
    WHERE id = brand_record.id;
    
  END LOOP;
END $$;

-- ============================================================================
-- MERGE visual_summary INTO brand_kit.visualIdentity
-- ============================================================================

DO $$
DECLARE
  brand_record RECORD;
  brand_kit JSONB;
  visual_summary JSONB;
  merged_visual JSONB;
BEGIN
  FOR brand_record IN 
    SELECT id, brand_kit, visual_summary 
    FROM brands 
    WHERE visual_summary IS NOT NULL 
      AND jsonb_typeof(visual_summary) = 'object'
  LOOP
    brand_kit := COALESCE(brand_record.brand_kit, '{}'::jsonb);
    visual_summary := brand_record.visual_summary;
    
    -- Initialize visualIdentity if it doesn't exist
    IF NOT (brand_kit ? 'visualIdentity') THEN
      brand_kit := brand_kit || '{"visualIdentity": {}}'::jsonb;
    END IF;
    
    merged_visual := brand_kit->'visualIdentity';
    
    -- Merge visual_summary fields into visualIdentity (only if not already present)
    IF visual_summary ? 'colors' AND NOT (merged_visual ? 'colors') THEN
      merged_visual := merged_visual || jsonb_build_object('colors', visual_summary->'colors');
    END IF;
    
    IF visual_summary ? 'typography' AND NOT (merged_visual ? 'typography') THEN
      merged_visual := merged_visual || jsonb_build_object('typography', visual_summary->'typography');
    END IF;
    
    IF visual_summary ? 'logoUrl' AND NOT (merged_visual ? 'logoUrl') THEN
      merged_visual := merged_visual || jsonb_build_object('logoUrl', visual_summary->'logoUrl');
    END IF;
    
    IF visual_summary ? 'photographyStyle' AND NOT (merged_visual ? 'photographyStyle') THEN
      merged_visual := merged_visual || jsonb_build_object('photographyStyle', visual_summary->'photographyStyle');
    END IF;
    
    IF visual_summary ? 'visualNotes' AND NOT (merged_visual ? 'visualNotes') THEN
      merged_visual := merged_visual || jsonb_build_object('visualNotes', visual_summary->'visualNotes');
    END IF;
    
    -- Update brand_kit with merged visualIdentity
    brand_kit := brand_kit || jsonb_build_object('visualIdentity', merged_visual);
    
    -- Update brands table
    UPDATE brands
    SET brand_kit = brand_kit
    WHERE id = brand_record.id;
    
  END LOOP;
END $$;

-- ============================================================================
-- MERGE tone_keywords INTO brand_kit.voiceAndTone.tone
-- ============================================================================

DO $$
DECLARE
  brand_record RECORD;
  brand_kit JSONB;
  tone_keywords_array TEXT[];
  merged_voice JSONB;
  existing_tone JSONB;
  combined_tone JSONB;
BEGIN
  FOR brand_record IN 
    SELECT id, brand_kit, tone_keywords 
    FROM brands 
    WHERE tone_keywords IS NOT NULL 
      AND array_length(tone_keywords, 1) > 0
  LOOP
    brand_kit := COALESCE(brand_record.brand_kit, '{}'::jsonb);
    tone_keywords_array := brand_record.tone_keywords;
    
    -- Initialize voiceAndTone if it doesn't exist
    IF NOT (brand_kit ? 'voiceAndTone') THEN
      brand_kit := brand_kit || '{"voiceAndTone": {}}'::jsonb;
    END IF;
    
    merged_voice := brand_kit->'voiceAndTone';
    
    -- Get existing tone array (if any)
    existing_tone := COALESCE(merged_voice->'tone', '[]'::jsonb);
    
    -- Combine existing tone with tone_keywords (deduplicate)
    -- Convert tone_keywords to JSONB array
    combined_tone := existing_tone || to_jsonb(tone_keywords_array);
    
    -- Deduplicate: convert to array, remove duplicates, convert back
    combined_tone := (
      SELECT jsonb_agg(DISTINCT value)
      FROM jsonb_array_elements_text(combined_tone)
    );
    
    -- Update voiceAndTone with combined tone
    merged_voice := merged_voice || jsonb_build_object('tone', combined_tone);
    
    -- Update brand_kit with merged voiceAndTone
    brand_kit := brand_kit || jsonb_build_object('voiceAndTone', merged_voice);
    
    -- Update brands table
    UPDATE brands
    SET brand_kit = brand_kit
    WHERE id = brand_record.id;
    
  END LOOP;
END $$;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN brands.brand_kit IS 'Canonical Brand Guide data (JSONB). All Brand Guide fields should be stored here. voice_summary, visual_summary, and tone_keywords are legacy fields kept for backward compatibility.';
COMMENT ON COLUMN brands.voice_summary IS 'LEGACY: Voice & tone data. Use brand_kit->voiceAndTone instead. This field is kept for backward compatibility and will be removed in a future migration.';
COMMENT ON COLUMN brands.visual_summary IS 'LEGACY: Visual identity data. Use brand_kit->visualIdentity instead. This field is kept for backward compatibility and will be removed in a future migration.';
COMMENT ON COLUMN brands.tone_keywords IS 'LEGACY: Tone keywords array. Use brand_kit->voiceAndTone->tone instead. This field is kept for backward compatibility and will be removed in a future migration.';

