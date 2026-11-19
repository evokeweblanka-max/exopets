import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "exopets_admin";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function sign(payload) {
  return createHmac("sha256", process.env.SESSION_SECRET || "missing-secret")
    .update(payload)
    .digest("base64url");
}

export function validCredentials(email, password) {
  return safeEqual(email?.toLowerCase(), (process.env.ADMIN_EMAIL || "admin@exopetscolombo.com").toLowerCase()) &&
    safeEqual(password, process.env.ADMIN_PASSWORD || "disabled");
}

export function createSessionCookie() {
  const expiresAt = Date.now() + SESSION_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString("base64url");
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_AGE_SECONDS}; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAdmin(req) {
  const cookie = req.headers.cookie || "";
  const value = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export function json(res, status, data, extra = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  Object.entries(extra).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
