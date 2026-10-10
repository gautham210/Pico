import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { places, profileImage } from '../src/data/places.js';

// Copies original export URLs into the application; never changes the exports.
const root = 'stitch frontend';
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const inventory = [];
for (const file of await walk(root)) {
  if (!file.endsWith('.html')) continue;
  const html = await fs.readFile(file, 'utf8');
  const images = [...new Set(html.match(/https:\/\/lh3\.googleusercontent\.com\/[^'"\s)<>]+/g) || [])];
  const headings = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/g)].map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
  inventory.push({ file: file.replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(html).digest('hex'), headings, images });
}
await fs.mkdir('public/assets', { recursive: true });
const home = inventory.find(x => x.file.includes('where_to_next'));
const requests = [...places.map(p => [p.id, p.image]), ['profile', profileImage], ['home-coast', home.images[1] || home.images[0]]];
// The exact home hero is a CSS background, independent of header/profile images.
const homeHtml = await fs.readFile(home.file, 'utf8');
requests.at(-1)[1] = homeHtml.match(/background-image: url\('(https:[^']+)'\)/)?.[1] || requests.at(-1)[1];
const assets = [];
for (const [name, url] of requests) {
  if (!url.startsWith('https:')) continue;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Source image unavailable: ${name}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const file = `public/assets/${name}.jpg`;
  await fs.writeFile(file, bytes);
  assets.push({ name, url, file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
await fs.writeFile('tests/source-inventory.json', JSON.stringify(inventory, null, 2) + '\n');
await fs.writeFile('public/assets/provenance.json', JSON.stringify(assets, null, 2) + '\n');
console.log(`Inventoried ${inventory.length} HTML exports; cached ${assets.length} original source images without recompression.`);
