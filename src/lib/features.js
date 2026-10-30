/**
 * What a response looks like to a text crawler, reduced to comparable parts.
 *
 * Two fetches of the same homepage are never byte-identical (nonces, ad slots,
 * timestamps), so responses are compared on their readable text, as word
 * shingles, and on the few head fields a crawler actually uses.
 */
import { decode } from './decode.js';

/** Block pages from the common bot-management vendors. */
const CHALLENGE = [
  ['cloudflare', /<title>\s*(?:Just a moment\.\.\.|Attention Required! \| Cloudflare)|cf_chl_opt|cf-browser-verification/i],
  ['akamai', /<title>\s*Access Denied\s*<\/title>[\s\S]{0,2000}Reference\s*#/i],
  ['datadome', /captcha-delivery\.com|geo\.captcha-delivery/i],
  ['perimeterx', /px-captcha|_pxAppId[\s\S]{0,400}captcha/i],
  ['imperva', /_Incapsula_Resource|Incapsula incident ID/i],
  ['aws-waf', /awswaf\.com|aws-waf-token|awsWafCookieDomainList|window\.gokuProps|AwsWafIntegration/i],
  ['vercel', /Vercel Security Checkpoint/i],
  ['generic', /verify (?:that )?you are (?:a )?human|are you a robot|unusual traffic from your (?:computer|network)/i],
];

const BLOCK_TAGS = /<\/?(?:p|div|li|ul|ol|h[1-6]|br|tr|td|th|section|article|header|footer|nav|aside|main|blockquote|figcaption|dt|dd|option|button|label|title)\b[^>]*>/gi;

/** Readable text as lines, roughly as an HTML-to-text converter would produce. */
export function textLines(html) {
  const body = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(BLOCK_TAGS, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decode(body)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Line identity for set comparisons: case, digits and punctuation don't count. */
export const normLine = (l) => l.toLowerCase().replace(/\d+/g, '0').replace(/[^\p{L}\p{N} ]+/gu, '').replace(/\s+/g, ' ').trim();

export function shingles(lines, k = 3) {
  const words = lines.join(' ').toLowerCase().replace(/\d+/g, '0').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + k <= words.length; i++) set.add(words.slice(i, i + k).join(' '));
  if (!set.size && words.length) set.add(words.join(' '));
  return set;
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const attr = (html, re) => decode(html.match(re)?.[1] ?? '').replace(/\s+/g, ' ').trim();

/** Everything later stages need from one response, without keeping the HTML in memory. */
export function features(html) {
  const lines = textLines(html);
  const head = html.slice(0, 200_000);
  const challenge = CHALLENGE.find(([, re]) => re.test(head))?.[0] ?? null;
  const words = lines.join(' ').split(/\s+/).filter(Boolean).length;
  return {
    words,
    title: attr(head, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    description:
      attr(head, /<meta\s[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i) ||
      attr(head, /<meta\s[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["']/i),
    robotsMeta: attr(head, /<meta\s[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["']/i).toLowerCase(),
    canonical: attr(head, /<link\s[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["']/i),
    jsonld: (html.match(/type\s*=\s*["']?application\/ld\+json/gi) || []).length,
    llmsTxtLink: /href\s*=\s*["'][^"']*\/llms(?:-full)?\.txt["']/i.test(html),
    // A challenge marker on a full page is a script include, not a block page.
    challenge: challenge && words < 400 ? challenge : null,
  };
}
