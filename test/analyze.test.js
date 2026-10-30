import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, readdirSync } from 'node:fs';

// test/fixtures/run-a: one synthetic comparable site (example.test) whose robots.txt
// disallows GPTBot and whose server blocks GPTBot while both controls get the page.
const ROOT = new URL('../', import.meta.url);
const LABEL = 'regression-test';

test('every run is analysed the same way, not only the first (2026-10-29 bug)', () => {
  try {
    execFileSync(process.execPath, ['src/analyze.js', '--label', LABEL, 'test/fixtures/run-a', 'test/fixtures/run-a'], { cwd: ROOT, stdio: 'pipe' });
    const res = JSON.parse(readFileSync(new URL(`results/${LABEL}/results.json`, ROOT), 'utf8'));
    const [a, b] = res.runs;
    assert.equal(a.perArm.gptbot.declaredFullBlock.k, 1);
    assert.equal(a.perArm.gptbot.aiSpecificBlock.k, 1);
    assert.deepEqual(b.perArm, a.perArm);
    assert.deepEqual(b.anyAi, a.anyAi);
  } finally {
    rmSync(new URL(`results/${LABEL}/`, ROOT), { recursive: true, force: true });
    for (const f of readdirSync(new URL('paper/tables/', ROOT))) {
      if (f.startsWith(`${LABEL}-`)) rmSync(new URL(`paper/tables/${f}`, ROOT));
    }
  }
});
