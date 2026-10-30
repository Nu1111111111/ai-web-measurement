/**
 * Real-agent validation, second design (PROTOCOL.md §9, 2026-10-29; exploratory). Fixes three
 * weaknesses of §7b found in pre-review:
 *   1. same agent: sites are drawn by what the spoofed user-triggered agent of the SAME operator
 *      met in wave 1 (ChatGPT-User for ChatGPT, ...), not by the training crawler's block;
 *      stratum "blocked" = AI-specific block of the spoofed X-User, stratum "served" = spoofed
 *      X-User got the page (estimates how often the method reports a failure by itself)
 *   2. memory: every "got content" answer is repeated in a fresh chat with browsing forbidden;
 *      if the model names the same heading from memory, the check is coded "unclear"
 *   3. live fetch: one canary page per operator with a random phrase that exists nowhere else
 *      shows that the agent fetches pages live at all
 * Sites already used in §7b are excluded.
 *
 *   node src/validate2.js sample  [--blocked 40 --served 15 --seed 2]
 *   node src/validate2.js summary
 *
 * Local files (name sites, git-ignored): results/wave1-head/validation2/{sample.csv,prompts.txt,
 * answers.jsonl}. answers.jsonl: {"id":1,"answer":"...","code":"got-content|refused/failed|unclear|not-run",
 * "memory":"knows|does-not-know|"} -- memory only for got-content. Summary without names:
 * results/wave1-head/validation2-summary.json.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { decode } from './lib/decode.js';
import { wilson } from './stats.js';

const { values: opt, positionals: [cmd] } = parseArgs({ options: {
  blocked: { type: 'string', default: '40' }, served: { type: 'string', default: '15' }, seed: { type: 'string', default: '2' },
} , allowPositionals: true });
const ROOT = new URL('../', import.meta.url);
const RUN = 'wave1-head-de-residential';
const DIR = new URL('results/wave1-head/validation2/', ROOT);
const AGENTS = { ChatGPT: 'chatgpt-user', Claude: 'claude-user', Perplexity: 'perplexity-user' };
const SERVED_OK = ['same', 'meta-differs'];
const PROMPT = (url) => `Open ${url} and tell me the main heading on the page and, in one sentence of your own, what the page is about. If you cannot open the page, say so.`;
// The author's Claude account can also drive a local browser; as in §7b, only web fetch counts.
const FETCH_ONLY = (agent) => (agent === 'Claude' ? ' Use only your web fetch tool, not the browser.' : '');
const MEMORY = (url) => `Do not open, fetch or search anything. From memory only: what is the main heading on the homepage ${url}? If you do not know, say so.`;
const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

let s = Number(opt.seed) >>> 0;
const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const draw = (pool, k) => { const a = [...pool].sort((x, y) => x.rank - y.rank); const K = Math.min(k, a.length); for (let i = 0; i < K; i++) { const j = i + Math.floor(rand() * (a.length - i)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, K).sort((x, y) => x.rank - y.rank); };

function sample() {
  const recs = [...readFileSync(new URL(`runs/${RUN}/records.jsonl`, ROOT), 'utf8').split('\n').filter(Boolean)
    .map((l) => JSON.parse(l)).reduce((m, r) => m.set(r.domain, r), new Map()).values()];
  const used = new Set();
  const old = new URL('results/wave1-head/validation/sample.csv', ROOT);
  if (existsSync(old)) for (const l of readFileSync(old, 'utf8').split(/\r?\n/).slice(1)) { const d = l.split(',')[2]; if (d) used.add(d); }
  const comparable = recs.filter((r) => r.arms && !r.armsSkipped && !r.crash && r.arms.browser2?.class === 'same' && !used.has(r.domain));
  const ctl = (r) => ['control-plain', 'control-bot'].every((c) => SERVED_OK.includes(r.arms[c]?.class));
  const clean = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const reference = (domain) => {
    const f = new URL(`runs/${RUN}/raw/${encodeURIComponent(domain)}/browser1.html.gz`, ROOT);
    if (!existsSync(f)) return { title: '', h1: '' };
    const html = new TextDecoder('utf-8').decode(gunzipSync(readFileSync(f))).replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
    return { title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').slice(0, 200), h1: clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').slice(0, 200) };
  };
  const out = [];
  const canary = JSON.parse(readFileSync(new URL('canary.json', DIR), 'utf8'));
  for (const [agent, arm] of Object.entries(AGENTS)) {
    out.push({ id: out.length + 1, stratum: 'canary', agent, rank: 0, domain: 'canary', url: canary[agent].url, refTitle: '', refH1: canary[agent].phrase, prompt: PROMPT(canary[agent].url) + FETCH_ONLY(agent), memoryPrompt: '' });
    const blocked = comparable.filter((r) => r.arms[arm]?.class === 'blocked' && r.arms[arm].strict === true && ctl(r));
    const served = comparable.filter((r) => SERVED_OK.includes(r.arms[arm]?.class));
    for (const [stratum, pool, k] of [['blocked', blocked, +opt.blocked], ['served', served, +opt.served]]) {
      for (const r of draw(pool, k)) {
        const url = r.arms.browser1?.finalUrl || `https://${r.domain}/`;
        const ref = reference(r.domain);
        out.push({ id: out.length + 1, stratum, agent, rank: r.rank, domain: r.domain, url, refTitle: ref.title, refH1: ref.h1, prompt: PROMPT(url) + FETCH_ONLY(agent), memoryPrompt: MEMORY(url) });
      }
    }
  }
  const cols = Object.keys(out[0]);
  writeFileSync(new URL('sample.csv', DIR), '﻿' + [cols.join(','), ...out.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n') + '\r\n');
  writeFileSync(new URL('prompts.txt', DIR), out.map((r) => `#${r.id} ${r.agent} [${r.stratum}]\r\n${r.prompt}\r\n${r.memoryPrompt ? `memory: ${r.memoryPrompt}\r\n` : ''}`).join('\r\n'));
  const per = out.reduce((m, r) => ((m[`${r.agent}/${r.stratum}`] = (m[`${r.agent}/${r.stratum}`] || 0) + 1), m), {});
  console.log(`${out.length} checks`, per);
}

function summary() {
  const [h, ...ls] = readFileSync(new URL('sample.csv', DIR), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const cols = h.split(',');
  const parse = (line) => { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  const rows = new Map(ls.map((l) => parse(l)).map((x) => [+x[0], Object.fromEntries(cols.map((c, i) => [c, x[i]]))]));
  const ans = new Map();
  for (const l of readFileSync(new URL('answers.jsonl', DIR), 'utf8').split(/\r?\n/)) { const t = l.replace(/^﻿/, '').trim(); if (t) { const x = JSON.parse(t); ans.set(x.id, x); } }
  // robots.txt of the site for the agent's user-triggered token (wave 1, local per-domain.csv)
  const declared = new Map();
  const pd = new URL('results/wave1-head/per-domain.csv', ROOT);
  if (existsSync(pd)) {
    const [dh, ...dl] = readFileSync(pd, 'utf8').split(/\r?\n/).filter(Boolean);
    const dc = Object.fromEntries(parse(dh).map((c, i) => [c, i]));
    for (const l of dl) { const x = parse(l); if (x[dc.run] === RUN) declared.set(`${x[dc.domain]}|${x[dc.arm]}`, x[dc.declared]); }
  }
  const out = { generated: new Date().toISOString(), exploratory: true, agents: {} };
  for (const [id, a] of ans) {
    const r = rows.get(id);
    // a "got content" the model could also give from memory does not prove access
    const code = a.code === 'got-content' && a.memory === 'knows' ? 'unclear-memory' : a.code;
    const x = ((out.agents[r.agent] ??= {})[r.stratum] ??= { checks: 0, 'got-content': 0, 'refused/failed': 0, unclear: 0, 'unclear-memory': 0, 'not-run': 0, toolBlocked: 0, toolBlockedRobots: 0, stale: 0 });
    x.checks++;
    x[code]++;
    // refusals by the agent's own fetch tool ("site blocked", robots rules) vs. by the site;
    // stale = the tool returned an old cached copy, not the live page (coded unclear)
    if (code === 'refused/failed' && /^TOOL-BLOCKED/.test(a.answer)) {
      x.toolBlocked++;
      if (declared.get(`${r.domain}|${AGENTS[r.agent]}`) === 'full-block') x.toolBlockedRobots++;
    }
    if (/^STALE|stale/.test(a.answer) && code === 'unclear') x.stale++;
  }
  for (const ag of Object.values(out.agents)) for (const x of Object.values(ag)) {
    const n = x['got-content'] + x['refused/failed'];
    x.refused = { k: x['refused/failed'], n, ...wilson(x['refused/failed'], n) };
  }
  writeFileSync(new URL('results/wave1-head/validation2-summary.json', ROOT), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.agents, null, 1));
}

mkdirSync(DIR, { recursive: true });
if (cmd === 'sample') sample(); else if (cmd === 'summary') summary(); else throw new Error('usage: node src/validate2.js sample|summary');
