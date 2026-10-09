# Tamilnadu API

<p align="left"><img src="public/assets/leaders.webp" alt="Updated political leaders collage supplied by Shyam" width="800"></p>

**Created and built by Shyam.** · [Live website](https://tamilnadu-api.vercel.app/) · [Complete beginner guide](https://tamilnadu-api.vercel.app/guide) · [Guide on GitHub](API_GUIDE.md)

A Vercel-ready, read-only API for Tamil Nadu Assembly election archives from **1967 to 2026**. Includes a browser explorer, source references, coverage report, JSON endpoints, and CSV exports.

**Release status: provisional.** Collected archives contain **36,039 result rows**, including **35,337 candidate rows** and **702 NOTA rows**, across 14 elections. Every election contains all 234 constituency IDs and one source-derived winner per constituency. **This does not certify that every candidate row is accurate or complete.** Official ECI report downloads returned HTTP 406/502 during collection, preventing a full official row audit.

## Use the live API

Open [Tamilnadu API](https://tamilnadu-api.vercel.app/). Choose a year, search for a constituency by its English name or number, and select it. Results load automatically. Use the seat JSON/CSV links or download the entire election CSV.

Base URL: `https://tamilnadu-api.vercel.app/api/v1`. No signup or API key is needed.

- List years: `/elections`
- All 234 constituency summaries: `/elections/2026/constituencies?limit=500`
- All candidate and NOTA rows for seat 1: `/elections/2026/constituencies/1/results`
- All winners: `/elections/2026/winners?limit=500`
- Full year download: `/elections/2026/export.csv`

Replace `2026` with a supported election year and `1` with the constituency ID from that year's list. `data` holds results, `meta` describes verification, and list responses include `pagination`. Lists default to 50 rows, with a maximum of 500 per page. To retrieve all results, request every page through `pagination.pages` or use CSV. Individual voters' choices are secret; this API contains candidate vote totals.

## Run locally

Use Node.js 24. There are no runtime npm dependencies, database credentials, or API keys.

```bash
npm run build
npm test
npm run dev
```

Open `http://localhost:3000`. The local base is `http://localhost:3000/api/v1`.

## Deploy on Vercel

Suggested project name: **tamilnadu-api**. A `vercel.app` alias depends on availability; do not assume this name reserves a particular domain.

1. Put the project contents in a GitHub repository (keep `package.json` and `vercel.json` at the root).
2. Import that repository into Vercel.
3. Framework preset: **Other**. Build command: **npm run build**. Output directory: **public**. Node version: **24.x**. Root directory: repository root.
4. No environment variables are required. Deploy.
5. Check `/api/v1/health`, `/api/v1/coverage`, and `/api/v1/elections/2026/constituencies/1/results`.

CLI alternative:

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

The API base is always **`https://YOUR-ASSIGNED-DOMAIN/api/v1`**. The explorer detects the current origin, and OpenAPI uses a relative server URL. No domain edits are needed.

## Endpoints

All routes below are relative to `/api/v1` and accept GET, HEAD, and OPTIONS. POST/PUT/PATCH/DELETE are rejected. JSON responses provide `meta.dataset_version`, `meta.release_status`, and `meta.official_row_verification`.

| Path | Purpose |
| --- | --- |
| `/` | API overview |
| `/health` | Runtime health and release row counts |
| `/coverage` | Complete audit, per-year counts, issues, and limitations |
| `/sources` | Source URLs, dates, and raw-file SHA-256 checksums |
| `/elections` | Supported years and coverage summaries |
| `/elections/{year}` | Election summary and party totals |
| `/elections/{year}/constituencies` | Constituency summaries, winner, runner-up, margin |
| `/elections/{year}/constituencies/{id}/results` | All collected result rows for a seat |
| `/elections/{year}/results` | Search/filter a year's result rows |
| `/elections/{year}/winners` | Winners, excluding NOTA |
| `/elections/{year}/losers` | Losing candidates, excluding NOTA |
| `/elections/{year}/parties` | Party totals, seats, votes, and computed vote shares |
| `/elections/{year}/export.csv` | Full-year or filtered CSV |
| `/candidates` | Candidate-result records across years |
| `/records/{id}` | One source-scoped result record |
| `/compare?from=2021&to=2026&constituency_id=1` | Constituency comparison for 2011 onward |

Outside the API base: `/docs` is the explorer, `/openapi.json` is OpenAPI 3.1, and `/coverage.json` is the static audit.

List endpoints use `page=1&limit=50`; maximum `limit=500`. Result lists and candidate search accept `q` (substring), `party` (exact case-insensitive source label), `status=won|lost|nota|unresolved`, and `constituency_id`. Candidate search additionally accepts `year`. Constituency lists support `q`, `page`, and `limit`. CSV exports support the result filters without pagination. Unknown, repeated, and invalid query parameters are rejected.

```js
const API_BASE = 'https://tamilnadu-api.vercel.app/api/v1';
const response = await fetch(`${API_BASE}/elections/2026/constituencies/1/results`);
if (!response.ok) throw new Error(`API returned ${response.status}`);
const { data, meta } = await response.json();
console.log(data.winner, data.winning_margin, meta.official_row_verification);
```

## Data rules

- Election years: 1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2026.
- IDs belong to an election, constituency, and source row. They are **result IDs, not person IDs**. Similarly named candidates are not merged into one identity.
- Constituency IDs are election-scoped. Boundaries and numbering changed; automatic comparisons spanning years before 2011 are rejected.
- Winners are derived from source positions in historical data and unique maximum candidate votes in 2026. Rank is competition rank by candidate votes, excluding NOTA; tied votes share rank.
- NOTA is a separate option, never a candidate, loser, or winning seat.
- `counted_vote_sum` is the sum of imported candidate and NOTA rows. It is not independently certified turnout.
- Vote shares use imported candidate votes plus NOTA as the denominator. Quality-flagged constituencies return `null` for computed percentages. Party-wide percentages return `null` if any constituency in that year is flagged.
- Unknown age, gender, postal votes, and other absent fields remain `null`. Historical zero ages are treated as missing, not age zero.
- Historical party abbreviations and 2026 full names remain source labels. A label change in comparison does not automatically establish a party change.
- The 2016 archive includes delayed-poll results; two affected denominators remain flagged.
- Current officeholders, full by-election coverage, parliamentary/local elections, Tamil names, district filters, and official turnout are **not included**.

## Provenance and verification

Historical raw copy: [Sushanth / Election Data](https://just-rebel-spcell.github.io/Election_Data/tamil_nadu.html), which attributes its data to ECI. The 2021 normalized data uses [OpenCity's more detailed copy](https://data.opencity.in/dataset/tamil-nadu-assembly-elections-2021); all constituency/vote row multisets agree with the historical archive. This preserves detailed small-party labels rather than the historical copy's `OTH` groupings.

2026 raw copy: [heisenricher's candidate-result archive](https://github.com/heisenricher/Tamil-Nadu-Elections-2026-Dataset). Its 4,023 candidate count matches an [ECI affidavit-portal count](https://affidavit.eci.gov.in/CandidateCustomFilter?election=32-AC-GENERAL-3-60&electionType=32-AC-GENERAL-3-60&page=11&states=S22). The first constituency's leading three vote totals were checked against the official detailed report. **This is a limited check, not whole-file verification.**

Official reference: [ECI statistical reports](https://www.eci.gov.in/statistical-reports). Final results should be audited against official detailed reports and Form 20. Raw snapshots and checksums are retained under `data/raw` and `/sources`.

See **DATA_AUDIT.md** for the exact coverage table and unresolved issues, and **API_PLAN.md** for the launch plan and future modules.

## Reproduce

```bash
python3 scripts/collect_sources.py
python3 scripts/prepare_data.py
npm run build
npm test
```

The collector verifies existing snapshots and stops when a remote source changes. `--refresh` fetches bytes again but will not overwrite an unreviewed changed file. The normalization script uses the preserved OpenCity metadata and explicit reviewed constituency aliases, never fuzzy matching.

## Hosting and reuse

Vercel bundles compressed read-only data files; requests do not call or scrape ECI. Historical results use public cache headers. There is no promised uptime or commercial SLA in this initial release. Public endpoints have no application-level rate limiter; add a persistent rate limiter and operational monitoring before offering paid access.

The project's code and third-party factual source snapshots are distinct. Source attribution is retained; no government affiliation or blanket license over third-party material is claimed. Review source reuse terms before commercial redistribution.

## Creator

Created and built by **Shyam**. © 2026 Shyam for original project code and documentation. Third-party election data and supplied artwork retain their respective rights and source attribution; this credit does not claim ownership of government records or political endorsement.
