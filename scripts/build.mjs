import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Copy only public assets. Never publish repository metadata or deployment files.
const extensions = new Set(['.html', '.png', '.svg', '.ico', '.xml', '.txt', '.webmanifest', '.css', '.js', '.jpg', '.jpeg', '.webp', '.gif', '.woff', '.woff2', '.pdf']);
const excluded = new Set(['.git', '.github', 'node_modules', 'dist', 'scripts', 'docs', '.wrangler']);
async function copyPublic(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excluded.has(entry.name)) continue;
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyPublic(path.join(directory, entry.name), next);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      await mkdir(path.dirname(path.join(output, next)), { recursive: true });
      await cp(path.join(directory, entry.name), path.join(output, next));
    }
  }
}
await copyPublic(root);
console.log('Public website copied unchanged to dist/');
