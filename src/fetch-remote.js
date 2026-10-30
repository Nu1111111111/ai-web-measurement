/**
 * Pull a run measured by the GitHub Actions vantage point (.github/workflows/measure.yml).
 *
 *   node src/fetch-remote.js <run>
 *
 * Fetches branch data/<run>, checks SHA256SUMS, joins the tarball parts and
 * unpacks to runs/<run>/. Plain git + tar, no API token.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = process.argv[2];
if (!run) throw new Error('usage: node src/fetch-remote.js <run>');
const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
if (existsSync(join(root, 'runs', run))) throw new Error(`runs/${run} exists already`);
// Parts are up to 90 MB; the default 1 MB pipe buffer is far too small.
const git = (...a) => execFileSync('git', a, { cwd: root, stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 200 * 1024 * 1024 });

// Raw runs live in a separate private repo once this one is public (README, "Raw data").
git('fetch', process.env.DATA_REMOTE || 'origin', `data/${run}:refs/remotes/origin/data/${run}`);
const tmp = mkdtempSync(join(tmpdir(), 'aiweb-'));
const files = git('ls-tree', '--name-only', `origin/data/${run}`).toString().split('\n').filter(Boolean);
for (const f of files) writeFileSync(join(tmp, f), git('show', `origin/data/${run}:${f}`));

const sums = readFileSync(join(tmp, 'SHA256SUMS'), 'utf8').split('\n').filter(Boolean).map((l) => l.split(/\s+\*?/));
for (const [hash, name] of sums) {
  const got = createHash('sha256').update(readFileSync(join(tmp, name))).digest('hex');
  if (got !== hash) throw new Error(`checksum mismatch: ${name}`);
}
const parts = readdirSync(tmp).filter((f) => f.startsWith('run.tar.gz.part-')).sort();
writeFileSync(join(tmp, 'run.tar.gz'), Buffer.concat(parts.map((p) => readFileSync(join(tmp, p)))));
execFileSync('tar', ['-xzf', join(tmp, 'run.tar.gz'), '-C', join(root, 'runs')], { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
console.log(`runs/${run}: ${parts.length} part(s), checksums ok`);
