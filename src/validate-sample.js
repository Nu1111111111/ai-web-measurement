/**
 * Real-agent validation sample (PROTOCOL.md §7b).
 *
 *   node src/validate-sample.js --label wave1-head --run wave1-head-de-residential [--n 50 --seed 1]
 *
 * From results/<label>/per-domain.csv (written by analyze.js) takes the sites of <run> with an
 * AI-specific served block for GPTBot, ClaudeBot or PerplexityBot, draws n of them (seeded
 * partial Fisher-Yates, mulberry32, as in list.js) and writes results/<label>/validation/:
 *   sample.csv   one row per site x real agent to test, with the browser page's title and first
 *                heading as the reference and empty columns for the coding
 *   prompts.txt  the prompt per row, ready to paste into a fresh chat
 * Site names stay local (gitignored): no site is named outside the repo.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { decode } from './lib/decode.js';

const { values: opt } = parseArgs({ options: {
  label: { type: 'string', default: 'wave1-head' }, run: { type: 'string', default: 'wave1-head-de-residential' },
  n: { type: 'string', default: '50' }, seed: { type: 'string', default: '1' },
} });
const ROOT = new URL('../', import.meta.url);
const REAL = { gptbot: 'ChatGPT', claudebot: 'Claude', perplexitybot: 'Perplexity' };

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const rows = parseCsv(readFileSync(new URL(`results/${opt.label}/per-domain.csv`, ROOT), 'utf8'))
  .filter((x) => x.run === opt.run && REAL[x.arm] && x.aiSpecificBlock === 'true');
const bySite = new Map();
for (const x of rows) {
  if (!bySite.has(x.domain)) bySite.set(x.domain, { domain: x.domain, rank: Number(x.rank), arms: [] });
  bySite.get(x.domain).arms.push(x.arm);
}
// Pool in rank order, so the draw does not depend on CSV row order.
const pool = [...bySite.values()].sort((a, b) => a.rank - b.rank);
const K = Math.min(Number(opt.n), pool.length);
let s = Number(opt.seed) >>> 0;
const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
for (let i = 0; i < K; i++) {
  const j = i + Math.floor(rand() * (pool.length - i));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}
const sample = pool.slice(0, K).sort((a, b) => a.rank - b.rank);

const recs = new Map(readFileSync(new URL(`runs/${opt.run}/records.jsonl`, ROOT), 'utf8').split('\n').filter(Boolean)
  .map((l) => JSON.parse(l)).map((r) => [r.domain, r]));
const clean = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
function reference(domain) {
  const f = new URL(`runs/${opt.run}/raw/${encodeURIComponent(domain)}/browser1.html.gz`, ROOT);
  if (!existsSync(f)) return { title: '', h1: '' };
  const html = new TextDecoder('utf-8').decode(gunzipSync(readFileSync(f))).replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  return {
    title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').slice(0, 200),
    h1: clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').slice(0, 200),
  };
}

const out = [];
for (const site of sample) {
  const url = recs.get(site.domain)?.arms?.browser1?.finalUrl || `https://${site.domain}/`;
  const ref = reference(site.domain);
  for (const arm of ['gptbot', 'claudebot', 'perplexitybot'].filter((a) => site.arms.includes(a))) {
    out.push({ id: out.length + 1, rank: site.rank, domain: site.domain, url, blockedBot: arm, agent: REAL[arm], refTitle: ref.title, refH1: ref.h1,
      // Not "quote exactly": Claude declines verbatim quotes of web text, which would measure
      // the model's copyright policy instead of access (PROTOCOL.md §9, 2026-10-29).
      prompt: `Open ${url} and tell me the main heading on the page and, in one sentence of your own, what the page is about. If you cannot open the page, say so.`, date: '', answer: '', code: '', note: '' });
  }
}
const dir = new URL(`results/${opt.label}/validation/`, ROOT);
mkdirSync(dir, { recursive: true });
const cols = Object.keys(out[0]);
const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
writeFileSync(new URL('sample.csv', dir), '﻿' + [cols.join(','), ...out.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n') + '\r\n');
writeFileSync(new URL('prompts.txt', dir), out.map((r) => `#${r.id} ${r.agent}\r\n${r.prompt}\r\n`).join('\r\n'));
const per = out.reduce((m, r) => ((m[r.agent] = (m[r.agent] || 0) + 1), m), {});
console.log(`pool ${bySite.size} sites, drew ${sample.length}, ${out.length} checks:`, per);
