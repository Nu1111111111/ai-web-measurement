/**
 * Manual coding of content differences (PROTOCOL.md §6): builds one self-contained HTML page
 * per coder from the review queues, and later checks agreement.
 *
 *   node src/coding-pack.js results/wave1-head results/wave1-tail     -> <dir>/coding/coding.html (per queue)
 *   node src/coding-pack.js --agree a.csv b.csv                       -> Cohen's kappa + disagreements
 *
 * The unit is one (run, domain): every arm whose page differed is listed under it, so one
 * category usually covers all of them, and a single arm can be set apart. Arms are shown as
 * "Bot 1, Bot 2 ..." in a per-site random order: the coder judges the difference, not who got
 * it. Whether a category-6 case is AI-specific follows afterwards from the arm (AI agent vs
 * Googlebot/Bingbot), never from the coder. The page keeps answers in the browser and exports
 * a CSV; it never sends anything anywhere. Site names stay local (results/<label>/coding is gitignored).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { kappa } from './stats.js';

export const CATEGORIES = [
  [1, 'Noise', 'Rotating content, timestamps, ads, recommendations, A/B text: would differ between two browser visits too.'],
  [2, 'Soft block', 'The bot gets an error, challenge, "access denied" or near-empty page served with HTTP 200.'],
  [3, 'Prerender / bot version', 'Same content in another form: server-rendered or simplified page, no-JS fallback, AMP, lite version.'],
  [4, 'Consent / geo / paywall', 'Cookie banner, region or language redirect, login or paywall text differs.'],
  [5, 'SEO / meta only', 'Only structured data, meta tags, hidden SEO text or link lists differ; the visible content is the same.'],
  [6, 'Substantive bot-only content', 'The bot gets different substantive content: other claims, prices, products or text addressed to machines.'],
];

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ''), r[i] ?? ''])));
}

function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

function pack(dir) {
  const rows = parseCsv(readFileSync(join(dir, 'review-queue.csv'), 'utf8'));
  const groups = new Map();
  for (const r of rows) {
    const k = `${r.run}|${r.domain}`;
    if (!groups.has(k)) groups.set(k, { run: r.run, domain: r.domain, arms: [] });
    // Some "lines" are whole minified pages: cap each so the page stays usable.
    const lines = (s) => s.split(' | ').filter(Boolean).map((l) => (l.length > 400 ? `${l.slice(0, 400)} […]` : l));
    groups.get(k).arms.push({ arm: r.arm, sim: r.sim, botOnly: lines(r.botOnly), browserOnly: lines(r.browserOnly) });
  }
  // Stable but meaningless order: sites by hash, arms within a site by hash.
  const items = [...groups.values()].sort((a, b) => hash(a.run + a.domain) - hash(b.run + b.domain)).map((g, i) => ({
    id: `${g.run}|${g.domain}`, n: i + 1, domain: g.domain, vantage: /azure/.test(g.run) ? 'cloud (US datacenter)' : 'residential (DE)',
    arms: g.arms.sort((a, b) => hash(g.domain + a.arm) - hash(g.domain + b.arm)),
  }));
  const label = dir.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
  const out = join(dir, 'coding');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'coding.html'), page(label, items));
  console.log(`${join(out, 'coding.html')}: ${items.length} sites, ${rows.length} arm rows`);
}

function agree(fileA, fileB) {
  const read = (f) => new Map(parseCsv(readFileSync(f, 'utf8')).map((r) => [`${r.run}|${r.domain}|${r.arm}`, r]));
  const A = read(fileA), B = read(fileB);
  const keys = [...A.keys()].filter((k) => B.has(k) && A.get(k).category && B.get(k).category);
  const la = keys.map((k) => A.get(k).category), lb = keys.map((k) => B.get(k).category);
  const six = (l) => l.map((c) => (c === '6' ? '6' : 'other'));
  console.log(`${keys.length} arm rows coded by both`);
  console.log(`kappa, six categories: ${kappa(la, lb).toFixed(3)}`);
  console.log(`kappa, category 6 vs rest: ${kappa(six(la), six(lb)).toFixed(3)}`);
  const dis = keys.filter((k, i) => la[i] !== lb[i]);
  const out = fileA.replace(/[^\\/]+$/, 'disagreements.csv');
  writeFileSync(out, ['run,domain,arm,coderA,coderB,resolved,note', ...dis.map((k) => `${k.split('|').join(',')},${A.get(k).category},${B.get(k).category},,`)].join('\r\n') + '\r\n');
  console.log(`${dis.length} disagreements -> ${out}`);
}

const args = process.argv.slice(2);
if (args[0] === '--agree') agree(args[1], args[2]);
else if (args.length) args.forEach(pack);
else throw new Error('usage: node src/coding-pack.js results/<label> ... | --agree a.csv b.csv');

function page(label, items) {
  const esc = (s) => JSON.stringify(s).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coding ${label}</title>
<style>
  :root { --bg: #fff; --fg: #1a1a1a; --muted: #666; --line: #ddd; --bot: #fff4e0; --brw: #eaf3ff; --acc: #0b5cad; --done: #e7f6ea; }
  @media (prefers-color-scheme: dark) { :root { --bg: #161616; --fg: #e8e8e8; --muted: #999; --line: #333; --bot: #3a2d14; --brw: #16283d; --acc: #6aa8ff; --done: #17301d; } }
  * { box-sizing: border-box; }
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0; background: var(--bg); color: var(--fg); }
  header { position: sticky; top: 0; background: var(--bg); border-bottom: 1px solid var(--line); padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; z-index: 2; }
  header input { font: inherit; padding: 4px 8px; width: 9em; }
  button { font: inherit; padding: 5px 10px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); border-radius: 6px; cursor: pointer; }
  button.on { background: var(--acc); color: #fff; border-color: var(--acc); }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; }
  .cats { font-size: 13px; color: var(--muted); margin: 0 0 16px; padding-left: 1.2em; }
  .site { border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin: 0 0 16px; }
  .site.done { background: var(--done); }
  .head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; justify-content: space-between; }
  .bar { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
  .arm { border-top: 1px dashed var(--line); padding-top: 8px; margin-top: 8px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (max-width: 700px) { .cols { grid-template-columns: 1fr; } }
  .cols div { padding: 6px 8px; border-radius: 6px; font-size: 13px; overflow-wrap: anywhere; max-height: 260px; overflow: auto; }
  .bot { background: var(--bot); } .brw { background: var(--brw); }
  .cols p { margin: 0 0 4px; }
  small { color: var(--muted); }
  textarea { width: 100%; font: inherit; font-size: 13px; }
  select { font: inherit; }
</style>
</head>
<body>
<header>
  <strong>Coding ${label}</strong>
  <label>Coder <input id="coder" placeholder="your initials"></label>
  <span id="progress"></span>
  <label><input type="checkbox" id="open"> only open</label>
  <button id="export">Export CSV</button>
</header>
<main>
  <p><small>Code every site on what differs, independently: do not discuss cases with the other coder before both are finished. Answers are kept in this browser only; export the CSV when done (or to save a backup). Open the site to check if the lines are unclear. Bots are numbered per site in random order; who they are is hidden on purpose.</small></p>
  <ol class="cats" id="cats"></ol>
  <div id="list"></div>
</main>
<script>
const LABEL = ${esc(label)};
const CATS = ${esc(CATEGORIES)};
const ITEMS = ${esc(items)};
const KEY = 'coding-' + LABEL;
let state = {};
try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
const coderEl = document.getElementById('coder');
coderEl.value = state._coder || '';
coderEl.oninput = () => { state._coder = coderEl.value.trim(); save(); };
document.getElementById('cats').innerHTML = CATS.map(([n, t, d]) => '<li value="' + n + '"><b>' + t + '</b>: ' + d + '</li>').join('');
const h = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const armCat = (it, a) => state[it.id]?.arms?.[a.arm] || state[it.id]?.cat || '';
const isDone = (it) => it.arms.every((a) => armCat(it, a));
function render() {
  const only = document.getElementById('open').checked;
  const done = ITEMS.filter(isDone).length;
  document.getElementById('progress').textContent = done + ' / ' + ITEMS.length + ' sites coded';
  document.getElementById('list').innerHTML = ITEMS.filter((it) => !only || !isDone(it)).map((it) => {
    const s = state[it.id] || {};
    const arms = it.arms.map((a, i) => {
      const own = s.arms?.[a.arm] || '';
      return '<div class="arm"><small>Bot ' + (i + 1) + ' &middot; similarity ' + h(a.sim) + ' &middot; own category: </small>'
        + '<select data-id="' + h(it.id) + '" data-arm="' + h(a.arm) + '"><option value="">same as site</option>'
        + CATS.map(([n, t]) => '<option value="' + n + '"' + (own == n ? ' selected' : '') + '>' + n + ' ' + t + '</option>').join('') + '</select>'
        + '<div class="cols"><div class="bot"><small>only the bot saw</small>' + (a.botOnly.map((l) => '<p>' + h(l) + '</p>').join('') || '<p><i>nothing</i></p>') + '</div>'
        + '<div class="brw"><small>only the browser saw</small>' + (a.browserOnly.map((l) => '<p>' + h(l) + '</p>').join('') || '<p><i>nothing</i></p>') + '</div></div></div>';
    }).join('');
    return '<section class="site' + (isDone(it) ? ' done' : '') + '"><div class="head"><b>#' + it.n + ' <a href="https://' + h(it.domain) + '/" target="_blank" rel="noopener noreferrer">' + h(it.domain) + '</a></b><small>' + h(it.vantage) + ' &middot; ' + it.arms.length + ' bot(s)</small></div>'
      + '<div class="bar">' + CATS.map(([n, t]) => '<button data-id="' + h(it.id) + '" data-cat="' + n + '" class="' + (s.cat == n ? 'on' : '') + '">' + n + ' ' + t + '</button>').join('') + '</div>'
      + '<textarea data-id="' + h(it.id) + '" rows="1" placeholder="note (optional)">' + h(s.note || '') + '</textarea>' + arms + '</section>';
  }).join('');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-cat]');
  if (!b) return;
  const s = (state[b.dataset.id] ||= {});
  s.cat = s.cat === b.dataset.cat ? '' : b.dataset.cat;
  save(); render();
});
document.addEventListener('change', (e) => {
  if (e.target.matches('select[data-arm]')) { const s = (state[e.target.dataset.id] ||= {}); (s.arms ||= {})[e.target.dataset.arm] = e.target.value; save(); render(); }
  if (e.target.id === 'open') render();
});
document.addEventListener('input', (e) => { if (e.target.matches('textarea[data-id]')) { (state[e.target.dataset.id] ||= {}).note = e.target.value; save(); } });
document.getElementById('export').onclick = () => {
  const c = (v) => /[",\\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const lines = ['run,domain,arm,category,coder,note'];
  for (const it of ITEMS) for (const a of it.arms) {
    const [run, domain] = it.id.split('|');
    lines.push([run, domain, a.arm, armCat(it, a), state._coder || '', state[it.id]?.note || ''].map(c).join(','));
  }
  const url = URL.createObjectURL(new Blob(['\\ufeff' + lines.join('\\r\\n') + '\\r\\n'], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'coding-' + LABEL + '-' + (state._coder || 'coder') + '.csv' });
  link.click(); URL.revokeObjectURL(url);
};
render();
</script>
</body>
</html>
`;
}
