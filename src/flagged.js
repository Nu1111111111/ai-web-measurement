/**
 * Domain list for wave 2 (PROTOCOL.md §7): every comparable domain with a served block, a 402
 * or a content difference for any agent in wave 1, from either vantage point.
 *
 *   node src/flagged.js --label wave1-head --out config/wave2-head.txt
 *
 * Reads results/<label>/per-domain.csv (written by analyze.js).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: opt } = parseArgs({ options: { label: { type: 'string' }, out: { type: 'string' } } });
if (!opt.label || !opt.out) throw new Error('usage: node src/flagged.js --label wave1-head --out config/wave2-head.txt');
const ROOT = new URL('../', import.meta.url);

/** One CSV line, with quoted cells as analyze.js writes them. */
function cells(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out;
}

const [head, ...lines] = readFileSync(new URL(`results/${opt.label}/per-domain.csv`, ROOT), 'utf8').split(/\r?\n/).filter(Boolean);
const col = Object.fromEntries(cells(head).map((h, i) => [h, i]));
const flagged = new Map();
const why = { blocked: 0, payment: 0, 'content-differs': 0 };
for (const l of lines) {
  const x = cells(l);
  if (x[col.comparable] !== 'true') continue;
  const reasons = [];
  if (x[col.blocked] === 'true') reasons.push('blocked');
  if (x[col.payment] === 'true') reasons.push('payment');
  if (x[col.served] === 'content-differs') reasons.push('content-differs');
  if (!reasons.length) continue;
  const d = x[col.domain];
  if (!flagged.has(d)) flagged.set(d, new Set());
  for (const r of reasons) flagged.get(d).add(r);
}
for (const rs of flagged.values()) for (const r of rs) why[r]++;
writeFileSync(new URL(opt.out, ROOT), `${[...flagged.keys()].sort().join('\n')}\n`);
console.log(`${opt.out}: ${flagged.size} domains (with a served block ${why.blocked}, 402 ${why.payment}, content difference ${why['content-differs']})`);
