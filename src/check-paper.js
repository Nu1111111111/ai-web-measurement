/**
 * Guard against hand-typed results in paper/main.tex.
 *
 *   node src/check-paper.js
 *
 * 1. Every \R{key} (and \pct/\ci) used in the text exists in paper/numbers.tex.
 * 2. Lists every remaining digit outside comments and \R/\pct/\ci/\ref/\cite/\label/\url/\tbl,
 *    so a person can confirm each one is not a result (years, RFC 9309, HTTP status codes...).
 */
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const tex = readFileSync(new URL('paper/main.tex', ROOT), 'utf8');
const keys = new Set([...readFileSync(new URL('paper/numbers.tex', ROOT), 'utf8').matchAll(/\\csname R@(.+?)\\endcsname/g)].map((m) => m[1]));

let missing = 0;
for (const m of tex.split('\\begin{document}')[1].matchAll(/\\(R|pct|ci|rng)\{([^}]+)\}/g)) {
  const need = m[1] === 'pct' ? [`${m[2]}.p`] : m[1] === 'ci' ? [`${m[2]}.ci`] : m[1] === 'rng' ? [`${m[2]}.min`, `${m[2]}.max`] : [m[2]];
  for (const key of need) if (!keys.has(key)) { missing++; console.log(`unknown key: ${m[0]} (${key})`); }
}
const body = tex.split('\\begin{document}')[1]
  .split('\n').map((l) => l.replace(/(^|[^\\])%.*/, '$1')).join('\n')
  .replace(/\\(R|pct|ci|rng|ref|cite|citet|citep|label|url|tbl|bibliography|bibliographystyle)\{[^}]*\}/g, ' ');
const lines = body.split('\n');
const loose = [];
lines.forEach((l, i) => { for (const m of l.matchAll(/[^\s{}()\[\],.;:]*\d[^\s{}()\[\],.;:]*/g)) loose.push(`${m[0]}  …${l.trim().slice(0, 70)}`); });
console.log(`${keys.size} values in numbers.tex; ${missing} unknown keys in main.tex`);
console.log(`digits outside \\R{} (check each is not a result):\n  ${[...new Set(loose)].join('\n  ')}`);
if (missing) process.exit(1);
