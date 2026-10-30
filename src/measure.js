/**
 * The measurement: robots.txt (declared policy) and one homepage GET per arm
 * (enforced policy, served content) for every domain of the frozen list.
 * Method: PROTOCOL.md.
 *
 *   node src/measure.js --vantage de-residential [--run ID] [--shard 1/4]
 *        [--sample 200 --seed 1] [--limit N] [--domains file.txt] [--concurrency 24] [--pilot]
 *
 * Writes runs/<run>/:
 *   manifest.json   code commit, config + list hashes, vantage (country, ASN; IP only hashed), times
 *   records.jsonl   one line per domain (resumable: finished domains are skipped)
 *   diffs.jsonl     differing lines for every arm classed content-/meta-differs
 *   raw/<domain>/   gzipped robots.txt and every body that is not a plain "same" page
 */
import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { parseRobots, allows, MAX_ROBOTS_BYTES } from './lib/robots.js';
import { features } from './lib/features.js';
import { request, followed, looksHtml } from './http.js';
import { ARMS, BROWSER_UA, STUDY_UA, STUDY_TOKEN, requestOrder } from './agents.js';
import { classify, isOk } from './compare.js';

for (const event of ['uncaughtException', 'unhandledRejection']) {
  process.on(event, (err) => {
    console.error(`${event}:`, err?.stack || err);
    process.exit(1);
  });
}

const ROOT = new URL('../', import.meta.url);
const study = JSON.parse(readFileSync(new URL('config/study.json', ROOT), 'utf8'));
const { values: opt } = parseArgs({
  options: {
    vantage: { type: 'string' }, run: { type: 'string' }, shard: { type: 'string' },
    sample: { type: 'string' }, seed: { type: 'string', default: '1' }, limit: { type: 'string' },
    domains: { type: 'string' }, concurrency: { type: 'string' }, pilot: { type: 'boolean', default: false },
    stratum: { type: 'string', default: 'head' },
  },
});
if (!['head', 'tail'].includes(opt.stratum)) throw new Error('--stratum must be head (top 10k) or tail (random sample of ranks 10k-1M)');
if (!opt.vantage) throw new Error('--vantage is required (e.g. de-residential, gh-azure)');
if (!study.infoUrl && !opt.pilot) throw new Error('config/study.json has no infoUrl: the study UA must link to the info/opt-out page before a full run. Use --pilot for a test.');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const today = new Date().toISOString().slice(0, 10);
const RUN = opt.run || `${today}-${opt.stratum}-${opt.vantage}${opt.pilot ? '-pilot' : ''}`;
const DIR = new URL(`runs/${RUN}/`, ROOT);
const RAW = new URL('raw/', DIR);
mkdirSync(RAW, { recursive: true });
const OUT = new URL('records.jsonl', DIR);
const DIFFS = new URL('diffs.jsonl', DIR);

// ---------------------------------------------------------------- population
const listFile = opt.stratum === 'tail' ? study.tailList : study.list;
const listText = readFileSync(new URL(listFile, ROOT), 'utf8');
let rows = listText.split(/\r?\n/).filter(Boolean).map((l) => {
  const [rank, domain] = l.split(',');
  return { rank: Number(rank), domain: domain.trim().toLowerCase() };
});
const optout = new Set(existsSync(new URL('config/optout.txt', ROOT))
  ? readFileSync(new URL('config/optout.txt', ROOT), 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim().toLowerCase()).filter(Boolean)
  : []);
if (opt.domains) {
  const keep = new Set(readFileSync(opt.domains, 'utf8').split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean));
  rows = rows.filter((r) => keep.has(r.domain));
}
if (opt.sample) {
  // Seeded shuffle (mulberry32), so pilot samples are reproducible.
  let s = Number(opt.seed) >>> 0;
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  rows = copy.slice(0, Number(opt.sample)).sort((a, b) => a.rank - b.rank);
}
if (opt.shard) {
  const [i, n] = opt.shard.split('/').map(Number);
  rows = rows.filter((_, k) => k % n === i - 1);
}
if (opt.pilot) rows = rows.slice(0, study.pilotMaxDomains);
if (opt.limit) rows = rows.slice(0, Number(opt.limit));

