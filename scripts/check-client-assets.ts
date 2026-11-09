import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'apps/learner/dist';
const secretNames = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'DATABASE_URL'];
let checked = 0;
async function walk(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(js|html|css)$/.test(path)) {
      checked++;
      const text = await readFile(path, 'utf8');
      if (/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|server-only|sb_secret_[A-Za-z0-9_-]{10,}/.test(text)) throw new Error(`Server material in browser asset: ${path}`);
      for (const name of secretNames) {
        const value = process.env[name];
        if (value && value.length >= 10 && text.includes(value)) throw new Error(`Value of ${name} found in browser asset: ${path}`);
      }
    }
  }
}
await walk(root);
if (!checked) throw new Error('No browser assets were checked');
console.log(`Client asset scan checked ${checked} files`);
