/**
 * Canary pages for the real-agent validation (src/validate2.js). One page per real agent on the
 * study's information site, each with a random phrase that exists nowhere else: an agent that
 * reports the phrase fetched the page live.
 *
 *   node src/canary.js ../aiwebmeasure
 *
 * Writes <site>/c/<id>.html (noindex) and results/wave1-head/validation2/canary.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes, randomInt } from 'node:crypto';
import { resolve } from 'node:path';

const site = resolve(process.argv[2] || '../aiwebmeasure');
const BASE = 'https://nu1111111111.github.io/aiwebmeasure/c/';
const WORDS = ['amber', 'basalt', 'cedar', 'delta', 'ember', 'fjord', 'granite', 'harbor', 'indigo', 'juniper', 'kelp', 'lagoon',
  'marble', 'nectar', 'onyx', 'pewter', 'quartz', 'russet', 'saffron', 'tundra', 'umber', 'violet', 'willow', 'zephyr'];
const phrase = () => `${WORDS[randomInt(WORDS.length)]} ${WORDS[randomInt(WORDS.length)]} ${randomInt(1000, 9999)} ${WORDS[randomInt(WORDS.length)]}`;

mkdirSync(`${site}/c`, { recursive: true });
const out = {};
for (const agent of ['ChatGPT', 'Claude', 'Perplexity']) {
  const id = randomBytes(6).toString('hex');
  const p = phrase();
  writeFileSync(`${site}/c/${id}.html`, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow">
<title>AIWebMeasure test page</title></head>
<body><h1>${p}</h1>
<p>This page is part of the AIWebMeasure study. It checks whether an AI assistant can open a web page live.
See <a href="../">the study information page</a>.</p></body></html>
`);
  out[agent] = { url: `${BASE}${id}.html`, phrase: p };
}
mkdirSync(new URL('../results/wave1-head/validation2/', import.meta.url), { recursive: true });
writeFileSync(new URL('../results/wave1-head/validation2/canary.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(out);
