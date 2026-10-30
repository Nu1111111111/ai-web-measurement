/**
 * The arms of the measurement: one GET of the same URL per User-Agent, everything
 * else equal (same machine, IP, headers, minute).
 *
 * Bot UA strings are the shapes the operators publish (config/crawler-registry.json
 * has the source pages). Sent from our machine they are impostors to any site that
 * verifies bots by IP, so what we measure is the response to the UA string — the
 * thing a UA-keyed rule reacts to. PROTOCOL.md §4 discusses what that does and does
 * not show.
 */
import { readFileSync } from 'node:fs';

const study = JSON.parse(readFileSync(new URL('../config/study.json', import.meta.url), 'utf8'));

export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

export const STUDY_TOKEN = study.token;
export const STUDY_UA = `${study.token}/${study.version} (+${study.infoUrl || 'no-info-url-yet'})`;

/**
 * `token`: robots.txt product token. `role`: reference (search engines), training,
 * search, user (fetches on a person's request), control, browser.
 */
export const ARMS = [
  { id: 'browser1', role: 'browser', ua: BROWSER_UA },
  { id: 'browser2', role: 'browser', ua: BROWSER_UA },
  { id: 'googlebot', token: 'Googlebot', operator: 'Google', role: 'reference',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/140.0.0.0 Safari/537.36' },
  { id: 'bingbot', token: 'Bingbot', operator: 'Microsoft', role: 'reference',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/140.0.0.0 Safari/537.36' },
  { id: 'gptbot', token: 'GPTBot', operator: 'OpenAI', role: 'training',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot' },
  { id: 'oai-searchbot', token: 'OAI-SearchBot', operator: 'OpenAI', role: 'search',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot' },
  { id: 'chatgpt-user', token: 'ChatGPT-User', operator: 'OpenAI', role: 'user',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' },
  // Anthropic publishes tokens only, no full UA strings (checked 2026-10-28). ClaudeBot is the
  // form seen in server logs; Claude-SearchBot and Claude-User follow the same shape.
  { id: 'claudebot', token: 'ClaudeBot', operator: 'Anthropic', role: 'training',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
  { id: 'claude-searchbot', token: 'Claude-SearchBot', operator: 'Anthropic', role: 'search',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)' },
  { id: 'claude-user', token: 'Claude-User', operator: 'Anthropic', role: 'user',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)' },
  { id: 'perplexitybot', token: 'PerplexityBot', operator: 'Perplexity', role: 'search',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' },
  { id: 'perplexity-user', token: 'Perplexity-User', operator: 'Perplexity', role: 'user',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)' },
  { id: 'meta-externalagent', token: 'Meta-ExternalAgent', operator: 'Meta', role: 'training',
    ua: 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)' },
  { id: 'ccbot', token: 'CCBot', operator: 'Common Crawl', role: 'training',
    ua: 'CCBot/2.0 (https://commoncrawl.org/faq/)' },
  // Controls (part 3): same UA shape as the AI crawlers, neutral and generic-bot names.
  //   blocked for GPTBot and both controls -> "not a browser" rule
  //   blocked for GPTBot and control-bot only -> "any bot" rule
  //   blocked for GPTBot, neither control -> AI-specific
  { id: 'control-plain', role: 'control',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PageReader/1.0; +https://example.org/pagereader)' },
  { id: 'control-bot', role: 'control',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ResearchBot/1.0; +https://example.org/researchbot)' },
];

export const AI_ARMS = ARMS.filter((a) => ['training', 'search', 'user'].includes(a.role));
export const armById = Object.fromEntries(ARMS.map((a) => [a.id, a]));

/**
 * Deterministic per-domain shuffle of every arm after browser1, so neither rate
 * limiting nor caching can systematically favour one arm, and a re-run (or the
 * other vantage point) requests in the same order.
 */
export function requestOrder(domain, arms = ARMS) {
  let h = 2166136261;
  for (const c of domain) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const rest = arms.filter((a) => a.id !== 'browser1');
  for (let i = rest.length - 1; i > 0; i--) {
    h = Math.imul(h ^ i, 16777619) >>> 0;
    const j = h % (i + 1);
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [armById.browser1, ...rest];
}
