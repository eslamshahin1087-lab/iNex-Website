#!/usr/bin/env python3
"""Validate the iNex D1 schema, seed inventory and D1 statement-size limits."""

from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "migrations" / "0001_cms_schema.sql"
SEED_PATH = ROOT / "migrations" / "0002_seed_content.sql"
MEDIA_PATH = ROOT / "migrations" / "0003_cms_media.sql"
D1_MAX_STATEMENT_BYTES = 100_000


def split_sql_statements(sql: str) -> list[str]:
    statements: list[str] = []
    start = 0
    in_string = False
    index = 0
    while index < len(sql):
        char = sql[index]
        following = sql[index + 1] if index + 1 < len(sql) else ""
        if in_string:
            if char == "'" and following == "'":
                index += 2
                continue
            if char == "'":
                in_string = False
        elif char == "'":
            in_string = True
        elif char == ";":
            statement = sql[start:index + 1].strip()
            if statement:
                statements.append(statement)
            start = index + 1
        index += 1
    tail = sql[start:].strip()
    if tail:
        statements.append(tail)
    return statements


schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
seed_sql = SEED_PATH.read_text(encoding="utf-8")
media_sql = MEDIA_PATH.read_text(encoding="utf-8")
seed_statements = split_sql_statements(seed_sql)
statement_sizes = [len(statement.encode("utf-8")) for statement in seed_statements]
assert seed_statements, "CMS seed migration must contain SQL statements"
assert max(statement_sizes) < D1_MAX_STATEMENT_BYTES, (
    f"CMS seed contains a {max(statement_sizes)}-byte statement; "
    f"D1 maximum is {D1_MAX_STATEMENT_BYTES} bytes"
)

connection = sqlite3.connect(":memory:")
connection.row_factory = sqlite3.Row
connection.executescript(schema_sql)
connection.executescript(seed_sql)
connection.executescript(media_sql)

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
assert len(logos) == 18, f"Expected 18 insurer logos, found {len(logos)}"

# Every editable HTML hook must resolve to a matching seeded D1 record.
for page_slug in ("index", "platform", "solutions", "awareness", "company", "contact", "resources"):
    html = (ROOT / f"{page_slug}.html").read_text(encoding="utf-8")
    assert f'data-cms-page="{page_slug}"' in html, f"{page_slug}.html is missing its CMS page marker"
    for attribute, content_type in (
        ("data-cms-key", "text"),
        ("data-cms-image-key", "image"),
    ):
        keys = re.findall(rf'{attribute}="([^"]+)"', html)
        assert keys, f"{page_slug}.html is missing {attribute} hooks"
        for key in keys:
            row = connection.execute(
                "SELECT 1 FROM cms_content WHERE page_slug = ? AND content_key = ? AND content_type = ?",
                (page_slug, key, content_type),
            ).fetchone()
            assert row is not None, (
                f"{page_slug}.html {attribute}={key!r} has no matching "
                f"{content_type} record in the D1 seed"
            )

connection.executescript(seed_sql)
count_after_rerun = connection.execute("SELECT COUNT(*) FROM cms_content").fetchone()[0]
assert count_after_rerun == 692, "CMS content seed must be idempotent"

# The D1 media migration must create a bounded BLOB table for image uploads.
media_columns = {
    row["name"]: row["type"]
    for row in connection.execute("PRAGMA table_info(cms_media)").fetchall()
}
assert media_columns.get("media_key") == "TEXT", "CMS media key must be indexed text"
assert media_columns.get("content_type") == "TEXT", "CMS media content type must be stored"
assert media_columns.get("image_data") == "BLOB", "CMS image bytes must use a D1 BLOB"
assert media_columns.get("size_bytes") == "INTEGER", "CMS media size must be recorded"
sample_key = "00000000-0000-4000-8000-000000000001.png"
sample_bytes = sqlite3.Binary(bytes((137, 80, 78, 71, 13, 10, 26, 10)))
connection.execute(
    "INSERT INTO cms_media (media_key,content_type,image_data,size_bytes) VALUES (?,?,?,?)",
    (sample_key, "image/png", sample_bytes, 8),
)
stored_media = connection.execute(
    "SELECT image_data,size_bytes FROM cms_media WHERE media_key = ?",
    (sample_key,),
).fetchone()
assert bytes(stored_media["image_data"]) == bytes(sample_bytes), "CMS media BLOB must round-trip"
assert stored_media["size_bytes"] == 8, "CMS media byte count must round-trip"
try:
    connection.execute(
        "INSERT INTO cms_media (media_key,content_type,image_data,size_bytes) VALUES (?,?,?,?)",
        ("00000000-0000-4000-8000-000000000002.png", "image/png", sqlite3.Binary(b"x"), 1_500_001),
    )
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("CMS media migration must enforce the 1.5 MB image cap")

print(
    f"D1 CMS migrations validated: {len(rows)} records, 7 pages, 18 insurer logos; "
    f"{len(seed_statements)} seed statements (max {max(statement_sizes)} bytes each); "
    "D1 BLOB media schema and 1.5 MB cap validated."
)
