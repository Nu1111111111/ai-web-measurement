/**
 * Offline analysis of one or more runs. Every number in the paper comes from here.
 *
 *   node src/analyze.js --label main runs/<A> [runs/<B> ...]
 *
 * Writes results/<label>/:
 *   results.json        every figure, with numerators, denominators and Wilson 95 % CIs
 *   per-domain.csv      one row per (run, domain, arm): declared vs served (no names leave the repo
 *                       unless the release decision in PROTOCOL.md §8 says so)
 *   review-queue.csv    AI-specific content differences, for the manual coding of PROTOCOL.md §6
 * and paper/tables/<label>-*.tex (booktabs), which paper/main.tex \input s.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { createHmac } from 'node:crypto';
import { parseRobots, classify as robotsClass } from './lib/robots.js';
import { ARMS, AI_ARMS } from './agents.js';
import { wilson, kappa, pct } from './stats.js';

const ROOT = new URL('../', import.meta.url);
const { values: opt, positionals: runs } = parseArgs({ options: { label: { type: 'string', default: 'main' } }, allowPositionals: true });
if (!runs.length) throw new Error('usage: node src/analyze.js --label main runs/<A> [runs/<B> ...]');

const SERVED_OK = ['same', 'meta-differs', 'content-differs'];
const CONTROLS = ['control-plain', 'control-bot'];
const REFERENCES = ['googlebot', 'bingbot'];
const TOKEN_ARMS = ARMS.filter((a) => a.token);

/** Who answered: the CDN / bot-management layer, from response headers. */
function edge(h = {}) {
  if (h['cf-ray'] || /cloudflare/i.test(h.server || '')) return 'Cloudflare';
  if (h['akamai-grn'] || /akamai/i.test(h.server || '')) return 'Akamai';
  if (h['x-amz-cf-id'] || /cloudfront|awselb/i.test(h.server || '')) return 'AWS';
  if (h['x-datadome']) return 'DataDome';
  if (h['x-iinfo']) return 'Imperva';
  if (h['x-vercel-id']) return 'Vercel';
  if (/fastly/i.test(h['x-served-by'] || '') || /varnish/i.test(h.via || '')) return 'Fastly';
  return 'other';
}