// ---------------------------------------------------------------- manifest
async function vantageInfo() {
  // Country and network only: a residential IP (even hashed, IPv4 is easily enumerated) and its
  // city are personal data.
  const r = await request('https://ipinfo.io/json', STUDY_UA, { accept: 'application/json', timeout: 10000 });
  try {
    const j = JSON.parse(r.text);
    return { country: j.country, org: j.org };
  } catch {
    return { error: r.error || `http ${r.status}` };
  }
}
function gitState() {
  try {
    const commit = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain -- src config', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: null };
  }
}
const MANIFEST = new URL('manifest.json', DIR);
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { run: RUN, sessions: [] };
const session = {
  started: new Date().toISOString(), vantage: opt.vantage, where: await vantageInfo(), git: gitState(),
  node: process.version, args: opt, studyUa: STUDY_UA, configSha256: sha(readFileSync(new URL('config/study.json', ROOT))),
  stratum: opt.stratum, list: listFile, listSha256: sha(listText), domains: rows.length, arms: ARMS.map(({ id, ua }) => ({ id, ua })),
};
manifest.sessions.push(session);
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`run ${RUN}: ${rows.length} domains from ${opt.vantage} (${session.where.country ?? '?'} ${session.where.org ?? ''}), commit ${session.git.commit?.slice(0, 7) ?? 'none'}${session.git.dirty ? ' DIRTY' : ''}`);

// ---------------------------------------------------------------- per domain
function keep(domain, name, bytes) {
  if (!bytes?.length) return undefined;
  const dir = new URL(`${encodeURIComponent(domain)}/`, RAW);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL(`${name}.gz`, dir), gzipSync(bytes));
  return true;
}

async function fetchRobots(origin) {
  const opts = { maxBytes: MAX_ROBOTS_BYTES, timeout: 15000, accept: 'text/plain,*/*;q=0.8' };
  let r = await followed(`${origin}/robots.txt`, STUDY_UA, opts);
  let retried = false;
  if ([401, 403, 406].includes(r.status)) {
    // Some WAFs refuse unknown UAs even for robots.txt; the file is public policy, so read it as a browser.
    r = await followed(`${origin}/robots.txt`, BROWSER_UA, opts);
    retried = true;
  }
  let status;
  if (r.error === 'too-many-redirects') status = 'none';
  else if (r.status === 0 || r.status >= 500) status = 'unreachable';
  else if (r.status >= 400) status = 'none';
  else if (r.status >= 200 && r.status < 300) status = looksHtml(r) ? 'html' : 'ok';
  else status = 'unreachable';
  return {
    meta: { origin, status, http: r.status, error: r.error, retried, finalUrl: r.finalUrl, chain: r.chain?.length ? r.chain : undefined,
      bytes: r.bytes?.length, truncated: r.truncated, sha256: r.bytes ? sha(r.bytes) : undefined },
    text: status === 'ok' ? r.text : '',
    bytes: r.bytes,
  };
}

