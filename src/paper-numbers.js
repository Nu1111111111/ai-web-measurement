/**
 * paper/numbers.tex: every result the paper text quotes, as \R{key}, generated from
 * results/<label>/results.json, validation-summary.json and config/study.json. The text never
 * types a result by hand; an unknown key stops the LaTeX build.
 *
 *   node src/paper-numbers.js            (writes paper/numbers.tex and paper/numbers-keys.txt)
 *
 * Keys: <set>.<vantage>.<group>.<metric>[.<part>], e.g. w1head.de.any.aiSpecificBlock.p
 *   sets      w1head w1tail w2head w2tail; repeatability w1v2head.de w1v2head.az ...
 *   vantage   de (residential) az (GitHub Actions / Azure)
 *   parts     p (percent, 1 dp)  k  n  lo  hi  ci ("p\,\% [lo, hi]")
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { wilson } from './stats.js';
import { ARMS, AI_ARMS } from './agents.js';

const ROOT = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const V = (run) => (/de-residential/.test(run) ? 'de' : /gh-azure/.test(run) ? 'az' : run);
const int = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
const pc = (x) => (100 * x).toFixed(1);
const M = new Map();
const put = (k, v) => { if (M.has(k)) throw new Error(`duplicate key ${k}`); M.set(k, String(v)); };
const share = (k, s) => {
  put(`${k}.k`, int(s.k)); put(`${k}.n`, int(s.n));
  if (!s.n) return;
  put(`${k}.p`, pc(s.p)); put(`${k}.lo`, pc(s.lo)); put(`${k}.hi`, pc(s.hi));
  put(`${k}.ci`, `${pc(s.p)}\\,\\% [${pc(s.lo)}, ${pc(s.hi)}]`);
};
const range = (k, xs, f) => { put(`${k}.min`, f(Math.min(...xs))); put(`${k}.max`, f(Math.max(...xs))); };
const aiIds = new Set(AI_ARMS.map((a) => a.id));

// design (from config and code, so the method section quotes the same values the run used)
const study = read('config/study.json');
put('design.arms', ARMS.length);
put('design.ai', AI_ARMS.length);
put('design.gapMs', study.gapMs);
put('design.same', study.thresholds.same.toFixed(2));
put('design.margin', study.thresholds.margin.toFixed(2));
put('design.sens', study.sensitivity.map((s) => `${s.same.toFixed(2)}/${s.margin.toFixed(2)}`).join(', '));
put('design.headList', int(readFileSync(new URL(study.list, ROOT), 'utf8').split(/\r?\n/).filter(Boolean).length));
put('design.tailList', int(readFileSync(new URL(study.tailList, ROOT), 'utf8').split(/\r?\n/).filter(Boolean).length));
for (const role of ['training', 'search', 'user']) put(`design.role.${role}`, ARMS.filter((a) => a.role === role).length);
// control user agents, verbatim, for the method section
const tt = (s) => s.replace(/([#$%&_{}])/g, '\\$1');
for (const id of ['control-plain', 'control-bot']) {
  const ua = ARMS.find((a) => a.id === id).ua;
  put(`design.ua.${id}`, tt(ua));
  put(`design.ua.${id}.product`, tt(ua.match(/compatible; ([^;]+);/)[1]));
}
const gptbotUa = ARMS.find((a) => a.id === 'gptbot').ua;
put('design.ua.gptbot', tt(gptbotUa));
const v2sample = new URL('results/wave1-head/validation2/sample.csv', ROOT);
if (existsSync(v2sample)) {
  const ls = readFileSync(v2sample, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  for (const st of ['blocked', 'served']) put(`design.val2.${st}`, ls.filter((l) => l.split(',')[1] === st && l.split(',')[2] === 'ChatGPT').length);
}
for (const s of ['head', 'tail']) put(`design.wave2.${s}`,int(readFileSync(new URL(`config/wave2-${s}.txt`, ROOT), 'utf8').split(/\r?\n/).filter(Boolean).length));

const SETS = { w1head: 'wave1-head', w1tail: 'wave1-tail', w2head: 'wave2-head', w2tail: 'wave2-tail' };
for (const [set, label] of Object.entries(SETS)) {
  const r = read(`results/${label}/results.json`);
  for (const run of r.runs) {
    const p = `${set}.${V(run.run)}`;
    for (const [k, v] of Object.entries(run.funnel)) put(`${p}.funnel.${k}`, int(v));
    for (const [k, v] of Object.entries(run.anyAi)) share(`${p}.any.${k}`, v);
    for (const [k, v] of Object.entries(run.rq2)) share(`${p}.rq2.${k}`, v);
    for (const [arm, a] of Object.entries(run.perArm)) {
      for (const m of ['declaredFullBlock', 'servedBlocked', 'aiSpecificBlock', 'payment', 'contentDiffers', 'aiSpecificDiff']) share(`${p}.arm.${arm}.${m}`, a[m]);
      for (const [k, v] of Object.entries(a.cross)) put(`${p}.arm.${arm}.cross.${k}`, int(v));
      const blocks = a.aiSpecificBlock.k;
      for (const e of ['Cloudflare', 'Akamai', 'AWS', 'other']) share(`${p}.arm.${arm}.edge.${e}`, { k: a.edges[e] ?? 0, n: blocks, ...wilson(a.edges[e] ?? 0, blocks) });
    }
    for (const [op, x] of Object.entries(run.roleSplit)) for (const [k, v] of Object.entries(x)) put(`${p}.role.${op}.${k}`, int(v));
    // AI agents only: range of per-agent AI-specific block shares
    const ai = Object.entries(run.perArm).filter(([id]) => aiIds.has(id)).map(([, a]) => a.aiSpecificBlock.p);
    range(`${p}.armAiSpecificBlock`, ai, pc);
    // of the sites that block an AI agent in robots.txt or on the server, the share doing both
    const both = Object.entries(run.perArm).filter(([id]) => aiIds.has(id)).map(([, a]) => {
      const c = a.cross;
      return c.declaredAndEnforced / (c.declaredAndEnforced + c.declaredOnly + c.enforcedOnly);
    });
    range(`${p}.crossBothShare`, both, pc);
    // same range per role (training, search, user, reference = Googlebot/Bingbot)
    for (const role of ['training', 'search', 'user', 'reference']) {
      const xs = ARMS.filter((a) => a.role === role).map((a) => run.perArm[a.id].aiSpecificBlock.p);
      range(`${p}.roleAiSpecificBlock.${role}`, xs, pc);
    }
  }
  for (const s of r.sensitivity) {
    const p = `${set}.${V(s.run)}.sens`;
    for (const x of s.sets) {
      const k = `${p}.${x.same.toFixed(2)}-${x.margin.toFixed(2)}`;
      share(k, { k: x.aiSpecificDiffDomains, n: x.domains, ...wilson(x.aiSpecificDiffDomains, x.domains) });
    }
    range(`${p}.range`, s.sets.map((x) => x.aiSpecificDiffDomains / x.domains), pc);
  }
  if (r.crossVantage?.arms) {
    const p = `${set}.cv`;
    for (const [arm, x] of Object.entries(r.crossVantage.arms)) {
      put(`${p}.${arm}.n`, int(x.n)); put(`${p}.${arm}.both`, int(x.both)); put(`${p}.${arm}.onlyA`, int(x.onlyA)); put(`${p}.${arm}.onlyB`, int(x.onlyB));
      put(`${p}.${arm}.kappa`, x.kappa.toFixed(2));
    }
    range(`${p}.kappaAi`, Object.entries(r.crossVantage.arms).filter(([id]) => aiIds.has(id)).map(([, x]) => x.kappa), (v) => v.toFixed(2));
  }
}

// RQ3: who answers the 402s (domain level, AI agents, comparable domains), from the row-level
// per-domain.csv (local only; it names sites, the macros do not)
const cells = (line) => { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
for (const [set, label] of [['w1head', 'wave1-head'], ['w1tail', 'wave1-tail']]) {
  const [h, ...ls] = readFileSync(new URL(`results/${label}/per-domain.csv`, ROOT), 'utf8').split(/\r?\n/).filter(Boolean);
  const col = Object.fromEntries(cells(h).map((x, i) => [x, i]));
  const pay = {};
  for (const l of ls) {
    const x = cells(l);
    if (x[col.comparable] !== 'true' || x[col.payment] !== 'true' || !aiIds.has(x[col.arm])) continue;
    const d = ((pay[x[col.run]] ??= {})[x[col.domain]] ??= { edges: new Set(), price: false });
    d.edges.add(x[col.edge]);
    if (x[col.price]) d.price = true;
  }
  for (const [run, doms] of Object.entries(pay)) {
    const D = Object.values(doms);
    const p = `${set}.${V(run)}.pay`;
    put(`${p}.domains`, int(D.length));
    for (const e of ['Cloudflare', 'other']) {
      const k = D.filter((d) => d.edges.has(e)).length;
      share(`${p}.edge.${e}`, { k, n: D.length, ...wilson(k, D.length) });
    }
    const k = D.filter((d) => d.price).length;
    share(`${p}.priceHeader`, { k, n: D.length, ...wilson(k, D.length) });
  }
}

// repeatability: wave 1 vs wave 2 at one vantage point
for (const s of ['head', 'tail']) {
  for (const v of ['de-residential', 'gh-azure']) {
    const r = read(`results/wave1v2-${s}-${v}/results.json`);
    const p = `w1v2${s}.${V(v)}`;
    const reps = [];
    const kap = [];
    for (const [arm, x] of Object.entries(r.crossVantage.arms)) {
      const first = x.both + x.onlyA;
      share(`${p}.${arm}.repeat`, { k: x.both, n: first, ...wilson(x.both, first) });
      put(`${p}.${arm}.new`, int(x.onlyB));
      put(`${p}.${arm}.kappa`, x.kappa.toFixed(2));
      if (aiIds.has(arm)) { reps.push(x.both / first); kap.push(x.kappa); }
    }
    range(`${p}.repeatAi`, reps, pc);
    range(`${p}.kappaAi`, kap, (x) => x.toFixed(2));
    put(`${p}.pairs`, int(Object.values(r.crossVantage.arms)[0].n));
  }
}

// real-agent validation (PROTOCOL.md §7b)
const val = 'results/wave1-head/validation-summary.json';
if (existsSync(new URL(val, ROOT))) {
  for (const [agent, a] of Object.entries(read(val).agents)) {
    const p = `val.${agent}`;
    for (const k of ['checks', 'got-content', 'refused/failed', 'unclear', 'not-run']) put(`${p}.${k.replace('/', '-')}`, int(a[k]));
    share(`${p}.alsoBlocked`, a.alsoBlocked);
  }
}

// exploratory analyses after pre-review (src/extra.js, PROTOCOL.md §9 2026-10-29)
const pfmt = (p) => (p < 0.001 ? '\\(p<0.001\\)' : `\\(p=${p.toFixed(p < 0.01 ? 3 : 2)}\\)`);
for (const [set, label] of [['w1head', 'wave1-head'], ['w1tail', 'wave1-tail']]) {
  const x = read(`results/${label}/extra.json`);
  for (const run of x.runs) {
    const p = `${set}.${V(run.run)}.x`;
    for (const [arm, o] of Object.entries(run.overlap.arms)) {
      share(`${p}.ov.${arm}.alsoRef`, o.alsoRefBlocked);
      share(`${p}.ov.${arm}.beyondRef`, o.beyondRef);
      put(`${p}.ov.${arm}.b`, int(o.vsGooglebot.b));
      put(`${p}.ov.${arm}.c`, int(o.vsGooglebot.c));
      put(`${p}.ov.${arm}.pHolm`, pfmt(o.vsGooglebot.pHolm));
    }
    for (const [role, s] of Object.entries(run.overlap.roles)) share(`${p}.ovRole.${role}`, s);
    for (const role of ['training', 'search', 'user']) {
      const arms = AI_ARMS.filter((a) => a.role === role);
      range(`${p}.beyondRef.${role}`, arms.map((a) => run.overlap.arms[a.id].beyondRef.p), pc);
      range(`${p}.alsoRef.${role}`, arms.map((a) => run.overlap.arms[a.id].alsoRefBlocked.p), (v) => pc(v));
      const ps = arms.map((a) => run.overlap.arms[a.id].vsGooglebot.pHolm);
      put(`${p}.pHolmMax.${role}`, pfmt(Math.max(...ps)));
      put(`${p}.pHolmMin.${role}`, pfmt(Math.min(...ps)));
      // agents of the role refused significantly LESS often than spoofed Googlebot (c > b, Holm < 0.05)
      put(`${p}.lessThanGb.${role}`, int(arms.filter((a) => { const o = run.overlap.arms[a.id].vsGooglebot; return o.c > o.b && o.pHolm < 0.05; }).length));
      put(`${p}.moreThanGb.${role}`, int(arms.filter((a) => { const o = run.overlap.arms[a.id].vsGooglebot; return o.b > o.c && o.pHolm < 0.05; }).length));
    }
    range(`${p}.crossAiBothShare`, AI_ARMS.map((a) => run.crossAi[a.id].bothShare), pc);
    for (const [k, v] of Object.entries(run.crossAi.gptbot)) if (k !== 'bothShare') put(`${p}.crossAi.gptbot.${k}`, int(v));
    const u = run.funnel.unreachable;
    for (const k of ['dns', 'connect', 'tls', '5xx', 'other']) put(`${p}.unreach.${k}`, int(u[k] ?? 0));
    const ds = run.disallowStudy;
    put(`${p}.disallow.n`, int(ds.n)); put(`${p}.disallow.all`, int(ds.allTokensBlocked));
    put(`${p}.disallow.gbAllowed`, int(ds.googlebotAllowed)); put(`${p}.disallow.gptbot`, int(ds.perToken.GPTBot));
    for (const [t, s] of Object.entries(run.extraTokens)) if (t !== 'n') share(`${p}.tok.${t}`, s);
    range(`${p}.tokRange`, Object.entries(run.extraTokens).filter(([t]) => t !== 'n').map(([, s]) => s.p), pc);
    for (const g of ['training', 'ai']) for (const k of ['signature', 'cdn-header-only', 'none']) share(`${p}.layer.${g}.${k}`, run.layer[g][k]);
    for (const k of ['early', 'late', 'rawEarly', 'rawLate', 'unconfirmedShare']) share(`${p}.order.${k}`, run.order[k]);
    for (const [k, s] of Object.entries(run.payment)) if (k !== 'n') share(`${p}.pay.${k}`, s); else put(`${p}.pay.n`, int(s));
    if (run.validation) {
      for (const [agent, strata] of Object.entries(run.validation)) {
        for (const st of ['ai-specific-block', 'served']) share(`val.${agent}.same.${st}`, strata[st] ?? { k: 0, n: 0 });
      }
    }
  }
  if (x.vantageFunnel) {
    const f = x.vantageFunnel;
    put(`${set}.x.vf.both`, int(f.unreachableBoth));
    put(`${set}.x.vf.otherProbed`, int(f.unreachableOnlyAProbedB + f.unreachableOnlyBProbedA));
  }
}

// real-browser check (tools/browser-check) and second real-agent design (src/validate2.js);
// until they have run, their keys print a visible TODO instead of stopping the build
const pending = (keys, what) => { for (const k of keys) put(k, `\\todo{${what}}`); };
const bc = 'results/wave1-head/browsercheck-summary.json';
const BC_KEYS = ['bc.comparable.n', 'bc.comparable.sameTitle.ci', 'bc.comparable.realReadable.ci', 'bc.notComparable.n',
  'bc.notComparable.oursRefused.ci', 'bc.notComparable.oursRefusedRealReadable.ci', 'bc.notComparable.realReadable.ci'];
if (existsSync(new URL(bc, ROOT)) && read(bc).comparable.n >= 100) {
  const b = read(bc);
  put('bc.comparable.n', int(b.comparable.n)); put('bc.notComparable.n', int(b.notComparable.n));
  for (const k of ['sameTitle', 'realReadable']) share(`bc.comparable.${k}`, b.comparable[k]);
  for (const k of ['oursRefused', 'oursRefusedRealReadable', 'realReadable']) share(`bc.notComparable.${k}`, b.notComparable[k]);
} else pending(BC_KEYS, 'browser check');
const v2 = 'results/wave1-head/validation2-summary.json';
const V2_KEYS = [];
for (const ag of ['ChatGPT', 'Claude', 'Perplexity']) {
  V2_KEYS.push(`val2.${ag}.canary`);
  for (const st of ['blocked', 'served']) for (const k of ['k', 'n', 'ci', 'unclearMemory', 'unclear', 'tool', 'toolRobots', 'site', 'stale', 'notRun', 'memChecks', 'memKnows']) V2_KEYS.push(`val2.${ag}.${st}.${k}`);
}
if (existsSync(new URL(v2, ROOT))) {
  const s = read(v2);
  for (const ag of ['ChatGPT', 'Claude', 'Perplexity']) {
    const a = s.agents[ag] || {};
    put(`val2.${ag}.canary`, a.canary?.['got-content'] ? 'yes' : 'no');
    for (const st of ['blocked', 'served']) {
      const x = a[st] || { refused: { k: 0, n: 0 }, 'unclear-memory': 0, unclear: 0 };
      share(`val2.${ag}.${st}`, x.refused);
      if (!x.refused.n) put(`val2.${ag}.${st}.ci`, '--');
      put(`val2.${ag}.${st}.unclearMemory`, int(x['unclear-memory']));
      put(`val2.${ag}.${st}.unclear`, int(x.unclear));
      put(`val2.${ag}.${st}.tool`, int(x.toolBlocked ?? 0));
      put(`val2.${ag}.${st}.toolRobots`, int(x.toolBlockedRobots ?? 0));
      put(`val2.${ag}.${st}.site`, int(x['refused/failed'] - (x.toolBlocked ?? 0)));
      put(`val2.${ag}.${st}.stale`, int(x.stale ?? 0));
      put(`val2.${ag}.${st}.notRun`, int(x['not-run'] ?? 0));
      put(`val2.${ag}.${st}.memChecks`, int(x['got-content'] + x['unclear-memory']));
      put(`val2.${ag}.${st}.memKnows`, int(x['unclear-memory']));
    }
  }
} else pending(V2_KEYS, 'B4');

// figure data: per agent, declared full block vs AI-specific block (wave 1, residential), one
// file per stratum, rows grouped by role; plotted by pgfplots in main.tex
const ROLE_ORDER = ['training', 'search', 'user', 'reference'];
const figArms = ARMS.filter((a) => ROLE_ORDER.includes(a.role))
  .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
for (const [set, label] of [['head', 'wave1-head'], ['tail', 'wave1-tail']]) {
  const run = read(`results/${label}/results.json`).runs.find((r) => V(r.run) === 'de');
  const ex = read(`results/${label}/extra.json`).runs.find((r) => V(r.run) === 'de');
  const rows = figArms.map((a, i) => {
    const d = run.perArm[a.id].declaredFullBlock;
    const s = run.perArm[a.id].aiSpecificBlock;
    // AI-specific blocks on sites that serve both spoofed search engines (not defined for them)
    const o = ex.overlap.arms[a.id]?.beyondRef;
    const beyond = o ? [pc(o.p), pc(o.p - o.lo), pc(o.hi - o.p)] : ['nan', 'nan', 'nan'];
    // y = row index; the plot uses y dir=reverse, so row 0 is on top and tick i is labelled
    // with row i's token
    return [i, a.token, a.role, pc(d.p), pc(d.p - d.lo), pc(d.hi - d.p), pc(s.p), pc(s.p - s.lo), pc(s.hi - s.p), ...beyond].join(' ');
  });
  writeFileSync(new URL(`paper/fig-arms-${set}.dat`, ROOT),
    ['y label role decl declLo declHi spec specLo specHi beyond beyondLo beyondHi', ...rows, ''].join('\n'));
}

const tex = [
  '% generated by src/paper-numbers.js -- do not edit',
  ...[...M].map(([k, v]) => `\\expandafter\\def\\csname R@${k}\\endcsname{${v}}`),
  '',
].join('\n');
writeFileSync(new URL('paper/numbers.tex', ROOT), tex);
writeFileSync(new URL('paper/numbers-keys.txt', ROOT), [...M].map(([k, v]) => `${k} = ${v}`).join('\n') + '\n');
console.log(`paper/numbers.tex: ${M.size} values`);
