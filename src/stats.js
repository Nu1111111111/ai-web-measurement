/** Small, dependency-free statistics for the result tables. */

/** Wilson score interval for k successes in n trials (95 % by default). */
export function wilson(k, n, z = 1.959964) {
  if (!n) return { p: null, lo: null, hi: null };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { p, lo: Math.max(0, (c - r) / d), hi: Math.min(1, (c + r) / d) };
}

/** Cohen's kappa for two raters over the same items (arrays of labels). */
export function kappa(a, b) {
  if (a.length !== b.length || !a.length) return null;
  const n = a.length;
  const labels = [...new Set([...a, ...b])];
  let agree = 0;
  const ca = {};
  const cb = {};
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    ca[a[i]] = (ca[a[i]] || 0) + 1;
    cb[b[i]] = (cb[b[i]] || 0) + 1;
  }
  const po = agree / n;
  const pe = labels.reduce((s, l) => s + ((ca[l] || 0) / n) * ((cb[l] || 0) / n), 0);
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}

const logC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; };

/**
 * Exact two-sided McNemar test for paired binary outcomes: b = only the first is 1, c = only the
 * second. Binomial test of b against n = b + c, p = 0.5.
 */
export function mcnemar(b, c) {
  const n = b + c;
  if (!n) return 1;
  const m = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= m; i++) tail += Math.exp(logC(n, i) - n * Math.LN2);
  return Math.min(1, 2 * tail);
}

/** Holm-Bonferroni adjusted p-values, in the input order. */
export function holm(ps) {
  const order = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(ps.length);
  let run = 0;
  order.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); out[i] = run; });
  return out;
}

export const pct =(x, digits = 1) => (x === null || x === undefined ? '--' : (100 * x).toFixed(digits));
