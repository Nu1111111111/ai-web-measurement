/**
 * Analyses added after the CCR pre-review (PROTOCOL.md §9, 2026-10-29). Exploratory: none of
 * them was pre-registered. Same runs as analyze.js, no new requests.
 *
 *   node src/extra.js --label wave1-head runs/<residential> runs/<datacenter>
 *
 * Writes results/<label>/extra.json and paper/tables/<label>-crossai.tex:
 *   overlap      per agent: AI-specific blocks on sites that also refuse spoofed Googlebot or
 *                Bingbot vs. sites that refuse neither; exact McNemar test agent vs. Googlebot
 *                (paired over comparable sites), Holm-adjusted over the AI agents of a run
 *   crossAi      robots.txt full block vs. AI-specific (not any) server block
 *   funnel       why robots.txt was unreachable (DNS, connect, TLS, 5xx), why no website
 *   disallowStudy  robots.txt of the sites that disallowed our study token (never fetched further)
 *   extraTokens  declared full blocks for AI tokens we did not request with
 *   layer        who produced the AI-specific block page: bot-management signature, CDN header
 *                only, or neither
 *   order        block rate by position in the random order; blocks without a later served
 *                request (not counted, PROTOCOL.md §5)
 *   payment      402 sites: did spoofed search engines or the controls get the same?
 *   validation   real-agent checks against the spoofed user-triggered agent of the same operator
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { parseRobots, classify as robotsClass } from './lib/robots.js';
import { ARMS, AI_ARMS } from './agents.js';
import { wilson, mcnemar, holm } from './stats.js';

const ROOT = new URL('../', import.meta.url);
const { values: opt, positionals: runs } = parseArgs({ options: { label: { type: 'string' } }, allowPositionals: true });
if (!opt.label || !runs.length) throw new Error('usage: node src/extra.js --label wave1-head runs/<A> [runs/<B>]');

const SERVED_OK = ['same', 'meta-differs', 'content-differs'];
const served = (a) => SERVED_OK.includes(a?.class) && a.class !== 'content-differs';
const share = (k, n) => ({ k, n, ...wilson(k, n) });
const EXTRA_TOKENS = ['Google-Extended', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'anthropic-ai', 'cohere-ai'];
const USER_ARM = { ChatGPT: 'chatgpt-user', Claude: 'claude-user', Perplexity: 'perplexity-user' };

function loadRun(dir) {
  const base = new URL(`${dir.replace(/\\/g, '/').replace(/\/?$/, '/')}`, `file:///${process.cwd().replace(/\\/g, '/')}/`);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8'));
  const recs = new Map();
  for (const l of readFileSync(new URL('records.jsonl', base), 'utf8').split('\n')) {
    if (!l) continue;
    const r = JSON.parse(l);
    recs.set(r.domain, r);
  }
  const robots = (domain) => {
    const f = new URL(`raw/${encodeURIComponent(domain)}/robots.txt.gz`, base);
    return existsSync(f) ? gunzipSync(readFileSync(f)).toString('utf8') : '';
  };
  return { name: manifest.run, recs, robots };
}

/** Same row logic as analyze.js: comparable, declared, strict block, AI-specific block. */
function sites(run) {
  const out = [];
  for (const r of run.recs.values()) {
    if (r.crash || r.skipped || !r.arms || r.armsSkipped) continue;
    if (r.arms.browser2?.class !== 'same') continue;
    const parsed = r.robots?.status === 'ok' ? parseRobots(run.robots(r.domain)) : null;
    const ctl = served(r.arms['control-plain']) && served(r.arms['control-bot']);
    const arm = {};
    for (const a of ARMS.filter((x) => x.token)) {
      const x = r.arms[a.id];
      if (!x) continue;
      const blocked = x.class === 'blocked' && x.strict === true;
      arm[a.id] = { x, blocked, spec: blocked && ctl, declared: parsed ? robotsClass(parsed, a.token).cls === 'full-block' : false };
    }
    out.push({ r, parsed, ctl, arm });
  }
  return out;
}

