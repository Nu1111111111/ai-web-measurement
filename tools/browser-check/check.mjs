/**
 * Real-browser check (PROTOCOL.md §9, 2026-10-29, exploratory). The study's "browser" arm is our
 * HTTP client with a browser user agent: same TLS stack as every other arm, no JavaScript. This
 * tool opens a random sample of head homepages once in a real Microsoft Edge (Playwright,
 * headless) from the same residential line and records what a real browser gets:
 *   - comparable sites: does the real browser see the same page (title) as our browser-UA fetch?
 *   - not comparable sites: does the real browser get a readable page where our client did not?
 *
 *   cd tools/browser-check && npm install && node check.mjs --run ../../runs/wave1-head-de-residential --n 300
 *
 * Writes ../../results/wave1-head/browsercheck/visits.jsonl (names sites, git-ignored) and
 * ../../results/wave1-head/browsercheck-summary.json (counts only). Resumable: sites already in
 * visits.jsonl are skipped.
 */
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { features } from '../../src/lib/features.js';
import { wilson } from '../../src/stats.js';

const { values: opt } = parseArgs({ options: {
  run: { type: 'string' }, n: { type: 'string', default: '300' }, seed: { type: 'string', default: '1' },
  label: { type: 'string', default: 'wave1-head' }, gap: { type: 'string', default: '2000' },
} });
const N = +opt.n;
const ROOT = new URL('../../', import.meta.url);
const OUT = new URL(`results/${opt.label}/browsercheck/`, ROOT);
mkdirSync(OUT, { recursive: true });
const VISITS = new URL('visits.jsonl', OUT);

// sample: probed head domains, split by comparability, seeded shuffle
const recs = new Map();
for (const l of readFileSync(new URL('records.jsonl', pathToFileURL(`${resolve(opt.run)}/`)), 'utf8').split('\n')) {
  if (!l) continue;
  const r = JSON.parse(l);
  recs.set(r.domain, r);
}
const probed = [...recs.values()].filter((r) => r.arms && !r.armsSkipped && !r.crash && !r.skipped).sort((a, b) => a.rank - b.rank);
let s = +opt.seed >>> 0;
const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const comparable = shuffle(probed.filter((r) => r.arms.browser2?.class === 'same')).slice(0, N);
const notComparable = shuffle(probed.filter((r) => r.arms.browser2?.class !== 'same')).slice(0, N);
const sample = [...comparable.map((r) => ({ r, group: 'comparable' })), ...notComparable.map((r) => ({ r, group: 'not-comparable' }))];

const done = new Set(existsSync(VISITS) ? readFileSync(VISITS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).domain) : []);
const norm = (t) => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
const readable = (v) => v.status > 0 && v.status < 400 && !v.challenge && v.words >= 20;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const [i, { r, group }] of sample.entries()) {
  if (done.has(r.domain)) continue;
  const url = r.arms.browser1?.finalUrl || `https://${r.domain}/`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const v = { domain: r.domain, rank: r.rank, group, url, at: new Date().toISOString() };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // let a JS challenge resolve or a client-side page render
    const f = features(await page.content());
    Object.assign(v, { status: resp?.status() ?? 0, finalUrl: page.url(), title: f.title, words: f.words, challenge: f.challenge });
  } catch (e) {
    Object.assign(v, { status: 0, error: String(e.message || e).split('\n')[0].slice(0, 200) });
  }
  const b1 = r.arms.browser1 || {};
  Object.assign(v, {
    ours: { status: b1.status, class2: r.arms.browser2?.class, title: b1.title, words: b1.words, challenge: b1.challenge },
    realReadable: readable(v),
    sameTitle: !!v.title && norm(v.title) === norm(b1.title),
  });
  appendFileSync(VISITS, JSON.stringify(v) + '\n');
  await ctx.close();
  if (i % 25 === 0) console.log(`${i + 1}/${sample.length} ${group} ${v.status} ${v.realReadable ? 'readable' : '-'}`);
  await new Promise((res) => setTimeout(res, +opt.gap));
}
await browser.close();

// summary without site names
const V = readFileSync(VISITS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const share = (k, n) => ({ k, n, ...wilson(k, n) });
const C = V.filter((v) => v.group === 'comparable');
const X = V.filter((v) => v.group === 'not-comparable');
// why our two browser-UA fetches disagreed: our client was refused (blocked, challenge,
// no readable page) or the page changed between the two fetches
const oursRefused = (v) => !(v.ours.status > 0 && v.ours.status < 400 && !v.ours.challenge && v.ours.words >= 20);
const summary = {
  label: opt.label, generated: new Date().toISOString(), browser: 'Microsoft Edge (Playwright, headless)', exploratory: true,
  comparable: { n: C.length, realReadable: share(C.filter((v) => v.realReadable).length, C.length),
    sameTitle: share(C.filter((v) => v.sameTitle).length, C.length) },
  notComparable: { n: X.length,
    oursRefused: share(X.filter(oursRefused).length, X.length),
    realReadable: share(X.filter((v) => v.realReadable).length, X.length),
    oursRefusedRealReadable: share(X.filter((v) => oursRefused(v) && v.realReadable).length, X.length) },
};
writeFileSync(new URL(`results/${opt.label}/browsercheck-summary.json`, ROOT), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
