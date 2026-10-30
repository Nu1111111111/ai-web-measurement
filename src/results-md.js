/**
 * RESULTS.md: every headline number of the study in one readable file, generated from
 * results/<label>/results.json and validation-summary.json. Nothing in it is typed by hand,
 * so it can be quoted as is; regenerate after every analysis.
 *
 *   node src/results-md.js
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { wilson } from './stats.js';

const ROOT = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const p1 = (x) => (100 * x).toFixed(1);
const s = (x) => (x?.n ? `${p1(x.p)} % (${x.k}/${x.n}) [${p1(x.lo)}, ${p1(x.hi)}]` : '–');
const labels = readdirSync(new URL('results/', ROOT)).filter((l) => /^wave/.test(l) && existsSync(new URL(`results/${l}/results.json`, ROOT))).sort();

const out = [
  '# Results (generated)',
  '',
  `Generated ${new Date().toISOString()} by \`node src/results-md.js\` from results/*/results.json.`,
  'Do not edit by hand. Shares: percent (k/n) [Wilson 95 % CI]; unit = domain; denominator = comparable domains.',
  '',
];

for (const label of labels) {
  const r = read(`results/${label}/results.json`);
  const repeat = label.startsWith('wave1v2-');
  out.push(`## ${label}`, '', `Analysis generated ${r.generated}.`, '');
  if (label.startsWith('wave2-')) out.push('**Wave 2 measured only the domains flagged in wave 1 (config/wave2-*.txt), so its shares are of flagged domains, not of the population; compare them with wave 1 only through the wave1v2 sections.**', '');
  if (repeat) out.push('**Repeatability, wave 1 vs wave 2 at one vantage point, on the wave-2 domains only (PROTOCOL.md §9: one day apart). "repeated" = share of wave-1 AI-specific blocks seen again in wave 2. κ is computed on flagged domains, so it is not a population κ.** Per-run shares of wave 1 are in the wave1-* sections.', '');
  for (const run of repeat ? [] : r.runs) {
    const f = run.funnel;
    out.push(`### ${run.run}`, '');
    out.push(`Vantage: ${run.vantage.map((v) => `${v.vantage} ${v.country ?? ''} ${v.org ?? ''}`.trim()).filter((v, i, a) => a.indexOf(v) === i).join('; ')}`);
    out.push(`Funnel: listed ${f.listed}, opted out ${f.optedOut}, robots.txt unreachable ${f.robotsUnreachable}, robots.txt disallows study ${f.robotsDisallowStudy}, no website ${f.noWebsite}, probed ${f.probed}, comparable ${f.comparable}.`, '');
    out.push('Any AI agent (per domain):', '');
    for (const [k, v] of Object.entries(run.anyAi)) out.push(`- ${k}: ${s(v)}`);
    out.push('', 'RQ2 upper bound (no manual coding):', '');
    for (const [k, v] of Object.entries(run.rq2 ?? {})) out.push(`- ${k}: ${s(v)}`);
    out.push('', '| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |', '|---|---|---|---|---|---|---|');
    for (const [id, a] of Object.entries(run.perArm)) {
      out.push(`| ${id} | ${a.role} | ${s(a.declaredFullBlock)} | ${s(a.servedBlocked)} | ${s(a.aiSpecificBlock)} | ${s(a.payment)} | ${s(a.aiSpecificDiff)} |`);
    }
    out.push('', 'Role split (domains with an AI-specific block, per operator): ' + Object.entries(run.roleSplit)
      .map(([op, x]) => `${op} training ${x.trainingBlocked}, search ${x.searchBlocked}, user ${x.userBlocked} of ${x.n}`).join('; '), '');
  }
  const cv = r.crossVantage;
  if (cv?.arms) {
    out.push(`### Agreement ${cv.a} vs ${cv.b} (AI-specific block)`, '', '| Agent | n | both | only first | only second | κ | repeated (both / first) |', '|---|---|---|---|---|---|---|');
    for (const [id, x] of Object.entries(cv.arms)) {
      const first = x.both + x.onlyA;
      out.push(`| ${id} | ${x.n} | ${x.both} | ${x.onlyA} | ${x.onlyB} | ${x.kappa === null || x.kappa === undefined ? '–' : x.kappa.toFixed(2)} | ${s({ k: x.both, n: first, ...wilson(x.both, first) })} |`);
    }
    out.push('');
  }
  const vs = `results/${label}/validation-summary.json`;
  if (existsSync(new URL(vs, ROOT))) {
    const v = read(vs);
    out.push('### Validation with real agents (PROTOCOL.md §7b)', '', '| Agent | checks | got content | refused/failed | unclear | not run | also blocked |', '|---|---|---|---|---|---|---|');
    for (const [agent, a] of Object.entries(v.agents)) out.push(`| ${agent} | ${a.checks} | ${a['got-content']} | ${a['refused/failed']} | ${a.unclear} | ${a['not-run']} | ${s(a.alsoBlocked)} |`);
    out.push('');
  }
}
writeFileSync(new URL('RESULTS.md', ROOT), `${out.join('\n')}\n`);
console.log(`RESULTS.md: ${labels.join(', ')}`);
