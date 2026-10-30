import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, allows, classify, productToken } from '../src/lib/robots.js';

const p = (s) => parseRobots(s);

test('product token is the [A-Za-z_-] prefix, lower-cased', () => {
  assert.equal(productToken('GPTBot/1.1 (+https://openai.com)'), 'gptbot');
  assert.equal(productToken('Claude-SearchBot'), 'claude-searchbot');
  assert.equal(productToken('*'), '*');
});

test('exact token match: a group "Claude" does not catch ClaudeBot', () => {
  const r = p('User-agent: Claude\nDisallow: /\n');
  assert.equal(allows(r, 'ClaudeBot'), true);
  assert.equal(allows(r, 'Claude'), false);
});

test('named group beats *, even when the named group allows', () => {
  const r = p('User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\n');
  assert.equal(allows(r, 'GPTBot'), true);
  assert.equal(allows(r, 'ClaudeBot'), false);
  assert.deepEqual(classify(r, 'ClaudeBot').named, false);
  assert.deepEqual(classify(r, 'GPTBot').named, true);
});

test('consecutive user-agent lines share a group; groups for one token merge', () => {
  const r = p('User-agent: GPTBot\nUser-agent: CCBot\nDisallow: /a\n\nUser-agent: gptbot\nDisallow: /\n');
  assert.equal(allows(r, 'CCBot', '/a'), false);
  assert.equal(allows(r, 'CCBot', '/'), true);
  assert.equal(allows(r, 'GPTBot', '/'), false);
});

test('any other record between user-agent lines ends the group (as Google and Protego)', () => {
  const r = p('User-agent: bingbot\nCrawl-delay: 5\n\nUser-agent: EtaoSpider\nDisallow: /\n');
  assert.equal(allows(r, 'bingbot'), true);
  assert.equal(allows(r, 'EtaoSpider'), false);
  const r2 = p('User-agent: CCBot\nCrawl-delay: 0.7\n\nUser-agent: AhrefsBot\nDisallow: /\n');
  assert.equal(classify(r2, 'CCBot').named, true);
  assert.equal(classify(r2, 'CCBot').cls, 'allowed');
});

test('blank lines between user-agent lines do not split the group', () => {
  const r = p('User-agent: GPTBot\n\nUser-agent: ClaudeBot\nDisallow: /\n');
  assert.equal(allows(r, 'GPTBot'), false);
  assert.equal(allows(r, 'ClaudeBot'), false);
});

test('longest match wins, Allow wins a tie, wildcards and $', () => {
  const r = p('User-agent: *\nDisallow: /\nAllow: /$\nDisallow: /*.pdf$\nAllow: /pub\nDisallow: /pub\n');
  assert.equal(allows(r, 'x', '/'), true);
  assert.equal(allows(r, 'x', '/page'), false);
  assert.equal(allows(r, 'x', '/pub/doc'), true);
  assert.equal(allows(r, 'x', '/a/file.pdf'), false);
  const c = classify(r, 'x');
  assert.equal(c.cls, 'partial');
  assert.equal(c.deepBlocked, true);
});

test('empty Disallow allows everything; rules before any user-agent are ignored', () => {
  assert.equal(classify(p('Disallow: /\nUser-agent: *\nDisallow:\n'), 'GPTBot').cls, 'allowed');
});

test('percent-encoding is normalised', () => {
  assert.equal(allows(p('User-agent: *\nDisallow: /%7Euser\n'), 'x', '/~user/x'), false);
});

test('BOM, CR line endings, comments, case-insensitive keys', () => {
  const r = p('﻿USER-AGENT: gptbot # OpenAI\rDISALLOW: / # all\r');
  assert.equal(classify(r, 'GPTBot').cls, 'full-block');
});

test('no robots rules at all -> allowed, not named', () => {
  assert.deepEqual(classify(p(''), 'GPTBot'), { cls: 'allowed', named: false, wildcard: false, deepBlocked: false });
});

test('Content-Signal and Cloudflare managed block are recorded', () => {
  const r = p('# BEGIN Cloudflare Managed content\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n');
  assert.equal(r.cloudflareManaged, true);
  assert.deepEqual(r.contentSignals, ['search=yes,ai-train=no']);
});

test('wildcard matcher: same answers as the RFC examples, and no blow-up on many *', async () => {
  const { ruleMatches } = await import('../src/lib/robots.js');
  assert.equal(ruleMatches('/fish', '/fish.html'), true);
  assert.equal(ruleMatches('/fish', '/Fish.asp'), false);
  assert.equal(ruleMatches('/*.php', '/folder/filename.php?x'), true);
  assert.equal(ruleMatches('/*.php$', '/filename.php?x'), false);
  assert.equal(ruleMatches('/*.php$', '/folder/filename.php'), true);
  assert.equal(ruleMatches('/fish*.php', '/fishheads/catfish.php?p'), true);
  assert.equal(ruleMatches('/', '/'), true);
  assert.equal(ruleMatches('/$', '/'), true);
  assert.equal(ruleMatches('/$', '/a'), false);
  const t0 = Date.now();
  assert.equal(ruleMatches('/' + '*a'.repeat(40) + '*b$', '/' + 'a'.repeat(200)), false);
  assert.ok(Date.now() - t0 < 200);
});
test('only a lone * is the wildcard; Google key typos are accepted', () => {
  const r = p('User-agent: *OrkashBot*\nDisallow: /\n\nUser-agent: *\nDisallow: /private\n');
  assert.equal(allows(r, 'Applebot'), true);
  assert.equal(classify(r, 'Applebot').cls, 'partial');
  const r2 = p('User-agent: GPTBot\nDisallow: /\n\nUserAgent: Bytespider\nDisalow: /\n');
  assert.equal(allows(r2, 'Bytespider'), false);
  assert.equal(allows(p('User agent: CCBot\nDisallow: /\n'), 'CCBot'), false);
});