/**
 * Classify every non-reference arm of one domain against the two browser fetches.
 * From invisible-prompts part 3 (src/cloak/compare.js), thresholds unchanged, plus
 * a `payment-required` class for HTTP 402 (RQ3).
 *
 * Classes per arm:
 *   error             no response (network, TLS, timeout)
 *   rate-limited      HTTP 429
 *   payment-required  HTTP 402
 *   blocked           4xx/5xx (not 429/402), a bot-management challenge page, or an empty 202
 *   other             2xx/3xx but not HTML
 *   content-differs   readable text below T.same Jaccard AND T.margin below browser-vs-browser
 *   meta-differs      text the same, but a head field differs where both browsers agree
 *   same              the page a browser gets
 *   bot-let-in        browser1 was refused, this arm got the page
 *   both-refused      browser1 was refused, so was this arm
 */
import { readFileSync } from 'node:fs';
import { textLines, normLine, shingles, jaccard } from './lib/features.js';

export const T = JSON.parse(readFileSync(new URL('../config/study.json', import.meta.url), 'utf8')).thresholds;

/** 202 with an empty page is how JS-challenge WAFs answer ("accepted, now run this script"). */
const emptyAccepted = (a) => a.status === 202 && (a.words ?? 0) < 5;
export const isOk = (a) => !!a && a.status >= 200 && a.status < 300 && /html|xml/i.test(a.type || '') && !a.challenge && !emptyAccepted(a);
export const isBlocked = (a) => !!a && ((a.status >= 400 && a.status !== 429 && a.status !== 402) || !!a.challenge || emptyAccepted(a));

/** Head fields a crawler uses; compared only where the two browser fetches agree. */
const META = ['title', 'description', 'robotsMeta', 'canonical', 'xRobotsTag', 'finalUrl'];

/**
 * @param {Record<string, object>} arms  per-arm response meta + features
 * @param {(id: string) => string} body  an arm's HTML ('' if not kept)
 * @param {boolean} quote  keep the differing lines (for the review queue)
 */
export function classify(arms, body, { quote = true } = {}) {
  const b1 = arms.browser1;
  const b2 = arms.browser2;
  const refs = ['browser1', 'browser2'].filter((b) => isOk(arms[b]));
  const lines = {};
  const line = (id) => (lines[id] ??= textLines(body(id)));
  const sh = {};
  const shing = (id) => (sh[id] ??= shingles(line(id)));

  const noise = isOk(b1) && isOk(b2) ? jaccard(shing('browser1'), shing('browser2')) : null;
  const out = { noise, arms: {} };

  for (const id of Object.keys(arms).filter((k) => k !== 'browser1')) {
    const a = arms[id];
    const r = (out.arms[id] = {});
    if (!a || a.status === 0) { r.class = 'error'; continue; }
    if (a.status === 429) { r.class = 'rate-limited'; continue; }
    if (a.status === 402) { r.class = 'payment-required'; continue; }

    if (!isOk(b1)) {
      r.class = isOk(a) ? 'bot-let-in' : 'both-refused';
      continue;
    }
    if (isBlocked(a)) {
      r.class = 'blocked';
      r.how = a.challenge ? `challenge:${a.challenge}` : emptyAccepted(a) ? 'challenge:empty-202' : `http-${a.status}`;
      // Strict: a request made after this one still got the page, so our IP was
      // not rate-limited at that moment.
      r.strict = Object.values(arms).some((x) => isOk(x) && x.position > a.position);
      continue;
    }
    if (!isOk(a)) { r.class = 'other'; continue; }
    if (id === 'browser2') { r.class = 'same'; r.sim = noise; continue; }

    r.sim = Math.max(...refs.map((b) => jaccard(shing(id), shing(b))));
    r.wordRatio = b1.words ? +(a.words / b1.words).toFixed(2) : null;
    r.meta = META.filter((f) => refs.length === 2 && (b1[f] ?? '') === (b2[f] ?? '') && (a[f] ?? '') !== (b1[f] ?? ''));
    const contentDiff = noise !== null && r.sim < T.same && noise - r.sim >= T.margin;
    r.class = contentDiff ? 'content-differs' : r.meta.length ? 'meta-differs' : 'same';
    if (!r.meta.length) delete r.meta;

    if (quote && r.class !== 'same') {
      const seen = new Set(refs.flatMap((b) => line(b)).map(normLine));
      const mine = new Set(line(id).map(normLine));
      const b2Set = refs.length === 2 ? new Set(line('browser2').map(normLine)) : null;
      const inBoth = b2Set ? line('browser1').filter((l) => b2Set.has(normLine(l))) : line('browser1');
      const botOnly = [...new Set(line(id).filter((l) => l.length >= T.minLine && !seen.has(normLine(l))))];
      const browserOnly = [...new Set(inBoth.filter((l) => l.length >= T.minLine && !mine.has(normLine(l))))];
      Object.assign(r, { botOnlyCount: botOnly.length, browserOnlyCount: browserOnly.length,
        botOnly: botOnly.slice(0, T.maxQuoted), browserOnly: browserOnly.slice(0, T.maxQuoted) });
      if (r.meta) r.metaValues = Object.fromEntries(r.meta.map((f) => [f, { browser: b1[f] ?? '', bot: a[f] ?? '' }]));
    }
  }
  return out;
}
