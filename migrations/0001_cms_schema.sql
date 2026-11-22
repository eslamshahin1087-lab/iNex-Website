-- iNex Website CMS schema for Cloudflare D1 (SQLite).
-- Dedicated to iNex-Website only. Never connect to iNex-App or InsurNex.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_content (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 page_slug TEXT NOT NULL CHECK (page_slug IN ('index','platform','solutions','awareness','company','contact','resources')),
 content_key TEXT NOT NULL,
 content_type TEXT NOT NULL CHECK (content_type IN ('text','image','card')),
 section_label TEXT NOT NULL DEFAULT 'Website content',
 label_en TEXT NOT NULL DEFAULT '',
 label_ar TEXT NOT NULL DEFAULT '',
 content_en TEXT, content_ar TEXT, image_url TEXT, storage_path TEXT,
 alt_en TEXT, alt_ar TEXT,
 sort_order INTEGER NOT NULL DEFAULT 1000,
 is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0,1)),
 is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0,1)),
 is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0,1)),
 image_mode TEXT NOT NULL DEFAULT 'file' CHECK (image_mode IN ('file','sprite')),
 image_position TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (page_slug, content_key),
 CHECK (content_type <> 'image' OR image_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS cms_content_page_order_idx ON cms_content(page_slug, sort_order, id);
CREATE INDEX IF NOT EXISTS cms_content_public_idx ON cms_content(page_slug, is_published, is_visible, sort_order);