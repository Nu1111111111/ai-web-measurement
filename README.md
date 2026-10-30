# ai-web-measurement

What the web shows to AI crawlers: declared (robots.txt) vs enforced (server) policy,
AI-specific content and HTTP 402 pay-per-crawl, on the Tranco top 10k. Method and
pre-registration: [PROTOCOL.md](PROTOCOL.md), frozen on 2026-10-28 at commit `486ec1f`
and registered on OSF the same day; the repository at that commit is archived as a zip in the
registration (this public repository starts from a fresh history) (registration https://osf.io/prwng,
doi:[10.17605/OSF.IO/PRWNG](https://doi.org/10.17605/OSF.IO/PRWNG), project https://osf.io/kzqxf).
Preprint: doi:[10.5281/zenodo.23808439](https://doi.org/10.5281/zenodo.23808439).
Node ≥ 22, no dependencies.

## Pipeline

```
node src/list.js GQ3LK 10000                         # frozen list -> config/
npm test                                             # robots parser, classifier, stats
node src/measure.js --vantage de-residential         # V1, local (resumable)
# V2: edit config/remote-run.json, commit, push -> GitHub Actions measures from Azure,
#     result comes back as branch data/<run>
node src/fetch-remote.js <run>                       # -> runs/<run>/
node src/analyze.js --label main runs/<V1> runs/<V2> # results/main/ + paper/tables/main-*.tex
```

Pilot (no info URL needed, ≤ 300 domains): add `--pilot --sample 200 --seed 1`.
Wave 2: `--domains flagged.txt` with the domains from wave 1.

## Outputs

| Path | What |
|---|---|
| `runs/<run>/manifest.json` | commit, config/list hashes, vantage (country, ASN; IP hashed), times |
| `runs/<run>/records.jsonl` | one line per domain: robots.txt meta, per-arm status, headers, features, class |
| `runs/<run>/diffs.jsonl` | lines only the bot (or only the browser) saw, per differing arm |
| `runs/<run>/raw/` | gzipped robots.txt + every non-"same" body |
| `results/<label>/results.json` | every number in the paper, with n, k and Wilson CIs |
| `results/<label>/review-queue.csv` | AI-specific content differences to code by hand (PROTOCOL §6) |
| `paper/` | LaTeX source; `paper.yml` builds PDF + arXiv bundle to branch `paper-build` |

`runs/` is not committed (third-party page bodies).

## Raw data

Released here: code, `results/<label>/results.json` and tables (vantage reduced to country
and network), and `results/<label>/release/per-site-hashed.csv` (domain as HMAC-SHA256 with a
private key, rank as band; PROTOCOL §8). Not released: raw page bodies, per-domain files and
the hash key. The raw runs are kept as `data/<run>` branches in a separate private repository;
set `DATA_REMOTE` to that remote for `fetch-remote.js`, `push-local.js` and `verify-backup.js`.
Editor and reviewers can get them on request. In a public copy the measurement workflow
does not run.

## Provenance

`src/lib/robots.js` and `src/lib/features.js` are the frozen parsers of the earlier
invisible-prompts parts 8 and 3 (robots parser cross-checked against Protego).
