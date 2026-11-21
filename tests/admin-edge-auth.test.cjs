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
  const changedSignature = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
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


test("identifies missing or undersized runtime bindings without exposing their values", () => {
  const valid = {
    INEX_ADMIN_EMAIL: "administrator@example.com",
    INEX_ADMIN_PASSWORD: "a".repeat(32),
    INEX_ADMIN_SESSION_SECRET: "b".repeat(64)
  };
  assert.deepEqual(auth.getAdminConfigurationIssues(valid), []);

  assert.deepEqual(
    auth.getAdminConfigurationIssues({ ...valid, INEX_ADMIN_EMAIL: "" }),
    ["INEX_ADMIN_EMAIL is missing or invalid in the Production runtime."]
  );
  assert.deepEqual(
    auth.getAdminConfigurationIssues({ ...valid, INEX_ADMIN_PASSWORD: "short" }),
    ["INEX_ADMIN_PASSWORD is missing or shorter than the required 24 characters."]
  );
  assert.deepEqual(
    auth.getAdminConfigurationIssues({ ...valid, INEX_ADMIN_SESSION_SECRET: "short" }),
    ["INEX_ADMIN_SESSION_SECRET is missing or shorter than the required 32 characters."]
  );
  assert.deepEqual(
    auth.getAdminConfigurationIssues({}),
    [
      "INEX_ADMIN_EMAIL is missing or invalid in the Production runtime.",
      "INEX_ADMIN_PASSWORD is missing or shorter than the required 24 characters.",
      "INEX_ADMIN_SESSION_SECRET is missing or shorter than the required 32 characters."
    ]
  );
  assert.equal(JSON.stringify(auth.getAdminConfigurationIssues(valid)).includes(valid.INEX_ADMIN_PASSWORD), false);
  assert.equal(JSON.stringify(auth.getAdminConfigurationIssues(valid)).includes(valid.INEX_ADMIN_SESSION_SECRET), false);
});


test("accepts an explicit same-origin header", () => {
  const target = new URL("https://inex-website.pages.dev/admin/__login");
  const request = new Request(target, { method: "POST", headers: { Origin: target.origin } });
  assert.equal(auth.isSameOriginAdminRequest(request, target), true);
});

test("rejects an explicitly cross-origin request even if Fetch Metadata claims same-origin", () => {
  const target = new URL("https://inex-website.pages.dev/admin/__login");
  const request = new Request(target, {
    method: "POST",
    headers: { Origin: "https://attacker.example", "Sec-Fetch-Site": "same-origin" }
  });
  assert.equal(auth.isSameOriginAdminRequest(request, target), false);
});

test("accepts same-origin Fetch Metadata when a browser omits Origin", () => {
  const target = new URL("https://inex-website.pages.dev/admin/__login");
  const request = new Request(target, { method: "POST", headers: { "Sec-Fetch-Site": "same-origin" } });
  assert.equal(auth.isSameOriginAdminRequest(request, target), true);
});

test("uses a same-origin Referer only when Origin and Fetch Metadata are absent", () => {
  const target = new URL("https://inex-website.pages.dev/admin/__login");
  const good = new Request(target, { method: "POST", headers: { Referer: "https://inex-website.pages.dev/admin/" } });
  const bad = new Request(target, { method: "POST", headers: { Referer: "https://attacker.example/" } });
  assert.equal(auth.isSameOriginAdminRequest(good, target), true);
  assert.equal(auth.isSameOriginAdminRequest(bad, target), false);
});

test("rejects requests with no verifiable same-origin signal", () => {
  const target = new URL("https://inex-website.pages.dev/admin/__login");
  const request = new Request(target, { method: "POST" });
  assert.equal(auth.isSameOriginAdminRequest(request, target), false);
});
