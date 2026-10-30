/**
 * Part 8 — robots.txt parser and matcher after RFC 9309.
 *
 * Differences from ../fetch.js robotsAllows (part 1): the user-agent value is
 * reduced to its product token and matched exactly (RFC 9309 §2.2.1; part 1
 * used a substring match, so a group "Claude" would have caught ClaudeBot),
 * groups only end at a user-agent line that follows a rule, and the result
 * says which route (named group or `*`) decided.
 */

export const MAX_ROBOTS_BYTES = 500 * 1024;

/** "GPTBot/1.1 (+https://…)" -> "gptbot"; "*" stays "*". */
export function productToken(value) {
  const v = value.trim();
  // Only a lone "*" is the wildcard (Google's parser): "*OrkashBot*" is not (BUILDLOG 35).
  if (/^\*(\s|$)/.test(v)) return '*';
  return (v.match(/^[A-Za-z_-]+/)?.[0] || '').toLowerCase();
}

/** Keys as Google's open-source parser accepts them, including its tolerated typos. */
function keyOf(raw) {
  const k = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (k === 'user-agent' || k === 'useragent' || k === 'user agent') return 'user-agent';
  if (['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'].includes(k)) return 'disallow';
  if (k === 'allow') return 'allow';
  if (k === 'sitemap' || k === 'site-map') return 'sitemap';
  return k;
}

/** Upper-case percent escapes and decode unreserved ones, so /%7efoo == /~foo. */
function normalisePath(p) {
  return p.replace(/%([0-9a-fA-F]{2})/g, (m, hex) => {
    const c = String.fromCharCode(parseInt(hex, 16));
    return /[A-Za-z0-9\-._~]/.test(c) ? c : `%${hex.toUpperCase()}`;
  });
}

/**
 * @returns {{ groups: { agents: string[], rules: { allow: boolean, path: string }[] }[],
 *   sitemaps: string[], contentSignals: string[], cloudflareManaged: boolean, lines: number }}
 */
export function parseRobots(text) {
  const body = text.replace(/^﻿/, '');
  const groups = [];
  const sitemaps = [];
  const contentSignals = [];
  let current = null;
  let sawRule = false;
  let lines = 0;
  for (const raw of body.split(/\r\n|\r|\n/)) {
    lines++;
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z][A-Za-z -]*?)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = keyOf(m[1]);
    const value = m[2].trim();
    if (key === 'user-agent') {
      // Consecutive user-agent lines share one group; one after a rule opens a new group.
      if (!current || sawRule) {
        groups.push((current = { agents: [], rules: [] }));
        sawRule = false;
      }
      const token = productToken(value);
      if (token) current.agents.push(token);
    } else {
      // Any other record (Crawl-delay, Sitemap, unknown) also ends the run of
      // user-agent lines, as in Google's parser and Protego. Found by the
      // Protego cross-check (BUILDLOG 2026-10-17): "User-agent: bingbot /
      // Crawl-delay: 5 / User-agent: EtaoSpider / Disallow: /" is two groups.
      sawRule = true;
      if (key === 'allow' || key === 'disallow') {
        if (current) current.rules.push({ allow: key === 'allow', path: value }); // rules before any user-agent belong to no group
      } else if (key === 'sitemap') {
        sitemaps.push(value);
      } else if (key === 'content-signal') {
        contentSignals.push(value.toLowerCase());
      }
    }
  }
  return {
    groups,
    sitemaps,
    contentSignals,
    cloudflareManaged: /BEGIN Cloudflare Managed content/i.test(body),
    lines,
  };
}

/**
 * Does `rulePath` match `path` from the start? `*` = any run, trailing `$` = end.
 * Linear set-of-positions matcher as in Google's robots.cc: a RegExp with many
 * `*` backtracks exponentially and hung the full run on one file (BUILDLOG 34).
 */
export function ruleMatches(rulePath, path) {
  const p = normalisePath(path);
  const pat = normalisePath(rulePath);
  let pos = new Uint8Array(p.length + 1);
  pos[0] = 1;
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === '$' && i === pat.length - 1) return pos[p.length] === 1;
    const next = new Uint8Array(p.length + 1);
    let any = false;
    if (c === '*') {
      let on = false;
      for (let j = 0; j <= p.length; j++) {
        if (pos[j]) on = true;
        if (on) { next[j] = 1; any = true; }
      }
    } else {
      for (let j = 0; j < p.length; j++) if (pos[j] && p[j] === c) { next[j + 1] = 1; any = true; }
    }
    if (!any) return false;
    pos = next;
  }
  return true; // prefix match: anything may follow
}

/** The rules that apply to `token`, and whether a group named it. */
export function applicable(parsed, token) {
  const t = token.toLowerCase();
  const named = parsed.groups.filter((g) => g.agents.includes(t));
  if (named.length) return { named: true, rules: named.flatMap((g) => g.rules) };
  const star = parsed.groups.filter((g) => g.agents.includes('*'));
  return { named: false, wildcard: star.length > 0, rules: star.flatMap((g) => g.rules) };
}

/** Longest match wins, Allow wins a tie, empty Disallow is no rule. */
export function allows(parsed, token, path = '/') {
  const { rules } = applicable(parsed, token);
  let best = null;
  for (const rule of rules) {
    if (rule.path === '') continue;
    if (!ruleMatches(rule.path, path)) continue;
    const len = rule.path.length;
    if (!best || len > best.path.length || (len === best.path.length && rule.allow && !best.allow)) best = rule;
  }
  return best ? best.allow : true;
}

/**
 * Class per (site, token), as fixed in CRAWLERS.md.
 * @returns {{ cls: 'full-block'|'partial'|'allowed', named: boolean, wildcard: boolean, deepBlocked: boolean }}
 */
export function classify(parsed, token) {
  const app = applicable(parsed, token);
  const root = allows(parsed, token, '/');
  // Recorded beside the headline: a "Disallow: /$" style rule blocks / but not the rest.
  const deepBlocked = !allows(parsed, token, '/kicrawlerstudy-probe/page.html');
  let cls;
  if (!root) cls = 'full-block';
  else if (app.rules.some((r) => !r.allow && r.path !== '')) cls = 'partial';
  else cls = 'allowed';
  return { cls, named: app.named, wildcard: !!app.wildcard, deepBlocked };
}
