import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import api from '../api/admin.js';
import * as auth from '../src/lib/auth.js';

const originalEnv = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET
};
process.env.ADMIN_EMAIL = 'private-admin@horas.test';
process.env.ADMIN_PASSWORD = 'a-unique-admin-pass-2026';
process.env.ADMIN_SESSION_SECRET = 'long-secret-key-minimum-32-characters-test-only';

const saved = new Map();
const tempSession = new Map();
const store = map => ({
  getItem: k => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, String(v)),
  removeItem: k => map.delete(k)
});
globalThis.localStorage = store(saved);
globalThis.sessionStorage = store(tempSession);
globalThis.btoa = value => Buffer.from(value, 'binary').toString('base64');
globalThis.atob = value => Buffer.from(value, 'base64').toString('binary');

function callApi(method, body, cookie = '', origin = 'http://localhost:3000') {
  const headers = { host: 'localhost:3000', origin, cookie };
  const req = { method, body, headers, socket: { remoteAddress: '127.0.0.1' } };
  const res = { statusCode: 200, headers: {},
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    end(value) { this.payload = value; } };
  return api(req, res).then(() => ({ status: res.statusCode, data: JSON.parse(res.payload), headers: res.headers }));
}
let browserCookie = '';
globalThis.fetch = async (url, init) => {
  assert.equal(url, '/api/admin');
  const response = await callApi(init.method, init.body ? JSON.parse(init.body) : undefined, browserCookie);
  if (response.headers['set-cookie']) browserCookie = response.headers['set-cookie'].split(';')[0];
  return { ok: response.status >= 200 && response.status < 300, status: response.status,
    json: async () => response.data };
};

test('secrets are not embedded in browser auth script', () => {
  const source = readFileSync(new URL('../src/lib/auth.js', import.meta.url), 'utf8');
  assert.equal(source.includes('import.meta.env'), false);
  assert.equal(source.includes('VITE_ADMIN_'), false);
  assert.equal(source.includes('SUPABASE'), false);
});

test('admin login is checked by server, cookie HttpOnly, and signed sessions are validated', async () => {
  await assert.rejects(auth.signIn('private-admin@horas.test', 'not-the-pass'), /salah/);
  const admin = await auth.signIn('private-admin@horas.test', 'a-unique-admin-pass-2026');
  assert.equal(auth.getRole(admin), 'admin');
  assert.ok(browserCookie.startsWith('horas_admin_session='));
  assert.equal((await auth.getAuthenticatedUser()).email, 'private-admin@horas.test');
  const raw = await callApi('GET', undefined, browserCookie);
  assert.equal(raw.status, 200);
  assert.equal(raw.data.user.app_metadata.role, 'admin');
  const invalid = await callApi('GET', undefined, browserCookie + 'X');
  assert.equal(invalid.data.user, null);
  const cookieSet = await callApi('POST', {email:'private-admin@horas.test',password:'a-unique-admin-pass-2026'});
  assert.match(cookieSet.headers['set-cookie'], /HttpOnly/);
  assert.match(cookieSet.headers['set-cookie'], /SameSite=Strict/);
});

test('user registration works locally and never creates admin role', async () => {
  const result = await auth.signUp('Sahabat Samosir', 'user@example.com', 'test-user-pass-123');
  assert.equal(result.confirmEmail, false);
  assert.equal(auth.getRole(result.user), 'user');
  assert.equal(result.user.email, 'user@example.com');
  const rows = JSON.parse(saved.get('horas-local-users-v1'));
  assert.ok(rows[0].hash);
  assert.ok(rows[0].salt);
  assert.equal(rows[0].password, undefined);
  assert.equal(rows[0].hash.includes('test-user-pass-123'), false);
  assert.equal(rows[0].app_metadata, undefined);
  await assert.rejects(auth.signUp('Duplicate', 'user@example.com', 'test-user-pass-123'), /terdaftar/);
});

test('normal user can sign in after logout without admin permission', async () => {
  await auth.signOut();
  assert.equal(await auth.getAuthenticatedUser(), null);
  const user = await auth.signIn('user@example.com', 'test-user-pass-123');
  assert.equal(auth.getRole(user), 'user');
  assert.equal((await auth.getAuthenticatedUser()).email, 'user@example.com');
});

test('admin session is never granted by a client-side role assignment', async () => {
  const record = JSON.parse(saved.get('horas-local-users-v1'));
  record[0].role = 'admin';
  record[0].app_metadata = {role:'admin'};
  saved.set('horas-local-users-v1', JSON.stringify(record));
  const user = await auth.getAuthenticatedUser();
  assert.equal(auth.getRole(user), 'user');
});

test('cross-origin login rejected, logout clears admin cookie', async () => {
  const attack = await callApi('POST', {email:'private-admin@horas.test',password:'a-unique-admin-pass-2026'},'', 'https://attacker.example');
  assert.equal(attack.status, 403);
  await auth.signOut();
  assert.equal((await callApi('GET', undefined, browserCookie)).data.user, null);
});

test.after(() => {
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});
