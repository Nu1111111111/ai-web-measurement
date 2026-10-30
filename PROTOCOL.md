# Measurement protocol (pre-registration)

**Study:** What the web shows to AI: declared vs enforced crawler policy, AI-specific
content and pay-per-crawl on the Tranco top 10k.
**Status:** FROZEN 2026-10-28 — frozen by the git commit that sets this status, before the
first full run, and registered the same day on OSF (osf.io, free) as an independent
timestamp; the OSF link and commit hash go into the paper. Every change after freezing
goes into the deviation log at the end, with date and reason. Pilot runs (`--pilot`,
≤ 300 domains) may happen before freezing; their data is never pooled with the main runs.

## 1. Research questions

- **RQ1 Declared vs enforced.** For each AI agent, how often does a site's robots.txt fully
  block it (declared), how often does the server refuse it (enforced), and how often do the
  two disagree — blocked at the server although robots.txt allows, or the reverse?
- **RQ1b Roles.** Do sites treat an operator's training, search and user-triggered agents
  differently (e.g. block GPTBot, serve OAI-SearchBot and ChatGPT-User)?
- **RQ2 AI-specific content.** How often does a site serve an AI agent substantively
  different content from what a browser gets, when neutral crawler-style controls get the
  browser page?
- **RQ3 Pay-per-crawl.** How often does an AI agent get HTTP 402, and through which
  infrastructure?
- **RQ4 Vantage and time.** How much do RQ1–RQ3 depend on where the requests come from
  (residential vs datacenter) and when (re-measurement after ≥ 7 days)?

RQ1–RQ3 are descriptive. Expectations stated in advance, so they can be wrong:
(E1) server-side AI-specific blocking is more common than a robots.txt full block for at
least GPTBot and ClaudeBot (pilot of 2026-10-17 and invisible-prompts part 8);
(E2) training agents are blocked more often than user-triggered agents of the same operator;
(E3) AI-specific content (category 6, §6) is rare, < 1 % of comparable sites.

## 2. Population

Tranco list **GQ3LK** (created 2026-10-27), two strata, files drawn by `src/list.js`
(SHA-256 in every run manifest), the same for every vantage point and wave:

- **Head**: ranks 1–10,000, `config/tranco-GQ3LK-top10000.csv`. Headline numbers.
- **Tail**: 5,000 domains drawn uniformly at random (seed 1) from ranks 10,001–1,000,000,
  `config/tranco-GQ3LK-tail5000-seed1.csv`. Tests whether head findings carry over to
  smaller sites. Reported separately, never pooled with the head.

Domains in `config/optout.txt` are skipped and counted.

## 3. Agents (arms)

`src/agents.js`: two identical browser requests (browser1 = reference, browser2 = noise
control), two search-engine references (Googlebot, Bingbot), ten AI agents (GPTBot,
OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot,
Perplexity-User, Meta-ExternalAgent, CCBot) and two controls with the same UA shape but
neutral names (PageReader, ResearchBot). UA strings re-checked on the operators' pages on
2026-10-28 (`config/crawler-registry.json` lists the pages): OpenAI (GPTBot 1.4,
OAI-SearchBot 1.4 with its Chrome prefix, ChatGPT-User 1.0), Perplexity, Meta, Common
Crawl, Google and Bing match their published strings; Google's and Bing's `Chrome/W.X.Y.Z`
placeholder is filled with 140.0.0.0. Anthropic publishes tokens only; ClaudeBot uses the
form seen in server logs and Claude-SearchBot/Claude-User the same shape. A site matching
on the exact Anthropic string could therefore differ; token-based rules (the common case)
are unaffected.

## 4. Procedure per domain

1. robots.txt at `https://<domain>/` with the study UA (`AIWebMeasure/1.0 (+info URL)`),
   redirects followed by hand (max 5), one retry with a browser UA on 401/403/406;
   `www.` fallback on network error. Re-fetched at the origin the homepage lands on.
2. Homepage with browser1 (`www.` fallback on network error).
3. Gate: if robots.txt is unreachable (5xx/network, RFC 9309 §2.3.1.4) or disallows the
   study token for the homepage path, stop. No other request is made to that site.
