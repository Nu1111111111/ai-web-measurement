/**
 * Fetch a Tranco list and keep the study population.
 *
 *   node src/list.js [listId=latest] [N=10000] [--tail 5000 --seed 1]
 *
 * Head stratum: ranks 1..N -> config/tranco-<id>-top<N>.csv
 * Tail stratum (--tail K): K domains drawn uniformly at random (seeded) from ranks
 * N+1..1,000,000 -> config/tranco-<id>-tail<K>-seed<S>.csv, original ranks kept.
 *
 * The list id goes into config/study.json by hand, before PROTOCOL.md is frozen:
 * every vantage point and every wave of one study uses the same files.
 */
import { writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  options: { tail: { type: 'string' }, seed: { type: 'string', default: '1' } }, allowPositionals: true,
});
const id = positionals[0] && positionals[0] !== 'latest' ? positionals[0] : null;
const N = Number(positionals[1] || 10000);

const meta = await (await fetch(id ? `https://tranco-list.eu/api/lists/id/${id}` : 'https://tranco-list.eu/api/lists/date/latest')).json();
if (!meta.available) throw new Error(`list ${meta.list_id} not available`);

const buf = Buffer.from(await (await fetch(meta.download)).arrayBuffer());
let text = buf.toString('utf8');
if (text.startsWith('PK')) {
  // Single-entry zip: local header is 30 bytes + name + extra.
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const size = buf.readUInt32LE(18);
  text = inflateRawSync(buf.subarray(30 + nameLen + extraLen, 30 + nameLen + extraLen + size)).toString('utf8');
}
const all = text.split(/\r?\n/).filter(Boolean);
const head = all.slice(0, N);
if (head.length !== N) throw new Error(`expected ${N} rows, got ${head.length}`);
const write = (name, rows) => writeFileSync(new URL(`../config/${name}`, import.meta.url), rows.join('\n') + '\n');
write(`tranco-${meta.list_id}-top${N}.csv`, head);
write(`tranco-${meta.list_id}.json`, [JSON.stringify({ ...meta, fetched: new Date().toISOString(), rows: all.length }, null, 1)]);
console.log(`head: ${head.length} rows, list ${meta.list_id} (${meta.created_on}, ${all.length} rows in total)`);

if (opt.tail) {
  const K = Number(opt.tail);
  const pool = all.slice(N);
  // Seeded partial Fisher-Yates (mulberry32), so anyone can redraw the same sample.
  let s = Number(opt.seed) >>> 0;
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < K; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const tail = pool.slice(0, K).sort((a, b) => Number(a.split(',')[0]) - Number(b.split(',')[0]));
  write(`tranco-${meta.list_id}-tail${K}-seed${opt.seed}.csv`, tail);
  console.log(`tail: ${tail.length} rows from ranks ${N + 1}..${all.length}, seed ${opt.seed}`);
}
