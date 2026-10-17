import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import adminHandler from './api/admin.js';

// /api/admin behaves the same during local "npm run dev" as on Vercel.
// The non-prefixed ADMIN_* variables stay on the Node server, never in frontend JS.
function localAdminApi() {
  return {
    name: 'local-admin-api',
    configureServer(server) {
      server.middlewares.use('/api/admin', (req, res) => {
        Promise.resolve(adminHandler(req, res)).catch(() => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Layanan autentikasi gagal.' }));
        });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/admin', (req, res) => {
        Promise.resolve(adminHandler(req, res)).catch(() => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Layanan autentikasi gagal.' }));
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'ADMIN_');
  for (const key of ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET']) {
    if (env[key]) process.env[key] = env[key];
  }
  return { plugins: [react(), localAdminApi()], build: { target: 'es2022' }, server: { port: 3000 } };
});