const refSpec = (s) => s.arm.googlebot?.spec || s.arm.bingbot?.spec;

function overlap(S) {
  const res = {};
  for (const a of AI_ARMS) {
    const X = S.filter((s) => s.arm[a.id]);
    const spec = X.filter((s) => s.arm[a.id].spec);
    const withRef = spec.filter(refSpec).length;
    const b = X.filter((s) => s.arm[a.id].spec && !s.arm.googlebot?.spec).length;
    const c = X.filter((s) => !s.arm[a.id].spec && s.arm.googlebot?.spec).length;
    res[a.id] = {
      role: a.role, n: X.length, aiSpecific: spec.length,
      alsoRefBlocked: share(withRef, spec.length),
      // AI-specific blocks on sites that serve both spoofed search engines: blocks that the
      // identity-verification explanation cannot account for
      beyondRef: share(spec.length - withRef, X.length),
      vsGooglebot: { b, c, p: mcnemar(b, c) },
    };
  }
  const adj = holm(AI_ARMS.map((a) => res[a.id].vsGooglebot.p));
  AI_ARMS.forEach((a, i) => { res[a.id].vsGooglebot.pHolm = adj[i]; });
  // per role: share of sites where at least one agent of the role is blocked beyond the baseline
  const roles = {};
  for (const role of ['training', 'search', 'user', 'reference']) {
    const ids = ARMS.filter((a) => a.role === role).map((a) => a.id);
    const k = S.filter((s) => ids.some((id) => s.arm[id]?.spec) && (role === 'reference' || !refSpec(s))).length;
    roles[role] = share(k, S.length);
  }
  return { arms: res, roles };
}

function crossAi(S) {
  const res = {};
  for (const a of AI_ARMS) {
    const X = S.filter((s) => s.arm[a.id]).map((s) => s.arm[a.id]);
    const c = {
      declaredAndEnforced: X.filter((x) => x.declared && x.spec).length,
      declaredOnly: X.filter((x) => x.declared && !x.spec).length,
      enforcedOnly: X.filter((x) => !x.declared && x.spec).length,
      neither: X.filter((x) => !x.declared && !x.spec).length,
    };
    c.bothShare = c.declaredAndEnforced / (c.declaredAndEnforced + c.declaredOnly + c.enforcedOnly);
    res[a.id] = c;
  }
  return res;
}

function errorClass(meta) {
  if (meta.http >= 500) return '5xx';
  const e = String(meta.error || '');
  if (/ENOTFOUND|EAI_AGAIN/.test(e)) return 'dns';
  if (/CERT|SSL|TLS|SIGNATURE/.test(e)) return 'tls';
  if (/TIMEOUT|Abort|ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH/i.test(e)) return 'connect';
  return 'other';
}

function funnel(run) {
  const unreachable = {};
  const noWebsite = {};
  for (const r of run.recs.values()) {
    if (r.armsSkipped === 'robots-unreachable') { const k = errorClass(r.robots); unreachable[k] = (unreachable[k] || 0) + 1; }
    if (r.armsSkipped === 'no-website') {
      const s = r.arms?.browser1?.status;
      const k = !s ? 'network' : s >= 200 && s < 300 ? 'not-html-or-empty' : 'other';
      noWebsite[k] = (noWebsite[k] || 0) + 1;
    }
  }
  return { unreachable, noWebsite };
}

function disallowStudy(run) {
  const R = [...run.recs.values()].filter((r) => r.armsSkipped === 'robots-disallows-study');
  const P = R.map((r) => parseRobots(run.robots(r.domain)));
  const out = { n: R.length, allTokensBlocked: 0, perToken: {} };
  for (const a of ARMS.filter((x) => x.token)) out.perToken[a.token] = P.filter((p) => robotsClass(p, a.token).cls === 'full-block').length;
  // a site that blocks every AI token we use, both search engines included, is a "block all" site
  out.allTokensBlocked = P.filter((p) => ARMS.filter((x) => x.token).every((a) => robotsClass(p, a.token).cls === 'full-block')).length;
  out.googlebotAllowed = R.length - out.perToken.Googlebot;
  return out;
}