function loadRun(dir) {
  const base = new URL(`${dir.replace(/\\/g, '/').replace(/\/?$/, '/')}`, `file:///${process.cwd().replace(/\\/g, '/')}/`);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8'));
  const recs = new Map();
  for (const l of readFileSync(new URL('records.jsonl', base), 'utf8').split('\n')) {
    if (!l) continue;
    const r = JSON.parse(l);
    recs.set(r.domain, r); // a resumed run may repeat a crashed domain: last line wins
  }
  const robots = (domain) => {
    const f = new URL(`raw/${encodeURIComponent(domain)}/robots.txt.gz`, base);
    return existsSync(f) ? gunzipSync(readFileSync(f)).toString('utf8') : '';
  };
  const diffs = existsSync(new URL('diffs.jsonl', base))
    ? readFileSync(new URL('diffs.jsonl', base), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { dir, name: manifest.run, manifest, recs: [...recs.values()], robots, diffs };
}

/**
 * The served class under other thresholds (PROTOCOL.md §5, sensitivity). `sim` and the
 * browser-vs-browser `noise` are stored per record, so no re-crawl is needed.
 */
function reclass(a, noise, th) {
  if (!a || !SERVED_OK.includes(a.class) || a.sim === undefined || a.sim === null || noise === null || noise === undefined) return a?.class;
  if (a.sim < th.same && noise - a.sim >= th.margin) return 'content-differs';
  return a.meta?.length ? 'meta-differs' : 'same';
}

/** Per (domain, arm): declared policy, served class, and the derived flags. */
function rows(run, th = null) {
  const out = [];
  for (const r of run.recs) {
    if (r.crash || r.skipped || !r.arms || r.armsSkipped) continue;
    // browser2 is classed 'same' only when browser1 and browser2 both got a readable page.
    const comparable = r.arms.browser2?.class === 'same';
    const cls = (id) => (th && id !== 'browser2' ? reclass(r.arms[id], r.noise, th) : r.arms[id]?.class);
    const parsed = th ? null : r.robots?.status === 'ok' ? parseRobots(run.robots(r.domain)) : null;
    const controlsServed = CONTROLS.every((c) => SERVED_OK.includes(cls(c)) && cls(c) !== 'content-differs');
    for (const arm of TOKEN_ARMS) {
      const a = r.arms[arm.id];
      if (!a) continue;
      const declared = parsed ? robotsClass(parsed, arm.token).cls : r.robots?.status === 'unreachable' ? 'unreachable' : 'no-robots';
      const blocked = a.class === 'blocked' && a.strict === true;
      out.push({
        run: run.name, domain: r.domain, rank: r.rank, arm: arm.id, role: arm.role, operator: arm.operator,
        comparable, declared, served: cls(arm.id), how: a.how, status: a.status, edge: edge(a.headers), sim: a.sim,
        blocked, aiSpecificBlock: blocked && controlsServed,
        aiSpecificDiff: cls(arm.id) === 'content-differs' && controlsServed,
        payment: a.class === 'payment-required', price: a.headers?.['crawler-price'],
      });
    }
  }
  return out;
}

const share = (k, n) => ({ k, n, ...wilson(k, n) });

function summarise(run, R) {
  const recs = run.recs;
  const funnel = {
    listed: recs.length,
    optedOut: recs.filter((r) => r.skipped === 'opted-out').length,
    crashed: recs.filter((r) => r.crash).length,
    robotsUnreachable: recs.filter((r) => r.armsSkipped === 'robots-unreachable').length,
    robotsDisallowStudy: recs.filter((r) => r.armsSkipped === 'robots-disallows-study').length,
    noWebsite: recs.filter((r) => r.armsSkipped === 'no-website').length,
    probed: new Set(R.map((x) => x.domain)).size,
    comparable: new Set(R.filter((x) => x.comparable).map((x) => x.domain)).size,
  };
  const C = R.filter((x) => x.comparable);
  const perArm = {};
  for (const arm of TOKEN_ARMS) {
    const X = C.filter((x) => x.arm === arm.id);
    const n = X.length;
    perArm[arm.id] = {
      role: arm.role, operator: arm.operator, n,
      declaredFullBlock: share(X.filter((x) => x.declared === 'full-block').length, n),
      servedBlocked: share(X.filter((x) => x.blocked).length, n),
      aiSpecificBlock: share(X.filter((x) => x.aiSpecificBlock).length, n),
      payment: share(X.filter((x) => x.payment).length, n),
      contentDiffers: share(X.filter((x) => x.served === 'content-differs').length, n),
      aiSpecificDiff: share(X.filter((x) => x.aiSpecificDiff).length, n),
      // RQ1 cross-table: declared full block vs served block (strict)
      cross: {
        declaredAndEnforced: X.filter((x) => x.declared === 'full-block' && x.blocked).length,
        declaredOnly: X.filter((x) => x.declared === 'full-block' && !x.blocked).length,
        enforcedOnly: X.filter((x) => x.declared !== 'full-block' && x.blocked).length,
        neither: X.filter((x) => x.declared !== 'full-block' && !x.blocked).length,
      },
      edges: tally(X.filter((x) => x.aiSpecificBlock).map((x) => x.edge)),
      how: tally(X.filter((x) => x.blocked).map((x) => x.how)),
    };
  }
  // Any AI arm, per domain
  const byDomain = groupBy(C.filter((x) => AI_ARMS.some((a) => a.id === x.arm)), (x) => x.domain);
  const domains = Object.values(byDomain);
  const any = (pred) => share(domains.filter((xs) => xs.some(pred)).length, domains.length);
  const anyAi = {
    declaredFullBlock: any((x) => x.declared === 'full-block'),
    servedBlocked: any((x) => x.blocked),
    aiSpecificBlock: any((x) => x.aiSpecificBlock),
    payment: any((x) => x.payment),
    aiSpecificDiff: any((x) => x.aiSpecificDiff),
    enforcedDespiteAllowed: any((x) => x.aiSpecificBlock && x.declared !== 'full-block'),
  };
  // RQ2 without manual coding (PROTOCOL.md §9, 2026-10-29): automatic content differences are an
  // upper bound. Googlebot/Bingbot get the same treatment and give the baseline of differences
  // that bots get in general; "AI only" are sites where an AI agent's page differs and neither
  // search engine's does.
  const refDiff = new Set(C.filter((x) => x.role === 'reference' && x.aiSpecificDiff).map((x) => x.domain));
  const anyRef = share(refDiff.size, domains.length);
  const rq2 = {
    anyAiDiff: anyAi.aiSpecificDiff,
    anySearchEngineDiff: anyRef,
    aiOnlyDiff: any((x) => x.aiSpecificDiff && !refDiff.has(x.domain)),
  };
  // Training blocked but the same operator's search/user agent served (role split, RQ1b)
  const roleSplit = {};
  for (const op of ['OpenAI', 'Anthropic', 'Perplexity']) {
    const ops = domains.map((xs) => xs.filter((x) => x.operator === op));
    const blockedRole = (xs, role) => xs.some((x) => x.role === role && x.aiSpecificBlock);
    roleSplit[op] = {
      trainingBlocked: ops.filter((xs) => blockedRole(xs, 'training')).length,
      searchBlocked: ops.filter((xs) => blockedRole(xs, 'search')).length,
      userBlocked: ops.filter((xs) => blockedRole(xs, 'user')).length,
      n: ops.filter((xs) => xs.length).length,
    };
  }
  return { run: run.name, vantage: run.manifest.sessions.map((s) => ({ vantage: s.vantage, country: s.where?.country, org: s.where?.org, commit: s.git?.commit, dirty: s.git?.dirty })), funnel, perArm, anyAi, rq2, roleSplit };
}

function crossVantage(rowsA, rowsB) {
  const key = (x) => `${x.domain}|${x.arm}`;
  const mapB = new Map(rowsB.filter((x) => x.comparable).map((x) => [key(x), x]));
  const pairs = rowsA.filter((x) => x.comparable && mapB.has(key(x))).map((x) => [x, mapB.get(key(x))]);
  const out = {};
  for (const arm of TOKEN_ARMS) {
    const P = pairs.filter(([a]) => a.arm === arm.id);
    const la = P.map(([a]) => (a.aiSpecificBlock ? 'block' : 'serve'));
    const lb = P.map(([, b]) => (b.aiSpecificBlock ? 'block' : 'serve'));
    out[arm.id] = {
      n: P.length,
      both: P.filter(([a, b]) => a.aiSpecificBlock && b.aiSpecificBlock).length,
      onlyA: P.filter(([a, b]) => a.aiSpecificBlock && !b.aiSpecificBlock).length,
      onlyB: P.filter(([a, b]) => !a.aiSpecificBlock && b.aiSpecificBlock).length,
      kappa: kappa(la, lb),
    };
  }
  return out;
}

const tally = (xs) => xs.reduce((m, x) => ((m[x ?? 'none'] = (m[x ?? 'none'] || 0) + 1), m), {});
const groupBy = (xs, f) => xs.reduce((m, x) => ((m[f(x)] ??= []).push(x), m), {});
const csvCell = (v) => (v === undefined || v === null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const ci = (s) => (s.n ? `${pct(s.p)} {\\scriptsize [${pct(s.lo)}, ${pct(s.hi)}]}` : '--');

// ---------------------------------------------------------------- main
const loaded = runs.map(loadRun);
const allRows = loaded.map((run) => rows(run)); // not .map(rows): the index would become `th`
const results = { generated: new Date().toISOString(), label: opt.label, runs: loaded.map((r, i) => summarise(r, allRows[i])) };
// Sensitivity: AI-specific content differences under other thresholds (PROTOCOL.md §5).
// Under a looser threshold a newly flagged arm has no stored body: counts only.
const study = JSON.parse(readFileSync(new URL('config/study.json', ROOT), 'utf8'));
results.sensitivity = loaded.map((run) => ({
  run: run.name,
  sets: [study.thresholds, ...study.sensitivity].map((th) => {
    const R = rows(run, th).filter((x) => x.comparable && AI_ARMS.some((a) => a.id === x.arm));
    const domains = new Set(R.map((x) => x.domain));
    return { same: th.same, margin: th.margin, domains: domains.size,
      aiSpecificDiffDomains: new Set(R.filter((x) => x.aiSpecificDiff).map((x) => x.domain)).size,
      aiSpecificDiffPairs: R.filter((x) => x.aiSpecificDiff).length };
  }),
}));
if (loaded.length > 1) results.crossVantage ={ a: loaded[0].name, b: loaded[1].name, arms: crossVantage(allRows[0], allRows[1]) };

const OUT = new URL(`results/${opt.label}/`, ROOT);
const TEX = new URL('paper/tables/', ROOT);
mkdirSync(OUT, { recursive: true });
mkdirSync(TEX, { recursive: true });
writeFileSync(new URL('results.json', OUT), JSON.stringify(results, null, 1));

const flat = allRows.flat();
const cols = ['run', 'rank', 'domain', 'arm', 'role', 'operator', 'comparable', 'declared', 'served', 'how', 'status', 'edge', 'sim', 'blocked', 'aiSpecificBlock', 'aiSpecificDiff', 'payment', 'price'];
writeFileSync(new URL('per-domain.csv', OUT), [cols.join(','), ...flat.map((x) => cols.map((c) => csvCell(x[c])).join(','))].join('\n') + '\n');

// Release file (PROTOCOL.md §8, option b): domains replaced by a keyed hash, rank coarsened
// to a band (an exact Tranco rank would give the domain away). The key stays private, so
// the file cannot be reversed, but the same site keeps the same id across runs and waves.
const KEY_FILE = new URL('config/.domain-hash.key', ROOT);
if (existsSync(KEY_FILE)) {
  const key = readFileSync(KEY_FILE, 'utf8').trim();
  const id = (d) => createHmac('sha256', key).update(d).digest('hex').slice(0, 16);
  const band = (r) => (r <= 1000 ? '1-1k' : r <= 10000 ? '1k-10k' : '10k-1M');
  const rcols = ['run', 'site', 'rankBand', 'arm', 'role', 'operator', 'comparable', 'declared', 'served', 'how', 'status', 'edge', 'blocked', 'aiSpecificBlock', 'aiSpecificDiff', 'payment'];
  const rel = flat.map((x) => ({ ...x, site: id(x.domain), rankBand: band(x.rank) }));
  mkdirSync(new URL('release/', OUT), { recursive: true });
  writeFileSync(new URL('release/per-site-hashed.csv', OUT), [rcols.join(','), ...rel.map((x) => rcols.map((c) => csvCell(x[c])).join(','))].join('\n') + '\n');
} else {
  console.warn('no config/.domain-hash.key: release file not written');
}

// Review queue: AI-specific content differences, with the lines only the bot saw.
const queue = [];
loaded.forEach((run, i) => {
  const flagged = new Set(allRows[i].filter((x) => x.aiSpecificDiff).map((x) => `${x.domain}|${x.arm}`));
  for (const d of run.diffs) {
    if (!flagged.has(`${d.domain}|${d.arm}`)) continue;
    queue.push({ run: run.name, domain: d.domain, arm: d.arm, sim: d.sim?.toFixed(3), botOnly: (d.botOnly || []).slice(0, 15).join(' | '), browserOnly: (d.browserOnly || []).slice(0, 10).join(' | '), category: '', coder: '', note: '' });
  }
});
const qcols = ['run', 'domain', 'arm', 'sim', 'category', 'coder', 'note', 'botOnly', 'browserOnly'];
writeFileSync(new URL('review-queue.csv', OUT), [qcols.join(','), ...queue.map((q) => qcols.map((c) => csvCell(q[c])).join(','))].join('\n') + '\n');

// ---------------------------------------------------------------- LaTeX tables
const main = results.runs[0];
const armRows = TOKEN_ARMS.map((a) => {
  const s = main.perArm[a.id];
  return `${a.token} & ${a.role} & ${ci(s.declaredFullBlock)} & ${ci(s.servedBlocked)} & ${ci(s.aiSpecificBlock)} & ${s.payment.k} & ${s.aiSpecificDiff.k} \\\\`;
});
writeFileSync(new URL(`${opt.label}-arms.tex`, TEX), `% generated by src/analyze.js from ${main.run} -- do not edit
\\begin{tabular}{llrrrrr}
\\toprule
Agent & Role & robots.txt blocks (\\%) & Served block (\\%) & AI-specific block (\\%) & 402 & AI-only content \\\\
\\midrule
${armRows.join('\n')}
\\bottomrule
\\end{tabular}
`);

const f = main.funnel;
writeFileSync(new URL(`${opt.label}-funnel.tex`, TEX), `% generated by src/analyze.js from ${main.run} -- do not edit
\\begin{tabular}{lr}
\\toprule
Domains on the list & ${f.listed} \\\\
\\quad opted out & ${f.optedOut} \\\\
\\quad robots.txt unreachable (RFC 9309: disallow all) & ${f.robotsUnreachable} \\\\
\\quad our token disallowed by robots.txt & ${f.robotsDisallowStudy} \\\\
\\quad no website (no HTML, network error) & ${f.noWebsite} \\\\
\\quad crashed & ${f.crashed} \\\\
Probed with all agents & ${f.probed} \\\\
Comparable (both browser fetches agree) & ${f.comparable} \\\\
\\bottomrule
\\end{tabular}
`);

const crossRows = AI_ARMS.map((a) => {
  const c = main.perArm[a.id].cross;
  return `${a.token} & ${c.declaredAndEnforced} & ${c.declaredOnly} & ${c.enforcedOnly} & ${c.neither} \\\\`;
});
writeFileSync(new URL(`${opt.label}-cross.tex`, TEX), `% generated by src/analyze.js from ${main.run} -- do not edit
\\begin{tabular}{lrrrr}
\\toprule
 & \\multicolumn{2}{c}{robots.txt full block} & \\multicolumn{2}{c}{no full block} \\\\
\\cmidrule(lr){2-3}\\cmidrule(lr){4-5}
Agent & server blocks & server serves & server blocks & server serves \\\\
\\midrule
${crossRows.join('\n')}
\\bottomrule
\\end{tabular}
`);

const sRows = results.sensitivity[0].sets.map((s, i) => `${s.same.toFixed(2)} & ${s.margin.toFixed(2)}${i === 0 ? ' (pre-registered)' : ''} & ${s.aiSpecificDiffDomains} & ${s.aiSpecificDiffPairs} \\\\`);
writeFileSync(new URL(`${opt.label}-sensitivity.tex`, TEX), `% generated by src/analyze.js from ${main.run} -- do not edit
\\begin{tabular}{llrr}
\\toprule
Similarity & Margin & Sites with AI-specific difference & Site--agent pairs \\\\
\\midrule
${sRows.join('\n')}
\\bottomrule
\\end{tabular}
`);

if (results.crossVantage) {
  const cv = results.crossVantage.arms;
  const vRows = AI_ARMS.map((a) => `${a.token} & ${cv[a.id].n} & ${cv[a.id].both} & ${cv[a.id].onlyA} & ${cv[a.id].onlyB} & ${cv[a.id].kappa === null ? '--' : cv[a.id].kappa.toFixed(2)} \\\\`);
  writeFileSync(new URL(`${opt.label}-vantage.tex`, TEX), `% generated by src/analyze.js -- ${results.crossVantage.a} vs ${results.crossVantage.b} -- do not edit
\\begin{tabular}{lrrrrr}
\\toprule
Agent & Pairs & Blocked at both & Only A & Only B & $\\kappa$ \\\\
\\midrule
${vRows.join('\n')}
\\bottomrule
\\end{tabular}
`);
}

// Console summary
for (const r of results.runs) {
  console.log(`\n== ${r.run}  (${r.vantage.map((v) => `${v.vantage} ${v.country ?? ''} ${v.org ?? ''}`).join('; ')})`);
  console.log('funnel', r.funnel);
  console.table(Object.fromEntries(Object.entries(r.perArm).map(([id, s]) => [id, {
    n: s.n, robots: pct(s.declaredFullBlock.p), blocked: pct(s.servedBlocked.p), aiSpecific: pct(s.aiSpecificBlock.p), '402': s.payment.k, aiDiff: s.aiSpecificDiff.k,
  }])));
  console.log('any AI agent:', Object.fromEntries(Object.entries(r.anyAi).map(([k, s]) => [k, `${s.k}/${s.n} = ${pct(s.p)} %`])));
  console.log('RQ2 upper bound:', Object.fromEntries(Object.entries(r.rq2).map(([k, s]) => [k, `${s.k}/${s.n} = ${pct(s.p)} %`])));
}
for (const s of results.sensitivity) console.log(`sensitivity ${s.run}:`, s.sets.map((x) => `${x.same}/${x.margin}: ${x.aiSpecificDiffDomains} sites`).join('  '));
if (results.crossVantage) console.table(results.crossVantage.arms);
console.log(`\nresults/${opt.label}/  (review queue: ${queue.length} rows)  paper/tables/${opt.label}-*.tex`);
