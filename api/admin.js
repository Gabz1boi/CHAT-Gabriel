/**
 * Server-only administrator authentication (Vercel Function).
 * No database, no Supabase, and NO VITE_ secrets in the browser bundle.
 * The same handler is mounted by Vite middleware for local development.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'horas_admin_session';
const SESSION_LIFETIME = 8 * 60 * 60;
const MAX_BODY_BYTES = 4096;
const attempts = new Map();

const encode = value => Buffer.from(value).toString('base64url');
const hash = value => createHash('sha256').update(value).digest();
const hmac = (payload, secret) => createHmac('sha256', secret).update(payload).digest();
function constantTimeMatch(a, b) {
  return timingSafeEqual(hash(String(a)), hash(String(b)));
}
function getConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!email || !password || !secret || password.length < 12 || secret.length < 32) return null;
  return { email, password, secret };
}
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Cookie');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
function cookieValue(req) {
  const raw = String(req.headers.cookie || '').split(';').map(part => part.trim());
  const pair = raw.find(part => part.startsWith(`${COOKIE}=`));
  return pair ? pair.slice(COOKIE.length + 1) : '';
}
function authorized(req, config) {
  const value = cookieValue(req);
  const parts = value.split('.');
  if (parts.length !== 2 || parts.some(part => !part || part.length > 1024)) return false;
  const [payload, signature] = parts;
  let received;
  try { received = Buffer.from(signature, 'base64url'); }
  catch { return false; }
  const expected = hmac(payload, config.secret);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed.role === 'admin' && parsed.email === config.email &&
      Number.isSafeInteger(parsed.exp) && parsed.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
function isSecure(req) {
  return Boolean(process.env.VERCEL) || req.socket?.encrypted === true;
}
function setCookie(req, res, value, age) {
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${isSecure(req) ? '; Secure' : ''}`);
}
function csrfAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients cannot read cross-origin cookies
  try {
    const url = new URL(origin);
    return url.host === req.headers.host && (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  } catch { return false; }
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
function locked(ip) {
  const now = Date.now();
  if (attempts.size > 1000) for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const entry = attempts.get(ip);
  return entry && entry.until > now && entry.count >= 6;
}
function recordFailure(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  attempts.set(ip, current?.until > now
    ? { count: current.count + 1, until: current.until }
    : { count: 1, until: now + 60_000 });
}

export default async function handler(req, res) {
  const config = getConfig();
  if (!config) return json(res, 503, { error: 'Konfigurasi admin belum disiapkan oleh pengelola.' });
  if (req.method === 'GET') {
    if (!authorized(req, config)) return json(res, 200, { user: null });
    return json(res, 200, { user: {
      id: 'server-admin', email: config.email, user_metadata: { name: 'Administrator' },
      app_metadata: { role: 'admin' }
    } });
  }
  if (req.method === 'DELETE') {
    if (!csrfAllowed(req)) return json(res, 403, { error: 'Asal permintaan tidak diizinkan.' });
    setCookie(req, res, '', 0);
    return json(res, 200, { ok: true });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { error: 'Metode tidak didukung.' });
  }
  if (!csrfAllowed(req)) return json(res, 403, { error: 'Asal permintaan tidak diizinkan.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (locked(ip)) return json(res, 429, { error: 'Terlalu banyak percobaan login. Tunggu satu menit.' });
  let data;
  try { data = await readBody(req); }
  catch { return json(res, 400, { error: 'Data login tidak valid.' }); }
  if (typeof data?.email !== 'string' || typeof data?.password !== 'string' || data.email.length > 254 || data.password.length > 128) {
    return json(res, 400, { error: 'Email atau kata sandi tidak valid.' });
  }
  if (!constantTimeMatch(data.email.trim().toLowerCase(), config.email) ||
      !constantTimeMatch(data.password, config.password)) {
    recordFailure(ip);
    return json(res, 401, { error: 'Email atau kata sandi salah.' });
  }
  attempts.delete(ip);
  const payload = encode(JSON.stringify({ role: 'admin', email: config.email, exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME, nonce: randomBytes(12).toString('hex') }));
  const token = `${payload}.${hmac(payload, config.secret).toString('base64url')}`;
  setCookie(req, res, token, SESSION_LIFETIME);
  return json(res, 200, { user: {
    id: 'server-admin', email: config.email, user_metadata: { name: 'Administrator' },
    app_metadata: { role: 'admin' }
  } });
}