function extraTokens(S) {
  const P = S.filter((s) => s.parsed).map((s) => s.parsed);
  const out = { n: S.length };
  for (const t of EXTRA_TOKENS) out[t] = share(P.filter((p) => robotsClass(p, t).cls === 'full-block').length, S.length);
  return out;
}

/** Who produced an AI-specific block page. */
function layerOf(x) {
  const h = x.headers || {};
  if (x.challenge || h['cf-mitigated']) return 'signature';
  if (/AkamaiGHost/i.test(h.server || '') && /^Access Denied$/i.test(x.title || '')) return 'signature';
  if (h['cf-ray'] && /cloudflare/i.test(x.title || '')) return 'signature';
  if (h['cf-ray'] || /cloudflare|akamai/i.test(h.server || '') || h['akamai-grn'] || h['x-amz-cf-id'] || h['x-datadome'] || h['x-iinfo']) return 'cdn-header-only';
  return 'none';
}

function layer(S) {
  const res = {};
  const groups = { training: AI_ARMS.filter((a) => a.role === 'training'), ai: AI_ARMS };
  for (const [g, arms] of Object.entries(groups)) {
    const L = S.flatMap((s) => arms.filter((a) => s.arm[a.id]?.spec).map((a) => layerOf(s.arm[a.id].x)));
    res[g] = { n: L.length };
    for (const k of ['signature', 'cdn-header-only', 'none']) res[g][k] = share(L.filter((x) => x === k).length, L.length);
  }
  return res;
}

function order(run) {
  const byPos = {};
  let unconfirmed = 0;
  let confirmed = 0;
  let lastPosBlocked = 0;
  for (const r of run.recs.values()) {
    if (r.crash || r.skipped || !r.arms || r.armsSkipped || r.arms.browser2?.class !== 'same') continue;
    const maxPos = Math.max(...Object.values(r.arms).map((a) => a.position ?? 0));
    for (const a of AI_ARMS) {
      const x = r.arms[a.id];
      if (!x) continue;
      const p = x.position;
      const b = (byPos[p] ??= { n: 0, k: 0, raw: 0 });
      b.n++;
      if (x.class === 'blocked' && x.strict === true) b.k++;
      // any refusal, confirmed or not: rises with position if the burst itself triggers blocking
      if (x.class === 'blocked') b.raw++;
      if (x.class === 'blocked') {
        if (x.strict === true) confirmed++; else unconfirmed++;
        if (p === maxPos) lastPosBlocked++;
      }
    }
  }
  const pos = Object.entries(byPos).map(([p, b]) => ({ pos: +p, raw: b.raw, ...share(b.k, b.n) })).sort((a, b) => a.pos - b.pos);
  // first vs second half of the sequence
  const half = (f, key) => { const xs = pos.filter(f); return share(xs.reduce((s, x) => s + x[key], 0), xs.reduce((s, x) => s + x.n, 0)); };
  const mid = Math.max(...pos.map((x) => x.pos)) / 2;
  return {
    byPosition: pos, early: half((x) => x.pos <= mid, 'k'), late: half((x) => x.pos > mid, 'k'),
    rawEarly: half((x) => x.pos <= mid, 'raw'), rawLate: half((x) => x.pos > mid, 'raw'),
    confirmed, unconfirmed, unconfirmedShare: share(unconfirmed, confirmed + unconfirmed), lastPosBlocked,
  };
}

