// Independent check of RESULTS.md (node src/check-results-md.js): recount every per-agent cell from per-domain.csv
// (row-level data) and check that RESULTS.md shows exactly that k/n, and that every
// percent in RESULTS.md equals k/n rounded.
import { readFileSync } from 'node:fs';
const REPO = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const md = readFileSync(REPO + 'RESULTS.md', 'utf8');
let checked = 0, bad = 0;

// 1. every "p % (k/n)" is arithmetically consistent
for (const m of md.matchAll(/([\d.]+) % \((\d+)\/(\d+)\)/g)) {
  checked++;
  if ((100 * m[2] / m[3]).toFixed(1) !== m[1]) { bad++; console.log('percent mismatch', m[0]); }
}
console.log(`arithmetic: ${checked} shares checked, ${bad} wrong`);

// 2. per-agent table cells recounted from the row-level CSV
const cells = (line) => { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
let rowsChecked = 0, rowsBad = 0;
for (const label of ['wave1-head', 'wave1-tail', 'wave2-head', 'wave2-tail']) {
  const [h, ...ls] = readFileSync(`${REPO}results/${label}/per-domain.csv`, 'utf8').split(/\r?\n/).filter(Boolean);
  const col = Object.fromEntries(cells(h).map((x, i) => [x, i]));
  const agg = {};
  for (const l of ls) {
    const x = cells(l);
    if (x[col.comparable] !== 'true') continue;
    const k = `${x[col.run]}|${x[col.arm]}`;
    const a = (agg[k] ??= { n: 0, decl: 0, served: 0, ai: 0, pay: 0, diff: 0 });
    a.n++;
    if (x[col.declared] === 'full-block') a.decl++;
    if (x[col.blocked] === 'true') a.served++;
    if (x[col.aiSpecificBlock] === 'true') a.ai++;
    if (x[col.payment] === 'true') a.pay++;
    if (x[col.aiSpecificDiff] === 'true') a.diff++;
  }
  for (const [k, a] of Object.entries(agg)) {
    const [run, arm] = k.split('|');
    const section = md.split(`### ${run}\n`)[1].split('\n### ')[0];
    const row = section.split('\n').find((l) => l.startsWith(`| ${arm} |`));
    const got = [...row.matchAll(/\((\d+)\/(\d+)\)/g)].map((m) => `${m[1]}/${m[2]}`);
    const want = [a.decl, a.served, a.ai, a.pay, a.diff].map((v) => `${v}/${a.n}`);
    rowsChecked++;
    if (got.join() !== want.join()) { rowsBad++; console.log('MISMATCH', run, arm, got, want); }
  }
}
console.log(`recount from per-domain.csv: ${rowsChecked} agent rows (5 numbers each), ${rowsBad} wrong`);

