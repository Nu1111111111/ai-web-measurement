/**
 * Back up a run measured on this machine as branch data/<run>, in the same format as the
 * GitHub Actions vantage point (split tarball + SHA256SUMS), so `node src/fetch-remote.js <run>`
 * restores both kinds the same way.
 *
 *   node src/push-local.js <run>
 *
 * Builds the commit with git plumbing (no checkout, the working tree is not touched) and
 * refuses to overwrite an existing data/<run> branch.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, openSync, readSync, closeSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = process.argv[2];
if (!run) throw new Error('usage: node src/push-local.js <run>');
const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
if (!existsSync(join(root, 'runs', run, 'manifest.json'))) throw new Error(`runs/${run} has no manifest.json`);
const git = (args, input) => execFileSync('git', args, { cwd: root, input, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'inherit'] }).toString().trim();
// Raw runs live in a separate private repo once this one is public (README, "Raw data").
const REMOTE = process.env.DATA_REMOTE || 'origin';
if (git(['ls-remote', REMOTE, `refs/heads/data/${run}`])) throw new Error(`${REMOTE} already has data/${run}`);

const PART = 90 * 1024 * 1024; // GitHub refuses files over 100 MB
const tmp = mkdtempSync(join(tmpdir(), 'aiweb-'));
const tarball = join(tmp, 'run.tar.gz');
execFileSync('tar', ['-czf', tarball, '-C', join(root, 'runs'), run], { stdio: 'inherit' });

const entries = [];
const sums = [];
const fd = openSync(tarball, 'r');
const size = statSync(tarball).size;
for (let off = 0, i = 0; off < size; off += PART, i++) {
  const buf = Buffer.alloc(Math.min(PART, size - off));
  readSync(fd, buf, 0, buf.length, off);
  const name = `run.tar.gz.part-${String(i).padStart(2, '0')}`;
  const file = join(tmp, name);
  writeFileSync(file, buf);
  sums.push(`${createHash('sha256').update(buf).digest('hex')}  ${name}`);
  entries.push(`100644 blob ${git(['hash-object', '-w', '--no-filters', file])}\t${name}`);
}
closeSync(fd);
writeFileSync(join(tmp, 'SHA256SUMS'), `${sums.join('\n')}\n`);
entries.push(`100644 blob ${git(['hash-object', '-w', '--no-filters', join(tmp, 'SHA256SUMS')])}\tSHA256SUMS`);

const tree = git(['mktree'], `${entries.join('\n')}\n`);
const commit = git(['commit-tree', tree, '-m', `data: ${run} (local vantage)`]);
git(['push', REMOTE, `${commit}:refs/heads/data/${run}`]);
rmSync(tmp, { recursive: true, force: true });
console.log(`data/${run}: ${sums.length} part(s), ${(size / 1024 / 1024).toFixed(1)} MB, commit ${commit.slice(0, 7)}`);