function payment(S) {
  const P = S.filter((s) => AI_ARMS.some((a) => s.arm[a.id]?.x.class === 'payment-required'));
  const ref402 = P.filter((s) => ['googlebot', 'bingbot'].some((id) => s.arm[id]?.x.class === 'payment-required')).length;
  const refRefused = P.filter((s) => ['googlebot', 'bingbot'].some((id) => s.arm[id]?.x.class === 'payment-required' || s.arm[id]?.blocked)).length;
  const allAi402 = P.filter((s) => AI_ARMS.every((a) => s.arm[a.id]?.x.class === 'payment-required')).length;
  const ctl = P.filter((s) => s.ctl).length;
  return { n: P.length, searchEngine402: share(ref402, P.length), searchEngineRefusedOr402: share(refRefused, P.length), everyAiAgent402: share(allAi402, P.length), controlsServed: share(ctl, P.length) };
}

const cells = (line) => { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };

/**
 * Real-agent checks (PROTOCOL.md §7b) against the spoofed user-triggered agent of the same
 * operator on the same site. The sample was drawn on the training/search crawler's block; here
 * each decided check is split by what the spoofed X-User request met in wave 1.
 */
function validation(run, dir) {
  const f = new URL(`results/${opt.label}/validation/`, ROOT);
  if (!existsSync(new URL('answers.jsonl', f))) return null;
  const [h, ...ls] = readFileSync(new URL('sample.csv', f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const col = Object.fromEntries(cells(h).map((x, i) => [x, i]));
  const sample = new Map(ls.map((l) => cells(l)).map((x) => [+x[col.id], { domain: x[col.domain], agent: x[col.agent] }]));
  const ans = new Map();
  for (const l of readFileSync(new URL('answers.jsonl', f), 'utf8').split(/\r?\n/)) {
    const s = l.replace(/^﻿/, '').trim();
    if (s) { const x = JSON.parse(s); ans.set(x.id, x); }
  }
  const out = {};
  for (const [id, a] of ans) {
    const code = a.code.replace(/\?$/, '');
    if (code !== 'got-content' && code !== 'refused/failed') continue;
    const sm = sample.get(id);
    const r = run.recs.get(sm.domain);
    const x = r?.arms?.[USER_ARM[a.agent]];
    const ctl = r && served(r.arms['control-plain']) && served(r.arms['control-bot']);
    const spoof = !x ? 'missing' : x.class === 'blocked' && x.strict === true ? (ctl ? 'ai-specific-block' : 'block') : served(x) || x.class === 'content-differs' ? 'served' : 'other';
    const o = ((out[a.agent] ??= {})[spoof] ??= { k: 0, n: 0 });
    o.n++;
    if (code === 'refused/failed') o.k++;
  }
  for (const ag of Object.values(out)) for (const [k, v] of Object.entries(ag)) ag[k] = share(v.k, v.n);
  return out;
}

// ---------------------------------------------------------------- main
const loaded = runs.map(loadRun);
const result = { generated: new Date().toISOString(), label: opt.label, exploratory: true, runs: [] };
for (const run of loaded) {
  const S = sites(run);
  result.runs.push({
    run: run.name, comparable: S.length, overlap: overlap(S), crossAi: crossAi(S), funnel: funnel(run),
    disallowStudy: disallowStudy(run), extraTokens: extraTokens(S), layer: layer(S), order: order(run), payment: payment(S),
    validation: /de-residential/.test(run.name) ? validation(run) : null,
  });
}
// robots.txt unreachable at one vantage point but measured at the other
if (loaded.length === 2) {
  const [A, B] = loaded;
  const un = (run) => new Set([...run.recs.values()].filter((r) => r.armsSkipped === 'robots-unreachable').map((r) => r.domain));
  const probed = (run) => new Set([...run.recs.values()].filter((r) => r.arms && !r.armsSkipped && !r.crash).map((r) => r.domain));
  const uA = un(A); const uB = un(B); const pA = probed(A); const pB = probed(B);
  result.vantageFunnel = {
    a: A.name, b: B.name,
    unreachableBoth: [...uA].filter((d) => uB.has(d)).length,
    unreachableOnlyA: [...uA].filter((d) => !uB.has(d)).length,
    unreachableOnlyAProbedB: [...uA].filter((d) => pB.has(d)).length,
    unreachableOnlyB: [...uB].filter((d) => !uA.has(d)).length,
    unreachableOnlyBProbedA: [...uB].filter((d) => pA.has(d)).length,
  };
}

const OUT = new URL(`results/${opt.label}/`, ROOT);
mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('extra.json', OUT), JSON.stringify(result, null, 1));

// Table: robots.txt full block vs AI-specific server block (residential run)
const main = result.runs[0];
const rowsTex = AI_ARMS.map((a) => {
  const c = main.crossAi[a.id];
  return `${a.token} & ${c.declaredAndEnforced} & ${c.declaredOnly} & ${c.enforcedOnly} & ${c.neither} \\\\`;
});
mkdirSync(new URL('paper/tables/', ROOT), { recursive: true });
writeFileSync(new URL(`paper/tables/${opt.label}-crossai.tex`, ROOT), `% generated by src/extra.js from ${main.run} -- do not edit
\\begin{tabular}{lrrrr}
\\toprule
 & \\multicolumn{2}{c}{robots.txt full block} & \\multicolumn{2}{c}{no full block} \\\\
\\cmidrule(lr){2-3}\\cmidrule(lr){4-5}
Agent & AI-spec.\\ block & served & AI-spec.\\ block & served \\\\
\\midrule
${rowsTex.join('\n')}
\\bottomrule
\\end{tabular}
`);

for (const r of result.runs) {
  console.log(`\n== ${r.run}  comparable ${r.comparable}`);
  console.table(Object.fromEntries(Object.entries(r.overlap.arms).map(([id, x]) => [id, {
    spec: x.aiSpecific, alsoRef: `${(100 * (x.alsoRefBlocked.p ?? 0)).toFixed(1)}%`, beyondRef: `${(100 * x.beyondRef.p).toFixed(1)}%`,
    b: x.vsGooglebot.b, c: x.vsGooglebot.c, pHolm: x.vsGooglebot.pHolm.toExponential(1),
  }])));
  console.log('roles beyond ref', Object.fromEntries(Object.entries(r.overlap.roles).map(([k, s]) => [k, `${(100 * s.p).toFixed(1)}%`])));
  console.log('funnel', JSON.stringify(r.funnel), 'disallowStudy', JSON.stringify({ n: r.disallowStudy.n, all: r.disallowStudy.allTokensBlocked, gbAllowed: r.disallowStudy.googlebotAllowed, GPTBot: r.disallowStudy.perToken.GPTBot }));
  console.log('extraTokens', Object.fromEntries(EXTRA_TOKENS.map((t) => [t, `${(100 * r.extraTokens[t].p).toFixed(1)}%`])));
  console.log('layer', JSON.stringify(Object.fromEntries(Object.entries(r.layer).map(([g, x]) => [g, { n: x.n, sig: x.signature.k, hdr: x['cdn-header-only'].k, none: x.none.k }]))));
  console.log('order', JSON.stringify({ early: r.order.early.p, late: r.order.late.p, rawEarly: r.order.rawEarly.p, rawLate: r.order.rawLate.p, confirmed: r.order.confirmed, unconfirmed: r.order.unconfirmed, last: r.order.lastPosBlocked }));
  console.log('payment', JSON.stringify(Object.fromEntries(Object.entries(r.payment).map(([k, v]) => [k, typeof v === 'object' ? `${v.k}/${v.n}` : v]))));
  if (r.validation) console.log('validation', JSON.stringify(Object.fromEntries(Object.entries(r.validation).map(([ag, x]) => [ag, Object.fromEntries(Object.entries(x).map(([k, v]) => [k, `${v.k}/${v.n}`]))]))));
}
if (result.vantageFunnel) console.log('vantageFunnel', result.vantageFunnel);
