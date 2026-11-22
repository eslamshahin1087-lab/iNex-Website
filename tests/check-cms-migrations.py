#!/usr/bin/env python3
"""Execute the iNex D1 schema and seed migrations against an ephemeral SQLite database."""

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
connection = sqlite3.connect(":memory:")
connection.row_factory = sqlite3.Row
connection.executescript((ROOT / "migrations" / "0001_cms_schema.sql").read_text(encoding="utf-8"))
connection.executescript((ROOT / "migrations" / "0002_seed_content.sql").read_text(encoding="utf-8"))

rows = connection.execute(
    "SELECT page_slug, content_key, content_type, is_published, is_visible, is_custom "
    "FROM cms_content ORDER BY page_slug, sort_order, id"
).fetchall()

assert len(rows) == 692, f"Expected 692 seeded CMS rows, found {len(rows)}"
assert len({(row["page_slug"], row["content_key"]) for row in rows}) == len(rows), "Duplicate CMS keys found"
assert {row["page_slug"] for row in rows} == {
    "index", "platform", "solutions", "awareness", "company", "contact", "resources"
}, "Seed must cover all seven public website pages"
assert sum(row["content_type"] == "text" for row in rows) >= 624, "Bilingual text inventory is incomplete"
assert sum(row["content_type"] == "image" for row in rows) >= 48, "Image inventory is incomplete"
assert all(row["is_published"] == 1 and row["is_visible"] == 1 for row in rows), "Initial records must be visible and published"
assert all(row["is_custom"] == 0 for row in rows), "Seeded HTML-linked entries must remain original website content"

logos = connection.execute(
    "SELECT content_key FROM cms_content WHERE page_slug='index' AND content_key LIKE 'index.logo.%'"
).fetchall()
assert len(logos) == 18, f"Expected 18 individually managed insurer logos, found {len(logos)}"

# Re-applying the content seed must not duplicate records.
connection.executescript((ROOT / "migrations" / "0002_seed_content.sql").read_text(encoding="utf-8"))
count_after_rerun = connection.execute("SELECT COUNT(*) FROM cms_content").fetchone()[0]
assert count_after_rerun == 692, "CMS content seed must be idempotent"

print("D1 CMS migrations validated: 692 records, 7 pages and 18 individually manageable insurer logos.")
