/**
 * Check that branch data/<run> on origin restores runs/<run> exactly.
 *
 *   node src/verify-backup.js <run> [<run> ...]
 *
 * Fetches the branch, checks every part against SHA256SUMS, unpacks it to a temp folder and
 * compares records.jsonl, diffs.jsonl and manifest.json byte for byte with the local copy
 * (when there is one) and the number of files under raw/.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const git = (...a) => execFileSync('git', a, { cwd: root, stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 200 * 1024 * 1024 });
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const count = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).length;

let failed = false;
for (const run of process.argv.slice(2)) {
  git('fetch', '-q', process.env.DATA_REMOTE || 'origin', `+data/${run}:refs/remotes/origin/data/${run}`);
  const tmp = mkdtempSync(join(tmpdir(), 'aiweb-verify-'));
  const sums = git('show', `origin/data/${run}:SHA256SUMS`).toString().split('\n').filter(Boolean).map((l) => l.split(/\s+\*?/));
  const parts = sums.map(([hash, name]) => {
    const buf = git('show', `origin/data/${run}:${name}`);
    if (sha(buf) !== hash) throw new Error(`${run}: checksum mismatch in ${name}`);
    return buf;
  });
  writeFileSync(join(tmp, 'run.tar.gz'), Buffer.concat(parts));
  execFileSync('tar', ['-xzf', join(tmp, 'run.tar.gz'), '-C', tmp]);
  const restored = join(tmp, run);
  const local = join(root, 'runs', run);
  const report = [`${run}: ${parts.length} part(s) ok`, `raw files ${count(join(restored, 'raw'))}`];
  if (existsSync(local)) {
    for (const f of ['manifest.json', 'records.jsonl', 'diffs.jsonl']) {
      const same = sha(readFileSync(join(restored, f))) === sha(readFileSync(join(local, f)));
      report.push(`${f} ${same ? 'identical' : 'DIFFERS'}`);
      if (!same) failed = true;
    }
    const nl = count(join(local, 'raw'));
    report.push(`local raw files ${nl}`);
    if (nl !== count(join(restored, 'raw'))) failed = true;
  }
  console.log(report.join(', '));
  rmSync(tmp, { recursive: true, force: true });
}
if (failed) process.exit(1);