4. Every other arm requests browser1's final URL once, in a fixed per-domain random order
   (`requestOrder`), 400 ms apart. No cookies, no JavaScript. One retry on a network error
   only; HTTP statuses are never retried.
5. Bodies kept (gzip) for every arm not classed `same`, and both browser bodies whenever
   any arm differs. robots.txt always kept.

What this measures: the response to a **User-Agent string from our IP**. A site that
verifies crawlers by IP or reverse DNS sees an impostor; we therefore report server
blocks as "blocked for requests carrying this UA", never as "blocked for the real
crawler". Googlebot and Bingbot blocks estimate how common IP verification is (a site that
verifies Googlebot will block our Googlebot request).

All arms share one HTTP client (Node.js/undici) and so one TLS/HTTP fingerprint. That
makes the UA the only difference between arms, but a site that refuses the client itself
refuses the browser arms too; such sites fall out as not comparable and are counted in
the funnel. Findings hold for sites that serve a plain non-JavaScript client.

## 5. Classification (fixed before the main run)

Per arm, against the two browser fetches (`src/compare.js`, thresholds in
`config/study.json`): `error`, `rate-limited` (429), `payment-required` (402), `blocked`
(4xx/5xx except 402/429, a bot-management challenge page, or an empty 202), `other`
(non-HTML), `content-differs` (text Jaccard on word 3-shingles < 0.80 **and** ≥ 0.10 below
the browser1–browser2 similarity), `meta-differs` (title, description, robots meta,
canonical, X-Robots-Tag or final URL differ where both browsers agree), `same`.

Derived, per (domain, AI agent), denominator = **comparable** domains (both browser
fetches got a readable page):

- **declared block**: robots.txt full block for the agent's token (RFC 9309 matching,
  `src/lib/robots.js`, cross-checked against Protego in part 8).
- **served block**: `blocked` and *strict* (a request made later to the same site still
  got the page, so our IP was not throttled at that moment).
- **AI-specific block**: served block while both controls got the browser page.
- **AI-specific content**: `content-differs` while both controls got the browser page →
  manual coding (§6).
- Edge provider of a block from response headers (Cloudflare, Akamai, AWS, DataDome,
  Imperva, Vercel, Fastly, other).

All shares with Wilson 95 % intervals. Domains, not requests, are the unit.

**Sensitivity.** The pre-registered thresholds (similarity 0.80, margin 0.10) come from
invisible-prompts part 3. AI-specific content counts are also reported for similarity
0.70 / 0.90 and margin 0.05 / 0.20 (`config/study.json` → `sensitivity`). A finding is
called robust if its direction holds under all five settings.

## 6. Manual coding of content differences

Every AI-specific `content-differs` case (results/<label>/review-queue.csv) is coded into
the part-3 categories, defined before reading: 1 noise, 2 soft block, 3 prerender,
4 consent/geo/paywall, 5 SEO meta only, 6 AI-specific content. Only category 6 is reported
as AI-specific content. Two coders code independently (coder 1: the author; coder 2: a
second person; a model may pre-sort but never decides a category-6 case); Cohen's κ is
reported, disagreements are resolved by discussion and logged.

## 7. Vantage points and waves

- **V1 residential**: Germany, consumer ISP (Deutsche Telekom AS3320).
- **V2 datacenter**: GitHub-hosted runner (Microsoft Azure), `.github/workflows/measure.yml`.
- **Wave 1**: V1 and V2 within 48 hours of each other, head and tail stratum each. Headline numbers come from V1;
  V2 is reported beside it, with per-agent agreement (κ).
- **Wave 2**: every domain with any served block, 402 or content difference in wave 1 is
  measured again from both vantage points ≥ 7 days later (`--domains`). Only effects seen
  in both waves are called stable.
- Earlier measurements (invisible-prompts parts 3 and 8, different lists and code) are
  compared on overlapping domains only, labelled exploratory.

## 7b. Validation against real agents

