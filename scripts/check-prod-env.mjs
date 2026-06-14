import fs from 'node:fs';
import path from 'node:path';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const optional = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_OPENWEATHER_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_GEMINI_MODEL',
];

function readDotEnvLocal() {
  try {
    const envPath = path.resolve('.env.local');
    if (!fs.existsSync(envPath)) return {};
    const out = {};
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

const localEnv = await readDotEnvLocal();
const valueFor = (key) => process.env[key] || localEnv[key] || '';
const missing = required.filter((key) => !valueFor(key));
const placeholder = [...required, ...optional].filter((key) => /your_|123456789|abc123/i.test(valueFor(key)));

if (missing.length || placeholder.length) {
  console.error('[env] Production environment is not ready.');
  if (missing.length) console.error(`Missing required: ${missing.join(', ')}`);
  if (placeholder.length) console.error(`Placeholder values: ${placeholder.join(', ')}`);
  process.exit(1);
}

console.log('[env] Required Firebase web environment is present.');

const absentOptional = optional.filter((key) => !valueFor(key));
if (absentOptional.length) {
  console.log(`[env] Optional feature keys not set: ${absentOptional.join(', ')}`);
}
