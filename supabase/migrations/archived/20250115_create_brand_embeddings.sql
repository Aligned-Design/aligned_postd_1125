-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create brand_embeddings table for AI context storage
CREATE TABLE IF NOT EXISTS brand_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id)
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS brand_embeddings_embedding_idx 
  ON brand_embeddings USING ivfflat (embedding vector_cosine_ops);

-- RLS Policies for brand isolation
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;

-- Users can only access embeddings for brands they're members of
CREATE POLICY "Users can view their brand embeddings"
  ON brand_embeddings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = brand_embeddings.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Only service role can insert/update embeddings (via Edge Function)
CREATE POLICY "Service role can manage embeddings"
  ON brand_embeddings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to search similar brands by context
CREATE OR REPLACE FUNCTION search_similar_brands(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  brand_id UUID,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    brand_embeddings.brand_id,
    brand_embeddings.content,
    1 - (brand_embeddings.embedding <=> query_embedding) as similarity
  FROM brand_embeddings
  WHERE 1 - (brand_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY brand_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
