#!/usr/bin/env python3
"""Validate the iNex D1 schema, seed inventory and D1 statement-size limits."""

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "migrations" / "0001_cms_schema.sql"
SEED_PATH = ROOT / "migrations" / "0002_seed_content.sql"
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

connection.executescript(seed_sql)
count_after_rerun = connection.execute("SELECT COUNT(*) FROM cms_content").fetchone()[0]
assert count_after_rerun == 692, "CMS content seed must be idempotent"

print(
    f"D1 CMS migrations validated: {len(rows)} records, 7 pages, 18 insurer logos; "
    f"{len(seed_statements)} seed statements (max {max(statement_sizes)} bytes each)."
)
