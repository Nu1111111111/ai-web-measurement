import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wilson, kappa } from '../src/stats.js';

test('wilson matches the textbook value for 10/100', () => {
  const w = wilson(10, 100);
  assert.equal(w.p, 0.1);
  assert.ok(Math.abs(w.lo - 0.0552) < 0.0005);
  assert.ok(Math.abs(w.hi - 0.1744) < 0.0005);
});

test('wilson stays inside [0,1] at the edges', () => {
  assert.equal(wilson(0, 20).lo, 0);
  assert.ok(wilson(20, 20).hi <= 1);
  assert.equal(wilson(0, 0).p, null);
});

test('kappa: perfect agreement 1, chance-level 0', () => {
  assert.equal(kappa(['a', 'b', 'a'], ['a', 'b', 'a']), 1);
  assert.equal(kappa(['a', 'a', 'b', 'b'], ['a', 'b', 'a', 'b']), 0);
});
