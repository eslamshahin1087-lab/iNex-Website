const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");

let auth;
test.before(async () => {
  auth = await import("../functions/admin/auth.mjs");
});

const email = "eslam.shahin1087@gmail.com";
const sessionSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const fixedNow = Date.UTC(2026, 10, 21, 12, 0, 0);

test("creates a signed admin session and accepts it for its intended administrator", async () => {
  const token = await auth.createAdminSession(email, sessionSecret, fixedNow);
  assert.equal(typeof token, "string");
  assert.equal(await auth.verifyAdminSession(token, email, sessionSecret, fixedNow + 1000), true);
});

test("rejects a session presented for a different account", async () => {
  const token = await auth.createAdminSession(email, sessionSecret, fixedNow);
  assert.equal(await auth.verifyAdminSession(token, "other@example.com", sessionSecret, fixedNow), false);
});

test("rejects expired sessions", async () => {
  const token = await auth.createAdminSession(email, sessionSecret, fixedNow);
  const afterExpiry = fixedNow + (auth.SESSION_TTL_SECONDS + 1) * 1000;
  assert.equal(await auth.verifyAdminSession(token, email, sessionSecret, afterExpiry), false);
});

test("rejects altered session payloads and signatures", async () => {
  const token = await auth.createAdminSession(email, sessionSecret, fixedNow);
  const [payload, signature] = token.split(".");
  const changedPayload = (payload[0] === "A" ? "B" : "A") + payload.slice(1);
  const changedSignature = signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");
  assert.equal(await auth.verifyAdminSession(changedPayload + "." + signature, email, sessionSecret, fixedNow), false);
  assert.equal(await auth.verifyAdminSession(payload + "." + changedSignature, email, sessionSecret, fixedNow), false);
});

test("rejects malformed tokens and weak session secrets", async () => {
  assert.equal(await auth.verifyAdminSession("", email, sessionSecret, fixedNow), false);
  assert.equal(await auth.verifyAdminSession("not-a-session", email, sessionSecret, fixedNow), false);
  assert.equal(await auth.verifyAdminSession("a.b", email, "short", fixedNow), false);
  await assert.rejects(() => auth.createAdminSession(email, "short", fixedNow), TypeError);
});

test("compares credentials without an early character-by-character exit", async () => {
  assert.equal(await auth.constantTimeStringEqual("administrator@example.com", "administrator@example.com"), true);
  assert.equal(await auth.constantTimeStringEqual("administrator@example.com", "attacker@example.com"), false);
  assert.equal(await auth.constantTimeStringEqual(null, "administrator@example.com"), false);
});
