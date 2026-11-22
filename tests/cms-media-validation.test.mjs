import test from "node:test";
import assert from "node:assert/strict";
import { hasValidImageSignature } from "../functions/admin/media-validation.mjs";

test("JPEG signature must match image/jpeg", () => {
  assert.equal(hasValidImageSignature("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(hasValidImageSignature("image/jpeg", Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), false);
});

test("PNG signature must match all eight bytes", () => {
  assert.equal(hasValidImageSignature("image/png", Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])), true);
  assert.equal(hasValidImageSignature("image/png", Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x00])), false);
});

test("WebP requires RIFF and WEBP container identifiers", () => {
  assert.equal(hasValidImageSignature("image/webp", new TextEncoder().encode("RIFF0000WEBP")), true);
  assert.equal(hasValidImageSignature("image/webp", new TextEncoder().encode("RIFF0000NOPE")), false);
});

test("AVIF requires an ISO-BMFF ftyp box and AVIF compatible brand", () => {
  const avif = new TextEncoder().encode("\u0000\u0000\u0000\u0018ftypavifmif1avif");
  const wrongBrand = new TextEncoder().encode("\u0000\u0000\u0000\u0018ftypmif1miaf");
  assert.equal(hasValidImageSignature("image/avif", avif), true);
  assert.equal(hasValidImageSignature("image/avif", wrongBrand), false);
});

test("unsupported types, truncated files and malformed values are rejected", () => {
  assert.equal(hasValidImageSignature("image/svg+xml", new TextEncoder().encode("<svg")), false);
  assert.equal(hasValidImageSignature("image/png", Uint8Array.from([0x89,0x50])), false);
  assert.equal(hasValidImageSignature("image/jpeg", "not bytes"), false);
  assert.equal(hasValidImageSignature("", new Uint8Array()), false);
});
