const encoder = new TextEncoder();
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replaceAll("+", "-").replaceAll("/", "_");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminSession(email, secret, now = Date.now()) {
  if (typeof email !== "string" || !email || typeof secret !== "string" || secret.length < 32) {
    throw new TypeError("A valid administrator email and a session secret of at least 32 characters are required.");
  }

  const payload = {
    sub: email.toLowerCase(),
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomUUID()
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(token, expectedEmail, secret, now = Date.now()) {
  if (typeof token !== "string" || typeof expectedEmail !== "string" || typeof secret !== "string" || secret.length < 32) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  try {
    const key = await importHmacKey(secret);
    const isSignatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(parts[1]),
      encoder.encode(parts[0])
    );
    if (!isSignatureValid) return false;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    if (
      payload.sub !== expectedEmail.toLowerCase() ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= Math.floor(now / 1000) ||
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 16
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function constantTimeStringEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const a = new Uint8Array(leftDigest);
  const b = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export { SESSION_TTL_SECONDS };


export function getAdminConfigurationIssues(env = {}) {
  const issues = [];
  if (typeof env.INEX_ADMIN_EMAIL !== "string" || !env.INEX_ADMIN_EMAIL.trim().includes("@")) {
    issues.push("INEX_ADMIN_EMAIL is missing or invalid in the Production runtime.");
  }
  if (typeof env.INEX_ADMIN_PASSWORD !== "string" || env.INEX_ADMIN_PASSWORD.length < 24) {
    issues.push("INEX_ADMIN_PASSWORD is missing or shorter than the required 24 characters.");
  }
  if (typeof env.INEX_ADMIN_SESSION_SECRET !== "string" || env.INEX_ADMIN_SESSION_SECRET.length < 32) {
    issues.push("INEX_ADMIN_SESSION_SECRET is missing or shorter than the required 32 characters.");
  }
  return issues;
}


export function isSameOriginAdminRequest(request, requestUrl) {
  let expectedOrigin;
  try {
    expectedOrigin = requestUrl instanceof URL ? requestUrl.origin : new URL(requestUrl).origin;
  } catch {
    return false;
  }

  const originHeader = request.headers.get("Origin");
  if (originHeader && originHeader !== "null") {
    try {
      return new URL(originHeader).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  // Chrome and other modern browsers send Fetch Metadata even when Origin
  // is omitted from a same-origin HTML form POST.
  if (request.headers.get("Sec-Fetch-Site") === "same-origin") return true;

  // Fallback for older browsers. The login page should permit a same-origin
  // referrer; cross-origin or missing referrers remain rejected.
  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}
