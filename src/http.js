/**
 * One GET, as plain as a crawler's: no cookies, no JavaScript, no retries on an
 * HTTP status (a 403 to GPTBot is the measurement, not an obstacle). From
 * invisible-prompts part 8, plus the pay-per-crawl headers for RQ3.
 */

/** Response headers kept on every record. */
const KEEP = ['content-type', 'location', 'server', 'x-robots-tag', 'vary', 'cf-ray', 'cf-mitigated',
  'crawler-price', 'crawler-charged', 'www-authenticate', 'retry-after', 'x-cache', 'via', 'x-served-by', 'x-amz-cf-id', 'akamai-grn', 'x-vercel-id', 'x-datadome', 'x-iinfo'];

/** Never throws. Returns status, kept headers, decoded text and the raw bytes. */
export async function request(url, ua, { maxBytes = 4 * 1024 * 1024, timeout = 20000, manual = false, accept = 'text/html,application/xhtml+xml' } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: manual ? 'manual' : 'follow',
      headers: { 'user-agent': ua, accept, 'accept-language': 'en;q=0.9,*;q=0.5' },
    });
    const headers = {};
    for (const k of KEEP) {
      const v = res.headers.get(k);
      if (v) headers[k] = v.slice(0, 300);
    }
    const meta = { status: res.status, finalUrl: res.url || url, type: headers['content-type'], headers };
    const chunks = [];
    let size = 0;
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        chunks.push(value);
        if (size > maxBytes) {
          await reader.cancel();
          meta.truncated = true;
          break;
        }
      }
    }
    let bytes = Buffer.concat(chunks);
    if (bytes.length > maxBytes) bytes = bytes.subarray(0, maxBytes);
    const charset = (meta.type || '').match(/charset=["']?([\w-]+)/i)?.[1]
      || bytes.subarray(0, 2048).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
    let text;
    try {
      text = new TextDecoder(charset || 'utf-8').decode(bytes);
    } catch {
      text = new TextDecoder('utf-8').decode(bytes);
    }
    return { ...meta, ms: Date.now() - t0, bytes, text };
  } catch (err) {
    return { status: 0, finalUrl: url, error: String(err.cause?.code || err.name || err.message), ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Follow up to 5 redirects by hand (RFC 9309 §2.3.1.2). */
export async function followed(url, ua, opts) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop <= 5; hop++) {
    const r = await request(current, ua, { ...opts, manual: true });
    if (r.status >= 300 && r.status < 400 && r.headers?.location) {
      chain.push({ status: r.status, url: current });
      current = new URL(r.headers.location, current).href;
      continue;
    }
    return { ...r, finalUrl: current, chain };
  }
  return { status: 0, error: 'too-many-redirects', finalUrl: current, chain };
}

export const looksHtml = (r) => /html/i.test(r.type || '') || /^\s*(<!doctype html|<html|<head|<body|<\?xml|<!--)/i.test(r.text || '');
