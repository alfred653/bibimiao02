-- Add full-text search vector to products table
-- Run via Neon SQL Editor or: psql $DATABASE_URL -f drizzle/0001_add_fts.sql

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(spec, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS products_search_vector_idx ON products USING GIN (search_vector);
