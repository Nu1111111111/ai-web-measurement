/**
 * Merge shard runs into one run directory.
 *
 *   node src/merge.js runs/<target> runs/<shard1> runs/<shard2> ...
 *
 * records.jsonl and diffs.jsonl are concatenated, raw/ folders copied, manifest
 * sessions appended. A domain present in two shards is an error.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const [target, ...shards] = process.argv.slice(2);
if (!target || !shards.length) throw new Error('usage: node src/merge.js runs/<target> runs/<shard> ...');
mkdirSync(join(target, 'raw'), { recursive: true });
const manifest = { run: target.split(/[\\/]/).filter(Boolean).pop(), mergedFrom: [], sessions: [] };
const seen = new Set();
for (const s of shards) {
  const m = JSON.parse(readFileSync(join(s, 'manifest.json'), 'utf8'));
  manifest.mergedFrom.push(m.run);
  manifest.sessions.push(...m.sessions);
  for (const l of readFileSync(join(s, 'records.jsonl'), 'utf8').split('\n').filter(Boolean)) {
    const d = JSON.parse(l).domain;
    if (seen.has(d)) throw new Error(`${d} in two shards`);
    seen.add(d);
    appendFileSync(join(target, 'records.jsonl'), l + '\n');
  }
  if (existsSync(join(s, 'diffs.jsonl'))) appendFileSync(join(target, 'diffs.jsonl'), readFileSync(join(s, 'diffs.jsonl')));
  if (existsSync(join(s, 'raw'))) cpSync(join(s, 'raw'), join(target, 'raw'), { recursive: true });
}
writeFileSync(join(target, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`${target}: ${seen.size} domains from ${shards.length} shards`);
