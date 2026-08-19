import crypto from "node:crypto";

const COOKIE = "reach_sid";
const sessions = new Map();

export function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const out = {};
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export function getSession(req) {
  const sid = parseCookies(req)[COOKIE];
  if (!sid) return null;
  return sessions.get(sid) || null;
}

export function createSession(res, data, { secure } = {}) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions.set(sid, { id: sid, createdAt: Date.now(), ...data });
  const parts = [
    `${COOKIE}=${sid}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=604800",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
  return sessions.get(sid);
}

export function saveSession(session) {
  if (session?.id) sessions.set(session.id, session);
}

export function destroySession(req, res) {
  const sid = parseCookies(req)[COOKIE];
  if (sid) sessions.delete(sid);
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0`);
}

export function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";
  const proto = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
