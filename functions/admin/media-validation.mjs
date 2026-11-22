const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function ascii(bytes, start, end) {
  return String.fromCharCode(...bytes.slice(start, end));
}

/**
 * Validate the binary signature against the declared media type.
 * This is a format check, not a full decoder or malware scanner.
 */
export function hasValidImageSignature(mimeType, bytes) {
  if (!MIME_TYPES.has(mimeType) || !(bytes instanceof Uint8Array)) return false;

  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length &&
      signature.every((value, index) => bytes[index] === value);
  }

  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      ascii(bytes, 0, 4) === "RIFF" &&
      ascii(bytes, 8, 12) === "WEBP";
  }

  if (mimeType === "image/avif") {
    if (bytes.length < 16 || ascii(bytes, 4, 8) !== "ftyp") return false;
    const brands = ascii(bytes, 8, Math.min(bytes.length, 64));
    return brands.includes("avif") || brands.includes("avis");
  }

  return false;
}
