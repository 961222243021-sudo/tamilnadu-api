<div align="center">

# தமிழ்நாடு API · Tamilnadu API

**Tamil Nadu’s elections. One place to explore.**

Candidate votes · Constituency results · Winners and runners-up · Party totals

<img src="public/assets/leaders-collage-v2.webp" alt="Political leaders collage supplied by Shyam for Tamilnadu API" width="900">

**Created and built by Shyam**

[Explore results](https://tamilnadu-api.vercel.app/) · [Try the playground](https://tamilnadu-api.vercel.app/playground) · [Read the full guide](https://tamilnadu-api.vercel.app/guide) · [OpenAPI specification](https://tamilnadu-api.vercel.app/openapi.json)

![Election cycles: 14](https://img.shields.io/badge/Election_cycles-14-047c9a)
![Archive: 1967–2026](https://img.shields.io/badge/Archive-1967%E2%80%932026-047c9a)
![API: read only](https://img.shields.io/badge/API-Read_only-168565)
![Node.js: 24](https://img.shields.io/badge/Node.js-24-168565)
![Official verification: pending](https://img.shields.io/badge/Official_verification-Pending-b8860b)

</div>

Tamilnadu API is an independent election archive with a public JSON API, CSV downloads, an interactive explorer, and shareable result pages. It helps students, developers, journalists, and researchers explore collected Tamil Nadu Assembly general-election results.

> **Data status: provisional.** All 14 target election years and all 234 constituency IDs per year are present in the imported archive. Complete official candidate-row verification is still pending. Seat coverage does **not** certify candidate completeness or accuracy. [Inspect the audit](DATA_AUDIT.md) · [Live coverage report](https://tamilnadu-api.vercel.app/api/v1/coverage)

## Contents

- [Start here](#start-here)
- [What you can do](#what-you-can-do)
- [Quickstart: Tirunelveli](#quickstart-tirunelveli)
- [API reference](#api-reference)
- [Filters and pagination](#filters-and-pagination)
- [Understand the response](#understand-the-response)
- [Coverage and interpretation](#coverage-and-interpretation)
- [Sources and verification](#sources-and-verification)
- [Run locally](#run-locally)
- [Deploy on Vercel](#deploy-on-vercel)
- [Project structure](#project-structure)
- [Contributing and roadmap](#contributing-and-roadmap)
- [Creator and rights](#creator-and-rights)

## Start here

| Your goal | Start with |
| --- | --- |
| Browse without writing code | [Election explorer](https://tamilnadu-api.vercel.app/#explore) |
| See and share one seat’s results | [Tirunelveli, 2026](https://tamilnadu-api.vercel.app/read/2026/224) |
| Build your first API request | [API playground](https://tamilnadu-api.vercel.app/playground) |
| Get the complete JSON for one seat | [Tirunelveli JSON](https://tamilnadu-api.vercel.app/api/v1/results?year=2026&constituency_id=224) |
| Download data for analysis | [2026 full-year CSV](https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv) |
| Learn what an API is and how to use it | [Complete beginner guide](API_GUIDE.md) |
| Check sources and unresolved issues | [Data audit](DATA_AUDIT.md) |

**No signup. No API key.** Public GET requests work in a browser, JavaScript, Python, curl, and Postman. The API contains candidate vote totals; it does not disclose individual voters’ choices.

## What you can do

| Feature | Available today |
| --- | --- |
| Election explorer | Choose a year, search an English seat name or number, and browse every imported result row |
| Readable result pages | Share `/read/{year}/{constituency_id}` with the winner, margin, vote chart, table, and source-review details |
| Vote charts | Top five candidates by imported votes, plus NOTA where present; bar lengths are relative to the highest count |
| Year comparison | Compare a modern constituency across two supported elections from 2011 onward |
| API playground | Build requests, see HTTP status and JSON, adjust list pagination, and copy JavaScript/Python examples |
| District browsing | Source-year labels for 2021 and 2026; 19 seats have missing district labels in the 2026 source |
| Tamil search | Five Tirunelveli seats, IDs 224–228, for elections from 2011 onward; statewide Tamil coverage is pending |
| Data exports | Full-year or filtered CSV; paginated JSON lists |
| Provenance | Source IDs, source rows, verification status, and quality flags |

## Quickstart: Tirunelveli

**Base URL**

```text
https://tamilnadu-api.vercel.app/api/v1
```

For modern elections in this archive, Tirunelveli’s constituency ID is **224**. To find another seat, use that election’s constituency list rather than assuming an ID.

### 1. Open a result

[Readable page](https://tamilnadu-api.vercel.app/read/2026/224) · [JSON response](https://tamilnadu-api.vercel.app/api/v1/results?year=2026&constituency_id=224) · [Seat CSV](https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv?constituency_id=224)

```bash
curl 'https://tamilnadu-api.vercel.app/api/v1/results?year=2026&constituency_id=224'
```

On Windows PowerShell, use `curl.exe` if `curl` is an alias for another command.

### 2. Use JavaScript

```js
const API_BASE = 'https://tamilnadu-api.vercel.app/api/v1';

async function getJSON(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message ?? `HTTP ${response.status}`);
  }
  return body;
}

const { data, meta } = await getJSON('/results?year=2026&constituency_id=224');
console.log(data.constituency_name);
console.log(data.winner?.candidate_name, data.winning_margin);
console.table(data.results.map(row => ({
  candidate: row.candidate_name,
  party: row.party,
  votes: row.votes,
  result: row.status,
})));
console.log('Official verification:', meta.official_row_verification);
```

### 3. Use Python

This example uses Python’s standard library; no extra package is required.

```python
import json
import urllib.error
import urllib.request

url = 'https://tamilnadu-api.vercel.app/api/v1/results?year=2026&constituency_id=224'

try:
    with urllib.request.urlopen(url, timeout=20) as response:
        body = json.load(response)
    data = body['data']
    print(data['constituency_name'], data['winning_margin'])
    for row in data['results']:
        print(row['candidate_name'], row['votes'], row['status'])
except urllib.error.HTTPError as error:
    print('API error:', error.code, error.read().decode())
except urllib.error.URLError as error:
    print('Connection failed:', error.reason)
```

To use Postman, choose **GET**, paste the complete request URL, select **No Auth**, and send the request.

## API reference

Paths below are relative to `/api/v1`. The API accepts **GET, HEAD, and OPTIONS**. Write methods are rejected. Browser requests are supported through public CORS headers.

| Endpoint | Returns / purpose |
| --- | --- |
| `/` | API overview and starter links |
| `/health` | Runtime status, election count, and result-row count |
| `/coverage` | Release audit, year counts, limitations, and source issues |
| `/sources` | Source references and retained raw-file checksums |
| `/elections` | Supported election years and coverage summaries |
| `/elections/{year}` | Election summary and party totals |
| `/results?year={year}&constituency_id={id}` | Complete summary and imported rows for one seat |
| `/elections/{year}/constituencies` | Paginated seat summaries: winner, runner-up, margin, and metadata |
| `/elections/{year}/constituencies/{id}/results` | Complete seat results, equivalent to the short `/results` request |
| `/elections/{year}/results` | Paginated candidate and NOTA rows |
| `/elections/{year}/winners` | Paginated winners, excluding NOTA |
| `/elections/{year}/losers` | Paginated losing candidates, excluding NOTA |
| `/elections/{year}/parties` | Party labels, votes, seats contested, and seats won |
| `/elections/{year}/districts` | District groups with seat IDs and counts; 2021 and 2026 only |
| `/elections/{year}/export.csv` | Full-year or filtered CSV; no pagination |
| `/candidates` | Paginated result-record search, optionally scoped to a year; can include NOTA |
| `/records/{id}` | One exact source-scoped result record |
| `/compare?from={year}&to={year}&constituency_id={id}` | Two seat summaries, imported vote-total change, and party-label comparison; 2011 onward |

Website routes are separate from API routes:

| Route | Page / resource |
| --- | --- |
| `/` or `/docs` | Explorer and endpoint overview |
| `/guide` | Complete beginner guide |
| `/playground` | Interactive API playground |
| `/read/{year}/{constituency_id}` | Shareable constituency result page |
| `/openapi.json` | OpenAPI 3.1 specification |
| `/coverage.json` | Static coverage audit |

## Filters and pagination

| Endpoint family | Accepted query parameters |
| --- | --- |
| Constituency lists | `q`, `district`, `page`, `limit` |
| Results, winners, and losers | `q`, `party`, `status`, `constituency_id`, `page`, `limit` |
| Candidate-record search | `year`, `q`, `party`, `status`, `constituency_id`, `page`, `limit` |
| CSV export | `q`, `party`, `status`, `constituency_id` |
| District groups / party totals | No query filters |
| One-seat shortcut | Required: `year`, `constituency_id` |
| Comparison | Required: `from`, `to`, `constituency_id` |

- `q` is a case-insensitive substring search. Result-record search checks candidate names, seat names, party labels, and supported Tamil seat aliases. Seat lists search English seat names and supported Tamil aliases.
- `party` matches the source party label exactly, ignoring case. Historical abbreviations and modern full names are not automatically merged.
- `district` matches the source district label exactly, ignoring case; only 2021 and 2026 support it. Obtain labels from `/elections/{year}/districts`.
- `status` accepts `won`, `lost`, `nota`, or `unresolved`. For candidate-only results, explicitly exclude NOTA in your application or choose an appropriate status filter.
- `page` defaults to **1**; `limit` defaults to **50**, with a maximum of **500**. These apply only to paginated list endpoints.
- Unknown, repeated, and invalid parameters are rejected. Encode spaces and Tamil text with `URLSearchParams` or your HTTP client.

Examples:

```text
/elections/2026/constituencies?q=Tirunelveli
/elections/2026/constituencies?district=Tirunelveli&limit=500
/elections/2026/constituencies?q=திருநெல்வேலி
/candidates?year=2021&q=stalin
/elections/2021/results?party=DMK&status=won&limit=500
/compare?from=2021&to=2026&constituency_id=224
```

**One page is not the whole dataset.** Even `limit=500` cannot return every candidate in a year. Request all pages or use CSV.

```js
// Uses getJSON() from the JavaScript quickstart above.
const rows = [];
for (let page = 1; ; page++) {
  const body = await getJSON(`/elections/2026/results?page=${page}&limit=500`);
  rows.push(...body.data);
  if (page >= body.pagination.pages) break;
}
console.log(`Collected ${rows.length} result rows, including NOTA.`);
```

## Understand the response

JSON requests return `data` and `meta`. Paginated lists additionally return `pagination`. Error responses contain `error.message`.

| Field | Meaning |
| --- | --- |
| `data.winner`, `data.runner_up` | Imported seat result records; can be null when unresolved |
| `winning_margin` | Winner’s votes minus runner-up’s votes; null when unavailable |
| `candidate_count` | Imported candidate rows, excluding NOTA |
| `counted_vote_sum` | Imported candidate votes plus NOTA; not certified turnout |
| `nota_votes` | Imported NOTA total; zero if no NOTA row is present |
| `results` | All imported candidate and NOTA rows for the selected seat |
| `constituency_name_tamil` | Reviewed Tamil seat name where available; otherwise null |
| `tamil_search_aliases` | Supported Tamil name variants; empty outside available coverage |
| `district_name`, `district_source_id` | Source-year district label and source reference; nullable |
| `vote_share_pct` | Computed percentage of imported candidate votes plus NOTA; null when source totals are flagged |
| `quality_flags` | Known source inconsistencies requiring review |
| Record `source_id`, `source_row` | Where the imported row came from |
| Record `verification_status` | Row-level verification state |
| `meta.official_row_verification` | Release verification state; currently `pending` |
| `pagination` | Current page, page limit, total matching rows, and page count |

Result statuses: **`won`** = imported election winner; **`lost`** = losing candidate; **`nota`** = NOTA option; **`unresolved`** = result needs review. A result ID identifies an election/source record, **not a unique person**.

| HTTP status | Meaning / next step |
| --- | --- |
| `200` | Successful request; inspect `data` and metadata |
| `204` | Successful OPTIONS preflight; no body |
| `400` | Missing, invalid, repeated, or unsupported query parameter |
| `404` | Unsupported election year, record, or endpoint |
| `405` | Write method rejected; use GET, HEAD, or OPTIONS |
| `409` | Comparison crosses historical boundaries, or district metadata is unavailable for that year |
| `500` | Unexpected server error; retry and report the failing URL |

## Coverage and interpretation

| Year | Constituencies | Candidate rows | NOTA rows | Total result rows |
| --- | ---: | ---: | ---: | ---: |
| 1967 | 234 | 778 | 0 | 778 |
| 1971 | 234 | 748 | 0 | 748 |
| 1977 | 234 | 1,390 | 0 | 1,390 |
| 1980 | 234 | 1,029 | 0 | 1,029 |
| 1984 | 234 | 1,499 | 0 | 1,499 |
| 1989 | 234 | 3,046 | 0 | 3,046 |
| 1991 | 234 | 2,834 | 0 | 2,834 |
| 1996 | 234 | 5,017 | 0 | 5,017 |
| 2001 | 234 | 1,860 | 0 | 1,860 |
| 2006 | 234 | 2,586 | 0 | 2,586 |
| 2011 | 234 | 2,748 | 0 | 2,748 |
| 2016 | 234 | 3,781 | 234 | 4,015 |
| 2021 | 234 | 3,998 | 234 | 4,232 |
| 2026 | 234 | 4,023 | 234 | 4,257 |
| **Total** | **234 per year** | **35,337** | **702** | **36,039** |

**All 234 constituency IDs are present for each listed election.** Official candidate-row verification remains pending for every year.

Interpret results with these rules:

- Constituency numbers are election-scoped. Boundary/numbering changes make pre-2011 comparisons unsafe; the comparison endpoint rejects them.
- Source-declared historical positions determine imported winners; the 2026 import uses the unique maximum candidate vote count. Tied candidate votes retain equal competition rank. NOTA is never a candidate, loser, or winning seat.
- Missing age, gender, postal votes, and metadata remain null. A missing district label is not assigned by guessing.
- Computed seat percentages are null when source totals conflict. Party-wide percentages are null if any seat in the year has relevant quality flags.
- Historical party abbreviations and 2026 full names remain as imported. A party-label change does not establish a party change.
- District labels are specific to their source year. Do not apply 2026 district labels to historical elections.
- Tamil coverage currently includes Tirunelveli, Ambasamudram, Palayamkottai, Nanguneri, and Radhapuram (modern IDs 224–228). Candidate names remain as imported.
- This is a general-election archive, not a live counting feed, current-MLA directory, or full by-election history. Parliamentary/local-body results and official turnout are outside this release.

## Sources and verification

| Source | Use in this project |
| --- | --- |
| [Sushanth / Election Data archive](https://just-rebel-spcell.github.io/Election_Data/tamil_nadu.html) | Historical factual archive attributed by its publisher to ECI |
| [OpenCity / TCPD, 2021](https://data.opencity.in/dataset/tamil-nadu-assembly-elections-2021) | Detailed 2021 party labels and source-year district metadata |
| [2026 archive by heisenricher](https://github.com/heisenricher/Tamil-Nadu-Elections-2026-Dataset) | Candidate vote components and constituency metadata |
| [Tirunelveli district’s Tamil election page](https://tirunelveli.nic.in/ta/தோ்தல்/) | Five reviewed modern Tamil constituency names, with a Nanguneri spelling alias |
| [ECI statistical reports](https://www.eci.gov.in/statistical-reports) | Official reference for further verification |

The 2021 constituency/vote row multisets agree between the OpenCity and historical copies. The 2026 candidate count and a limited sample were checked against official references. **Agreement between copies and limited spot checks are not full official verification.** Collection-time failures prevented a complete official report audit; details are retained in [DATA_AUDIT.md](DATA_AUDIT.md).

Raw snapshots and source checksums are retained. [Live sources](https://tamilnadu-api.vercel.app/api/v1/sources) describe the result archives; reviewed seat metadata and its Tamil source are stored in [`seat-metadata.json`](data/normalized/seat-metadata.json).

## Run locally

Requirements: **Node.js 24** and Git. The app has no runtime npm dependencies, database credentials, or API keys. Python 3 is needed only for the source preparation scripts.

```bash
git clone https://github.com/961222243021-sudo/tamilnadu-api.git
cd tamilnadu-api
npm run build
npm test
npm run dev
```

Open `http://localhost:3000`. Local API base: `http://localhost:3000/api/v1`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Serve the website and API locally |
| `npm run build` | Validate archive coverage, create compressed data, and refresh the static audit |
| `npm test` | Run API regression checks, including pagination, NOTA, routing, metadata, and historical boundaries |
| `npm run data:prepare` | Normalize preserved source snapshots; does not perform full official verification |
| `python3 scripts/prepare-seat-metadata.py` | Rebuild district mappings while preserving reviewed Tamil aliases |

### Reproduce the data import

```bash
python3 scripts/collect_sources.py
python3 scripts/prepare_data.py
python3 scripts/prepare-seat-metadata.py
npm run build
npm test
```

Review upstream changes before updating snapshots. The collector checks retained bytes and stops on an unreviewed remote change. `--refresh` fetches again but does not blindly overwrite changed source files. Normalization uses explicit reviewed name mappings, not fuzzy constituency matching.

## Deploy on Vercel

Import this GitHub repository into Vercel using these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Root directory | Repository root |
| Build command | `npm run build` |
| Output directory | `public` |
| Node.js version | `24.x` |
| Environment variables | None required |

[`vercel.json`](vercel.json) defines the API and readable-page rewrites and bundles compressed data with the function. The website detects its current origin; OpenAPI uses a relative server URL. Forks do not need to edit the production domain in the application code.

Optional CLI deployment:

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

After deployment, check `/api/v1/health`, a seat result, `/playground`, `/read/2026/224`, and a CSV download. Your API base is `https://YOUR-ASSIGNED-DOMAIN/api/v1`; a project name does not reserve a particular domain.

Requests use bundled, read-only release data and do not scrape ECI at request time. Successful API responses use public cache headers. Public access currently has no application-level rate limiter or commercial uptime guarantee.

## Project structure

| Location | Responsibility |
| --- | --- |
| [`api/index.js`](api/index.js) | Request routing, validation, filtering, aggregation, CSV, and read-only methods |
| [`public/`](public/) | Explorer, result pages, playground, guide, styles, and artwork |
| [`data/raw/`](data/raw/) | Retained source snapshots and collection checks |
| [`data/normalized/`](data/normalized/) | Election JSON, compressed files, coverage, sources, and seat metadata |
| [`scripts/`](scripts/) | Collection, normalization, validation, and local server |
| [`tests/api.test.mjs`](tests/api.test.mjs) | API regression tests |
| [`API_GUIDE.md`](API_GUIDE.md) | Beginner walkthrough and examples |
| [`DATA_AUDIT.md`](DATA_AUDIT.md) | Coverage counts and unresolved data issues |
| [`API_PLAN.md`](API_PLAN.md) | Project scope and development plan |

## Contributing and roadmap

Report a bug with the exact request URL, expected behavior, actual response, and reproduction steps. For a data correction, include the election year, constituency ID, record ID if available, and an official source or report page. Do not silently replace imported vote totals or mark a row verified without supporting evidence.

[Open an issue](https://github.com/961222243021-sudo/tamilnadu-api/issues) · [Read the development plan](API_PLAN.md)

Priorities for future releases:

- Complete official candidate-row verification with report/page references.
- Expand reviewed Tamil constituency names statewide.
- Fill district metadata gaps from documented sources.
- Add operational monitoring and rate limiting before offering paid API access.
- Evaluate parliamentary and local-body archives as separate, clearly scoped datasets.

For code changes, keep existing endpoint behavior compatible and run the build and relevant tests. For documentation changes, check that examples match the actual endpoint parameters and available coverage.

## Creator and rights

**Created and built by Shyam.** © 2026 Shyam for original project code and documentation.

This repository currently has no open-source license granting general reuse of the original code. Public API access is not a blanket license to redistribute third-party materials. Election snapshots and supplied artwork retain their respective rights and source attribution.

Tamilnadu API is an independent project, not affiliated with ECI or the Tamil Nadu government. Names and imagery do not imply political endorsement.

---

<div align="center">

**Explore Tamil Nadu’s election history. Build with transparent data.**

[Website](https://tamilnadu-api.vercel.app/) · [Playground](https://tamilnadu-api.vercel.app/playground) · [Guide](https://tamilnadu-api.vercel.app/guide) · [Coverage](https://tamilnadu-api.vercel.app/api/v1/coverage)

</div>
