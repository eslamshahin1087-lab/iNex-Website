/**
 * Binary media storage for the iNex Website CMS.
 * D1 returns BLOB columns as arrays of byte values through its Workers API.
 */
export const MAX_CMS_IMAGE_BYTES = 1_500_000;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);

export function toCmsMediaBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value) && value.every((byte) =>
    Number.isInteger(byte) && byte >= 0 && byte <= 255
  )) {
    return Uint8Array.from(value);
  }
  return null;
}

export async function storeCmsMedia(database, key, contentType, value) {
  if (!database || typeof database.prepare !== "function") {
    throw new TypeError("A D1 database binding is required to store CMS media.");
  }
  if (typeof key !== "string" || !key ||
      !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new TypeError("The CMS media key or content type is invalid.");
  }

  const bytes = toCmsMediaBytes(value);
  if (!bytes || bytes.byteLength < 1 || bytes.byteLength > MAX_CMS_IMAGE_BYTES) {
    throw new RangeError("The CMS image must be between 1 byte and 1.5 MB.");
  }

  // Copy the exact byte range into an ArrayBuffer before binding it as a D1 BLOB.
  const binary = bytes.slice().buffer;
  await database.prepare(
    "INSERT INTO cms_media (media_key,content_type,image_data,size_bytes) VALUES (?,?,?,?)"
  ).bind(key, contentType, binary, bytes.byteLength).run();

  return { key, sizeBytes: bytes.byteLength };
}

export async function getCmsMedia(database, key) {
  if (!database || typeof database.prepare !== "function") {
    throw new TypeError("A D1 database binding is required to read CMS media.");
  }

  const row = await database.prepare(
    "SELECT content_type,image_data,size_bytes FROM cms_media WHERE media_key = ? LIMIT 1"
  ).bind(key).first();

  if (!row) return null;

  const bytes = toCmsMediaBytes(row.image_data);
  const sizeBytes = Number(row.size_bytes);
  if (!bytes ||
      !Number.isSafeInteger(sizeBytes) ||
      sizeBytes < 1 ||
      sizeBytes > MAX_CMS_IMAGE_BYTES ||
      bytes.byteLength !== sizeBytes ||
      !ALLOWED_IMAGE_TYPES.has(row.content_type)) {
    throw new Error("The stored CMS image data is invalid.");
  }

  return { contentType: row.content_type, bytes, sizeBytes };
}

export async function deleteCmsMedia(database, key) {
  if (!database || typeof database.prepare !== "function") {
    throw new TypeError("A D1 database binding is required to delete CMS media.");
  }
  await database.prepare("DELETE FROM cms_media WHERE media_key = ?").bind(key).run();
}
