/**
 * Summary of the real-agent validation (PROTOCOL.md §7b).
 *
 *   node src/validate-summary.js --label wave1-head
 *
 * Reads results/<label>/validation/answers.jsonl (one coded line per check, written while the
 * checks ran; local, names sites) and writes results/<label>/validation-summary.json with counts
 * per real agent and Wilson 95 % intervals, without site names. A code ending in "?" marks an
 * answer whose heading was checked afterwards against the browser reference in sample.csv; it
 * counts as its base code. Checks repeated for the same id keep the last line.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { wilson } from './stats.js';

const { values: opt } = parseArgs({ options: { label: { type: 'string', default: 'wave1-head' } } });
const ROOT = new URL('../', import.meta.url);
const byId = new Map();
for (const l of readFileSync(new URL(`results/${opt.label}/validation/answers.jsonl`, ROOT), 'utf8').split(/\r?\n/)) {
  const s = l.replace(/^﻿/, '').trim();
  if (s) { const x = JSON.parse(s); byId.set(x.id, x); }
}
const out = { label: opt.label, generated: new Date().toISOString(), agents: {} };
for (const x of byId.values()) {
  const a = (out.agents[x.agent] ??= { checks: 0, 'got-content': 0, 'refused/failed': 0, unclear: 0, 'not-run': 0 });
  a.checks++;
  a[x.code.replace(/\?$/, '')]++;
}
for (const a of Object.values(out.agents)) {
  const decided = a['got-content'] + a['refused/failed'];
  // Share of spoofed-UA blocks that the real user-triggered agent also hits.
  a.alsoBlocked = { k: a['refused/failed'], n: decided, ...wilson(a['refused/failed'], decided) };
}
writeFileSync(new URL(`results/${opt.label}/validation-summary.json`, ROOT), JSON.stringify(out, null, 1));
for (const [agent, a] of Object.entries(out.agents)) {
  const b = a.alsoBlocked;
  console.log(`${agent}: ${a.checks} checks, got ${a['got-content']}, blocked ${a['refused/failed']}, unclear ${a.unclear}, not run ${a['not-run']}`
    + (b.n ? `  -> also blocked ${b.k}/${b.n} = ${(100 * b.p).toFixed(0)} % [${(100 * b.lo).toFixed(0)}, ${(100 * b.hi).toFixed(0)}]` : ''));
}