The UA-spoofing limit (§4) is tested directly on a sample. From head-stratum wave-1
sites with an AI-specific served block for GPTBot, ClaudeBot or PerplexityBot, 50 are
drawn at random (seed 1; all if fewer). For each, the homepage is requested through the
real user-triggered agent of each blocked operator (ChatGPT, Claude, Perplexity: "Open
<URL> and quote the first heading and first sentence"), in a fresh chat, on one day. Coded
per site × agent: *got content* (quote matches the browser page), *refused/failed*, or
*unclear*. Reported as the share of spoofed-UA blocks that the real agent also hits. The
real agents run from the operators' IPs, so this tests IP verification, but uses the
user-triggered agents, not the training crawlers; the paper says so.

## 8. Ethics and release

One request per agent per homepage, 400 ms apart, robots.txt for our own token obeyed,
contact and opt-out at the info URL in our UA (`docs/index.html`). Opt-outs are honoured
in all later waves (info page: https://nu1111111111.github.io/aiwebmeasure/, contact by
email). No site is named in the paper.

Release (decided 2026-10-28): code, aggregate results (`results.json`, tables) and one
row per site × agent (`release/per-site-hashed.csv`) in which the domain is replaced by
HMAC-SHA256 with a private key (first 16 hex digits) and the rank by a band (1–1k,
1k–10k, 10k–1M). The key and the raw page bodies are not released. The hash stops casual
naming, not a determined re-identification (robots.txt files are public and a site's
pattern across agents can be distinctive); the paper says so.

## 9. Deviation log

| Date | Change | Reason |
|---|---|---|
| 2026-10-29 | Wave 1, V1: `measure.js` restarted automatically after native crashes of Node 24 on Windows (exit 0xC0000409, no message; 8 restarts over head and tail, `scripts/run-local-wave.ps1`). Each start is a session in the run manifest; domains in flight at a crash were measured again from scratch, so those sites got some requests twice. Procedure and classification unchanged. | Crash not reproducible for any single domain; the run is resumable by design. |
| 2026-10-29 | Bug fix in `src/analyze.js` (analysis only): `loaded.map(rows)` passed the array index as the threshold argument, so every run after the first was analysed in sensitivity mode (no robots.txt parsing, no content differences). Found on the first analysis of wave 1, before any result was reported; fixed to `rows(run)`, regression test added. Data, thresholds and classification rules unchanged. | Programming error; pilot cross-vantage numbers from 2026-10-28 were affected and are superseded. |
| 2026-10-29 | §7b prompt changed from "quote the first heading and first sentence exactly" to "tell me the main heading and, in one sentence of your own, what the page is about. If you cannot open the page, say so." The first 6 checks were run with the old prompt and repeated with the new one; only the new runs count. Run through the author's logged-in consumer accounts (ChatGPT Free, Claude Pro, Perplexity), whose personal settings apply. The author's Claude account has a computer-use connection to his PC: when its web fetch failed, Claude offered to open the page in a local browser; every such request was declined, and from check 59 on the Claude prompt ends with "Use only your web fetch tool, not the browser." (check 56 needed that as a follow-up). The 9 checks on adult sites (6 of the 50 sites) were not run, by the author's decision, because they would go through his personal accounts; they are reported as not run. | Claude declined verbatim quotes of web text on copyright grounds, so the old prompt measured model policy, not access. |
| 2026-10-29 | §6 manual coding not done. RQ2 is reported as an upper bound only: the share of sites where an AI agent got different content while both controls got the browser page, next to the same share for Googlebot/Bingbot (baseline of differences bots get in general) and the share where an AI agent's page differed but neither search engine's did. No count of category-6 "AI-specific content" is claimed, so E3 is not tested. The coding tool (`src/coding-pack.js`) stays in the repository for a later study. | No second coder was available; an uncoded single-coder count would not meet §6. |
| 2026-10-29 | §7 wave 2 run on 2026-10-29, about one day after wave 1 instead of ≥ 7 days later. Domain lists from `src/flagged.js` (every comparable domain with a served block, 402 or content difference for any agent at either vantage point in wave 1: `config/wave2-head.txt` 1,876 domains, `config/wave2-tail.txt` 880), both vantage points, otherwise unchanged. RQ4 "time" therefore covers only day-to-day repeatability, not change over a week or more; agreement between the waves is reported as repeatability, and "stable" in §7 means stable across one day. V1 again restarted after native Node crashes (2 restarts each for head and tail, see the first entry). | Author's decision to finish the measurement now. |
| 2026-10-29 | No further wave. The ≥ 7-day re-measurement of §7 is not run; RQ4 stays one-day repeatability (entry above). | Author's decision after pre-review. |
| 2026-10-29 | Exploratory analyses added after an internal pre-review, on the existing wave-1 data, no new requests to the measured sites (`src/extra.js`, results in `results/wave1-{head,tail}/extra.json`): (a) per site, whether an AI-specific block coincides with a refusal of spoofed Googlebot or Bingbot, and the share of sites with an AI-specific block while both spoofed search engines were served; exact McNemar test per AI agent against spoofed Googlebot over the comparable sites, Holm-adjusted over the 10 AI agents of a run; (b) the RQ1 cross-table with the AI-specific instead of any server block; (c) breakdown of the robots.txt gate (DNS, connect, TLS, 5xx) and of the sites disallowing the study token, from their stored robots.txt; (d) declared full blocks for six AI tokens we did not request with (Google-Extended, Applebot-Extended, Bytespider, Amazonbot, anthropic-ai, cohere-ai); (e) attribution of AI-specific block pages by bot-management signature (challenge marker, `cf-mitigated`, CDN block-page title) instead of CDN headers alone; (f) block rate by position in the random order; (g) 402 sites: what spoofed search engines and controls got; (h) the §7b checks split by what the spoofed user-triggered agent of the same operator met. None of these was pre-registered; the paper labels them exploratory. | Pre-review: the pre-registered analyses could not separate identity verification from AI-specific rules, and §7b compared different agents (crawler spoofed, user agent real). |
| 2026-10-29 | Exploratory real-browser check (`tools/browser-check`): 300 comparable and 300 not comparable head sites (seed 1), each homepage opened once in Microsoft Edge (Playwright, headless) from the residential line, 2 s apart. Tests whether the browser-UA baseline, which shares the HTTP client of all other arms, sees what a real browser sees. | Pre-review: the "browser" arm has a non-browser TLS fingerprint. |
| 2026-10-29 | Exploratory second real-agent check (`src/validate2.js`, `src/canary.js`): sites drawn by what the spoofed user-triggered agent of the same operator met (40 with an AI-specific block, 15 served, per operator, seed 2, §7b sites excluded); every "got content" answer repeated in a fresh chat with browsing forbidden and coded unclear if the model names the heading from memory; one canary page per operator on the study information site with a random phrase, to show that the agent fetches live. Same prompt and accounts as §7b. | Pre-review: §7b compared crawler and user agent of an operator, and top-site headings can be answered from memory. |
| 2026-10-29 | Wording, not procedure: the contact and opt-out URL is in the study user agent, which fetched robots.txt; the agent requests used the operators' published user-agent strings and carried no link. The paper said "linked from every request"; corrected. | Accuracy. |
| 2026-10-29 | Second real-agent round run the same day through the author's consumer accounts (ChatGPT Free, Claude Pro, Perplexity Free), typed by a browser assistant under the author's supervision. Claude prompts end with "Use only your web fetch tool, not the browser." as in §7b. Adult sites (6 ChatGPT, 6 Claude rows) not run. Perplexity failed its canary twice ("URL failed to load content") while ChatGPT and Claude read theirs; its remaining 55 checks were not run, since its answers could not show live access. Coding additions: a refusal by the agent's own fetch tool ("site blocked", "robots rules disallow") is marked TOOL-BLOCKED and still counts as refused/failed, reported separately; an answer based on an outdated cached copy (dated headlines years old) is coded unclear; a content answer whose heading the model also names in the memory chat counts as unclear. ChatGPT rate-limited the account once; the 5 remaining memory chats were run about 40 minutes later. | Execution of the design above. |
