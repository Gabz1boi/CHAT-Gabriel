/**
 * Auth without a database:
 * - Admin: same-origin server endpoint reading ADMIN_* from .env.local/Vercel.
 * - Visitors: browser-local registration, PBKDF2 password hashes in localStorage.
 * Visitor accounts exist only in the same browser, never shared across devices.
 */
const USERS_KEY = 'horas-local-users-v1';
const SESSION_KEY = 'horas-local-session-v1';
const ITERATIONS = 210_000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthError extends Error {
  constructor(message) { super(message); this.name = 'AuthError'; }
}

function localAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function toUser(account) {
  return { id: account.id, email: account.email,
    user_metadata: { name: account.name }, app_metadata: { role: 'user' } };
}
function bytesToBase64(bytes) {
  let binary = '';
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary);
}
function base64ToBytes(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return bytesToBase64(new Uint8Array(result));
}
function sameString(a, b) {
  if (a.length !== b.length) return false;
  let match = 0;
  for (let i = 0; i < a.length; i++) match |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return match === 0;
}
async function requestAdmin(method, data) {
  let response;
  try {
    response = await fetch('/api/admin', {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      ...(data ? { body: JSON.stringify(data) } : {})
    });
  } catch { throw new AuthError('Server login admin tidak dapat dihubungi. Jalankan npm run dev atau cek deployment Vercel.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new AuthError(result.error || 'Layanan admin belum tersedia.');
  return result;
}

export function getRole(user) { return user?.app_metadata?.role === 'admin' ? 'admin' : 'user'; }

export async function getAuthenticatedUser() {
  // An admin session is only recognized when validated by the server.
  try {
    const response = await requestAdmin('GET');
    if (response.user) return response.user;
  } catch { /* public and local-user features still work without admin config */ }
  let storedId;
  try { storedId = sessionStorage.getItem(SESSION_KEY); }
  catch { return null; }
  if (!storedId) return null;
  const account = localAccounts().find(row => row.id === storedId);
  if (!account) { sessionStorage.removeItem(SESSION_KEY); return null; }
  return toUser(account);
}

export async function signUp(name, email, password) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 80) throw new AuthError('Nama harus 2–80 karakter.');
  if (!emailPattern.test(cleanEmail) || cleanEmail.length > 254) throw new AuthError('Alamat email tidak valid.');
  if (String(password).length < 8 || String(password).length > 128) throw new AuthError('Kata sandi harus 8–128 karakter.');
  const accounts = localAccounts();
  if (accounts.some(user => user.email === cleanEmail)) throw new AuthError('Email telah terdaftar pada browser ini. Silakan masuk.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account = { id: crypto.randomUUID(), email: cleanEmail, name: cleanName,
    salt: bytesToBase64(salt), hash: await derive(password, salt) };
  accounts.push(account);
  try { localStorage.setItem(USERS_KEY, JSON.stringify(accounts)); sessionStorage.setItem(SESSION_KEY, account.id); }
  catch { throw new AuthError('Browser tidak mengizinkan penyimpanan akun lokal.'); }
  return { confirmEmail: false, user: toUser(account) };
}

export async function signIn(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const found = localAccounts().find(user => user.email === cleanEmail);
  if (found) {
    const calculated = await derive(password, base64ToBytes(found.salt));
    if (sameString(calculated, found.hash)) {
      sessionStorage.setItem(SESSION_KEY, found.id);
      return toUser(found);
    }
  }
  // The admin's email/password never appear in frontend JS or the registration UI.
  const response = await requestAdmin('POST', { email: cleanEmail, password });
  return response.user;
}

export async function signOut() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* no-op */ }
  try { await requestAdmin('DELETE'); } catch { /* local logout still finishes */ }
}
