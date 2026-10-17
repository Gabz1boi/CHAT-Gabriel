import { readFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();
const files=['src/App.jsx','src/main.jsx','src/styles.css','index.html','vercel.json','api/admin.js','src/lib/auth.js','.env.example','.gitignore'];
for (const file of files){if(!existsSync(join(root,file)))throw new Error(`Missing ${file}`);}
const app=readFileSync(join(root,'src/App.jsx'),'utf8');
const style=readFileSync(join(root,'src/styles.css'),'utf8');
const settings=JSON.parse(readFileSync(join(root,'vercel.json'),'utf8'));
const requirements=[['Credit Gabriel Ignasius Sinaga',app.includes('Gabriel Ignasius Sinaga')],['8 subsektor',app.includes('Aplikasi & Game')],['Katalog publik',app.includes('function Catalog()')],['Dashboard',app.includes('function Dashboard()')],['CRUD tambah/edit',app.includes('function EditModal(')],['Latar putih',style.includes('background:#fff')],['Responsive',style.includes('@media(max-width:540px)')],['Animations',style.includes('@keyframes rise')],['Vercel SPA rewrite',settings.rewrites?.some(r=>r.destination==='/index.html')],['No Supabase',!app.includes('SUPABASE')&&!app.includes('authConfigured')],['Masuk / Daftar',app.includes('function Login({initialTab')],['Auth API without frontend secrets',readFileSync(join(root,'src/lib/auth.js'),'utf8').includes("'/api/admin'")],['Credentials excluded from Git',readFileSync(join(root,'.gitignore'),'utf8').includes('.env.local')]];
for(const [label,ok] of requirements){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)process.exitCode=1;}
