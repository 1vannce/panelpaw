// Combined web build for Vercel: landing site (site/) at /, Expo tracker app at /app.
// Output: dist/ (Next static export at the root, Expo web export in dist/app).
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'site');
const dist = path.join(root, 'dist');
const run = (cmd, cwd, env = {}) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

rmSync(dist, { recursive: true, force: true });

console.log('\n> Expo web export (base URL /app)');
run('npx expo export --platform web --output-dir dist/app', root, { EXPO_BASE_URL: '/app' });

console.log('\n> Landing site build');
if (!existsSync(path.join(site, 'node_modules'))) run('npm ci', site);
run('npm run build', site);

cpSync(path.join(site, 'out'), dist, { recursive: true });
console.log('\n> Done: dist/ (landing at /, app at /app)');