async function measure({ rank, domain }) {
  const rec = { rank, domain, at: new Date().toISOString() };
  if (optout.has(domain)) return { ...rec, skipped: 'opted-out' };

  let robots = await fetchRobots(`https://${domain}`);
  if (robots.meta.status === 'unreachable' && robots.meta.http === 0) {
    const www = await fetchRobots(`https://www.${domain}`);
    if (www.meta.status !== 'unreachable') robots = www;
  }
  let home = await request(`https://${domain}/`, BROWSER_UA, { maxBytes: study.maxBytes, timeout: study.timeoutMs });
  if (home.status === 0) {
    const www = await request(`https://www.${domain}/`, BROWSER_UA, { maxBytes: study.maxBytes, timeout: study.timeoutMs });
    if (www.status !== 0) home = www;
  }
  const homeOrigin = home.status ? new URL(home.finalUrl).origin : null;
  // robots.txt applies per origin: use the one of the host the site actually lives on.
  if (homeOrigin && homeOrigin !== robots.meta.origin && homeOrigin !== new URL(robots.meta.finalUrl || robots.meta.origin).origin) {
    rec.robotsDomain = robots.meta;
    robots = await fetchRobots(homeOrigin);
  }
  rec.robots = robots.meta;
  if (robots.text) keep(domain, 'robots.txt', robots.bytes);

  const pathname = homeOrigin ? new URL(home.finalUrl).pathname : '/';
  rec.studyAllowed = robots.meta.status === 'unreachable' ? false : allows(parseRobots(robots.text), STUDY_TOKEN, pathname);
  const bodies = { browser1: home };
  const f1 = home.bytes ? features(home.text) : {};
  const arms = { browser1: armMeta(home, f1, 0) };
  rec.arms = arms;
  if (!(isOk(arms.browser1) || home.status >= 400) || !rec.studyAllowed) {
    // No website to compare against (or we may not fetch it): record browser1 only.
    // RFC 9309 §2.3.1.4: an unreachable robots.txt (5xx, network) means "disallow all".
    rec.armsSkipped = robots.meta.status === 'unreachable' ? 'robots-unreachable'
      : !rec.studyAllowed ? 'robots-disallows-study' : 'no-website';
    if (home.bytes && home.status >= 400) keep(domain, 'browser1.html', home.bytes);
    return rec;
  }

  // Every arm requests the URL browser1 ended on, so redirects do not differ by arm.
  const url = home.status < 400 ? home.finalUrl : `https://${new URL(home.finalUrl).host}/`;
  let position = 1;
  for (const arm of requestOrder(domain).slice(1)) {
    await sleep(study.gapMs);
    let r = await request(url, arm.ua, { maxBytes: study.maxBytes, timeout: study.timeoutMs });
    let retried = false;
    if (r.status === 0) {
      // One retry on a network error only (PROTOCOL.md §5); HTTP statuses are never retried.
      await sleep(3000);
      r = await request(url, arm.ua, { maxBytes: study.maxBytes, timeout: study.timeoutMs });
      retried = true;
    }
    bodies[arm.id] = r;
    arms[arm.id] = { ...armMeta(r, r.bytes ? features(r.text) : {}, position++), retried: retried || undefined };
  }

  const verdict = classify(arms, (id) => bodies[id]?.text || '');
  rec.noise = verdict.noise;
  for (const [id, v] of Object.entries(verdict.arms)) {
    const { botOnly, browserOnly, metaValues, ...short } = v;
    Object.assign(arms[id], short);
    if (botOnly || metaValues) appendFileSync(DIFFS, JSON.stringify({ domain, arm: id, class: v.class, sim: v.sim, botOnly, browserOnly, metaValues }) + '\n');
  }
  // Bodies: everything that is not a plain "same" page, plus both references when anything differs.
  const odd = Object.entries(verdict.arms).filter(([, v]) => v.class !== 'same').map(([id]) => id);
  for (const id of odd.length ? ['browser1', 'browser2', ...odd] : []) {
    if (bodies[id]?.bytes) arms[id].kept = keep(domain, `${id}.html`, bodies[id].bytes);
  }
  return rec;
}

function armMeta(r, f, position) {
  return {
    position, status: r.status, error: r.error, ms: r.ms, finalUrl: r.finalUrl, type: r.type, headers: r.headers,
    bytes: r.bytes?.length, truncated: r.truncated, sha256: r.bytes ? sha(r.bytes) : undefined,
    words: f.words, title: f.title?.slice(0, 200), description: f.description?.slice(0, 300), robotsMeta: f.robotsMeta,
    canonical: f.canonical, xRobotsTag: r.headers?.['x-robots-tag'], challenge: f.challenge, jsonld: f.jsonld, llmsTxtLink: f.llmsTxtLink,
  };
}

// ---------------------------------------------------------------- run
const done = new Set(existsSync(OUT)
  ? readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).domain; } catch { return null; } })
  : []);
const todo = rows.filter((r) => !done.has(r.domain));
const CONCURRENCY = Number(opt.concurrency || study.concurrency);
console.log(`${done.size} already done, ${todo.length} to go, concurrency ${CONCURRENCY}`);
let next = 0;
let finished = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < todo.length) {
    const row = todo[next++];
    let rec;
    try {
      rec = await measure(row);
    } catch (err) {
      rec = { ...row, at: new Date().toISOString(), crash: String(err?.stack || err).slice(0, 500) };
    }
    appendFileSync(OUT, JSON.stringify(rec) + '\n');
    if (++finished % 50 === 0 || finished === todo.length) {
      const rate = finished / ((Date.now() - t0) / 60000);
      console.log(`${finished}/${todo.length}  ${rate.toFixed(0)}/min  eta ${((todo.length - finished) / rate).toFixed(0)} min`);
    }
  }
}));
session.finished = new Date().toISOString();
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`done: runs/${RUN}`);
