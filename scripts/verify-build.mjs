import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { site, downloads, settings } from '../site.config.mjs';

const html = await readFile('dist/index.html','utf8');
assert.ok(html.includes(`rel="canonical" href="${site.siteUrl}"`), 'canonical is the deployed page URL');
assert.ok(html.includes(`content="${site.absolute('og.png')}"`), 'absolute OG image');
assert.ok(html.includes('id="download"'), 'download anchor exists');
assert.ok(html.includes('lang="en"'), 'English page language');
assert.ok(!html.includes('href=""') && !html.includes('href="#"'), 'no empty links');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
const localPaths = new Set();
for (const [, raw] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const value = raw.replaceAll('&amp;','&');
  if (value.startsWith('#')) { assert.ok(ids.has(value.slice(1)),`missing anchor ${value}`); continue; }
  if (!value.startsWith('/')) continue;
  assert.ok(value.startsWith(site.base), `base missing from ${value}`);
  const url = new URL(value,site.origin);
  if (url.hash) { assert.ok(ids.has(url.hash.slice(1)), `missing anchor ${url.hash}`); continue; }
  let file = decodeURIComponent(url.pathname.slice(site.base.length));
  if (!file || file.endsWith('/')) file += 'index.html';
  localPaths.add(file);
}
for (const [, list] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
  for (const item of list.split(',')) {
    const url = item.trim().split(/\s+/)[0];
    assert.ok(url.startsWith(site.base), `srcset prefix: ${url}`);
    localPaths.add(decodeURIComponent(url.slice(site.base.length)));
  }
}
for (const file of localPaths) assert.ok((await stat(path.join('dist',file))).isFile(), `asset missing: ${file}`);
for (const file of await readdir('dist/_astro')) {
  if (!file.endsWith('.css')) continue;
  const css=await readFile(`dist/_astro/${file}`,'utf8');
  for (const [, raw] of css.matchAll(/url\(([^)]+)\)/g)) {
    const url=raw.replaceAll(/['"]/g,'');
    if (url.startsWith('data:')) continue;
    const relative=url.startsWith(site.base) ? url.slice(site.base.length) : path.join('_astro',url);
    assert.ok((await stat(path.join('dist',relative))).isFile(), `font/CSS asset missing: ${url}`);
  }
}
const sitemap=await readFile('dist/sitemap-0.xml','utf8');
assert.ok(sitemap.includes(`<loc>${site.siteUrl}</loc>`), 'sitemap homepage');
assert.ok(!sitemap.includes('#download') && !sitemap.includes('404'), 'sitemap excludes fragments and errors');
assert.ok((await readFile('dist/robots.txt','utf8')).includes(site.absolute('sitemap-index.xml')));
const {data,info}=await sharp('dist/download-qr.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const qr=jsQR(new Uint8ClampedArray(data),info.width,info.height);
assert.equal(qr?.data,site.downloadUrl,'QR decodes to the current deployed download section');
for (const [name,option] of Object.entries(downloads)) {
  if(option.kind==='soon') assert.ok(html.includes(`data-platform="${name==='ios'?'iOS':'Android'}" data-status="soon"`));
}
for (const key of ['CONTACT_URL','PRIVACY_URL','TERMS_URL']) {
  if(!settings[key]) assert.ok(!html.includes(`>${{CONTACT_URL:'Contact',PRIVACY_URL:'Privacy',TERMS_URL:'Terms'}[key]}</a>`),`no invented ${key}`);
}
console.log(`Verified ${localPaths.size} page assets, fonts, anchors, metadata, sitemap and QR for ${site.siteUrl}`);
