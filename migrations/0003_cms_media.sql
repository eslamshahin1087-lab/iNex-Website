-- Store CMS-uploaded images as bounded BLOBs in the dedicated iNex Website D1 database.
-- The 1.5 MB application limit stays below D1's 2 MB maximum BLOB/table-row size.
CREATE TABLE IF NOT EXISTS cms_media (
  media_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp','image/avif')),
  image_data BLOB NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 1500000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(image_data) = size_bytes)
);
