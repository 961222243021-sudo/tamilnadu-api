# Tamilnadu API: the complete beginner guide

Created and built by **Shyam**. You can use this project without signing up, paying, or obtaining an API key.

## Quick start: choose what you need

- **Just browse:** [Choose a year and constituency](https://tamilnadu-api.vercel.app/#explore).
- **Get one seat as JSON:** [Simple results URL](https://tamilnadu-api.vercel.app/api/v1/results?year=2026&constituency_id=13). Change only the year and constituency number.
- **Get every row for a year:** [Download 2026 CSV](https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv).
- **Build an app:** Copy a JavaScript or Python example in section 8. No API key is needed.

## 1. Start without writing code

Open [the website](https://tamilnadu-api.vercel.app/#explore). Choose an election year. Type a constituency's English name or number in the search box, then choose it from the dropdown. Results appear automatically.

The green row is the winning candidate. Other candidates show LOST. NOTA means None of the Above and is a separate voting option. The summary shows the winner, the winning margin, the number of candidates, and the sum of imported votes.

Use **Copy result URL** to copy a ready-to-use request for your selected seat. Use **Open this result as JSON** to see the same data in a machine-readable format. Use **Download this seat CSV** for a spreadsheet of that constituency, or **Download year CSV** for the entire election. CSV files open in Excel, Google Sheets, or LibreOffice.

If nothing loads, use **Try again**. If search finds no seat, clear it and choose from the list. Names are currently in English; Tamil search and district filters are not included.

## 2. What is an API?

An API is a URL your app can request to obtain structured data. A browser can open these URLs too. **GET** means read data. **JSON** is a text format with named fields. **CSV** is a spreadsheet-friendly table.

Our base URL is `https://tamilnadu-api.vercel.app/api/v1`. Add an endpoint after it. For example, `/elections` becomes [the election list](https://tamilnadu-api.vercel.app/api/v1/elections).

This archive covers Tamil Nadu Assembly general-election cycles, with candidate votes, winners, losers, and party totals. It does not disclose how individual voters voted. Parliamentary elections, local elections, a full by-election history, and current officeholders are not included.

## 3. Your first API request

1. Open [all supported election years](https://tamilnadu-api.vercel.app/api/v1/elections).
2. Open [all 234 constituency summaries for 2026](https://tamilnadu-api.vercel.app/api/v1/elections/2026/constituencies?limit=500).
3. Find the `constituency_id` you want.
4. Open [the complete results for constituency 1 in 2026](https://tamilnadu-api.vercel.app/api/v1/elections/2026/constituencies/1/results).

Replace `2026` with a supported year and `1` with an ID from that year's constituency list. Supported years: **1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2026**. This is an election archive, so years such as 2025 do not have a dataset.

## 4. Understand the response

Most JSON endpoints return `data` and `meta`. List endpoints also include `pagination`. The API overview and health check have their own top-level fields.

| Field | Meaning |
| --- | --- |
| `data` | The requested object or list of records |
| `meta.dataset_version` | The archive release identifier |
| `meta.release_status` | Currently `provisional` |
| `meta.official_row_verification` | Currently `pending` |
| `pagination.page` | The page returned |
| `pagination.limit` | The maximum rows on this page |
| `pagination.total` | All matching rows, across every page |
| `pagination.pages` | How many pages to request |

A constituency result contains `winner`, `runner_up`, `winning_margin`, `candidate_count`, `nota_votes`, `counted_vote_sum`, `quality_flags`, and `results`. Each result row includes these useful fields:

| Field | Meaning |
| --- | --- |
| `id` | Unique election result record ID; not a permanent person ID |
| `year`, `constituency_id`, `constituency_name` | Election and seat |
| `candidate_name`, `party` | Name and party label from the source |
| `votes` | Imported votes for this row |
| `general_votes`, `postal_votes` | Vote components when the source provides them; otherwise null |
| `rank` | Rank by candidate votes; ties share rank; NOTA has no candidate rank |
| `status` | `won`, `lost`, `nota`, or `unresolved` |
| `is_nota` | True for a NOTA voting-option row |
| `vote_share_pct` | Computed percentage, or null when source totals need review |
| `quality_flags` | Detected inconsistencies requiring review |
| `source_id`, `source_row` | Where the record came from |
| `verification_status` | The record's verification state |

`null` means unavailable or not computed; it does not mean zero. `counted_vote_sum` is the sum of imported candidate and NOTA rows, not certified turnout. Winning margin is the winner's votes minus the runner-up's votes. Source-derived winners and vote rankings can require review when source data conflicts.

## 5. Every endpoint

All paths below start after `/api/v1`. Braces indicate values you replace, not characters you type.

| Endpoint | What it returns | Query parameters |
| --- | --- | --- |
| `/` | API name, scope, docs links | None |
| `/results?year={year}&constituency_id={id}` | Easy shortcut: full seat summary and every candidate/NOTA row | Required: `year`, `constituency_id`; no pagination |
| `/health` | Runtime status and archive counts | None |
| `/elections` | All available years and coverage | None |
| `/elections/{year}` | One election's coverage and party totals | None |
| `/elections/{year}/constituencies` | Seat summaries, winners, runners-up, margins | `q`, `page`, `limit` |
| `/elections/{year}/constituencies/{id}/results` | Every imported row for one seat, with summary | None; no pagination needed |
| `/elections/{year}/results` | Paginated result rows for the year | Result filters, `page`, `limit` |
| `/elections/{year}/winners` | Winning candidates only | Result filters, `page`, `limit` |
| `/elections/{year}/losers` | Losing candidates only; excludes NOTA | Result filters, `page`, `limit` |
| `/elections/{year}/parties` | Party votes, shares, contested seats, won seats | None; returns the full party list |
| `/elections/{year}/export.csv` | Complete year or filtered rows as CSV | Result filters; no pagination |
| `/candidates` | Search result records across years | Result filters, `year`, `page`, `limit` |
| `/records/{id}` | One result record using its exact ID | None |
| `/compare` | Two elections' results for one modern seat | Required: `from`, `to`, `constituency_id` |
| `/coverage` | Coverage, unresolved issues, limitations | None |
| `/sources` | Source references and snapshot checksums | None |

Result filters are `q`, `party`, `status`, and `constituency_id`. The `/candidates` search may include NOTA records, so check `is_nota` when you want only people. `/winners` and `/losers` always enforce their respective outcome regardless of other filters.

Outside the API: `/` and `/docs` open the explorer, `/guide` opens this guide, `/openapi.json` contains the OpenAPI 3.1 specification, and `/coverage.json` contains the static audit.

## 6. Search, filters, and useful examples

A question mark starts query parameters. An ampersand joins them: `?year=2021&q=stalin`. Parameter names are case-sensitive. Search text and party matching ignore case. `q` is a substring search across candidate name, seat name, and party on result endpoints; constituency-list search checks seat names.

| Task | Open an example |
| --- | --- |
| All 234 winners in 2026 | [Winners](https://tamilnadu-api.vercel.app/api/v1/elections/2026/winners?limit=500) |
| Candidate-name search in 2021 | [Search Stalin](https://tamilnadu-api.vercel.app/api/v1/candidates?year=2021&q=stalin) |
| Find Kolathur in 2021 | [Find the seat ID](https://tamilnadu-api.vercel.app/api/v1/elections/2021/constituencies?q=kolathur) |
| DMK rows in 2021 | [Exact party label](https://tamilnadu-api.vercel.app/api/v1/elections/2021/results?party=DMK&limit=500) |
| Only NOTA rows in 2026 | [NOTA](https://tamilnadu-api.vercel.app/api/v1/elections/2026/results?status=nota&limit=500) |
| All rows for seat 1 as CSV | [Seat CSV](https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv?constituency_id=1) |
| Entire 2026 dataset | [Full CSV](https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv) |
| Seat 1 in 2021 versus 2026 | [Compare](https://tamilnadu-api.vercel.app/api/v1/compare?from=2021&to=2026&constituency_id=1) |

`party` must match a source label exactly, ignoring case. Use the year's `/parties` endpoint to discover labels; `DMK` in a historical source and `Dravida Munnetra Kazhagam` in 2026 are different labels. URL-encode spaces and special characters, or use JavaScript `URLSearchParams`.

Constituency IDs range from 1 to 234. Boundaries and numbering changed historically. Compare accepts two different election years from 2011 onward only. A changed party label does not necessarily establish a changed party.

## 7. Get ALL data with pagination

Lists return **50 rows by default**, not every record. `limit=500` raises the page size to the maximum. If `pagination.pages` is greater than one, request pages 2, 3, and so on. Keep the same filters on every page. A page beyond the last returns an empty list.

For a complete year in one download, CSV is easiest. For JSON, the following JavaScript fetches every page:

```js
const API_BASE = 'https://tamilnadu-api.vercel.app/api/v1';
async function getAllResults(year) {
  const rows = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const response = await fetch(
      `${API_BASE}/elections/${year}/results?page=${page}&limit=500`
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || `HTTP ${response.status}`);
    rows.push(...body.data);
    pages = body.pagination.pages;
  }
  return rows;
}
const rows = await getAllResults(2026);
console.log(rows.length);
```

To collect all years, first request `/elections`, then call `getAllResults(election.year)` for each year. This returns the collected archive; official row verification is still pending.

## 8. Code you can copy

JavaScript: run this in a modern browser console or in a Node.js 24 `.mjs` file. Top-level await requires a module or a console that supports it.

```js
const API_BASE = 'https://tamilnadu-api.vercel.app/api/v1';
const response = await fetch(`${API_BASE}/elections/2026/constituencies/1/results`);
const body = await response.json();
if (!response.ok) throw new Error(body.error?.message || `HTTP ${response.status}`);
console.log(body.data.constituency_name);
console.log(body.data.winner?.candidate_name);
console.log(body.data.winning_margin);
console.table(body.data.results);
```

Python: save as `example.py` and run `python example.py`. It uses only the standard library.

```python
import json
import urllib.request
import urllib.error
url = 'https://tamilnadu-api.vercel.app/api/v1/elections/2026/constituencies/1/results'
try:
    with urllib.request.urlopen(url, timeout=30) as response:
        body = json.load(response)
    print(body['data']['constituency_name'])
    print(body['data']['winner']['candidate_name'])
    for row in body['data']['results']:
        print(row['candidate_name'], row['votes'], row['status'])
except urllib.error.HTTPError as error:
    print(error.code, error.read().decode())
except urllib.error.URLError as error:
    print('Connection failed:', error.reason)
```

Terminal: on Windows PowerShell use `curl.exe` if `curl` is an alias for another command.

```bash
curl 'https://tamilnadu-api.vercel.app/api/v1/elections'
curl 'https://tamilnadu-api.vercel.app/api/v1/elections/2026/export.csv' -o tamilnadu-2026.csv
```

Postman: create a request, choose **GET**, paste a full URL above, and click **Send**. Leave authentication set to **No Auth**. Public CORS headers allow browser applications to read the API; no Authorization header is needed.

## 9. Errors and troubleshooting

| HTTP status | Meaning | What to do |
| --- | --- | --- |
| 200 | Request succeeded | Read `data`, `meta`, and any pagination |
| 204 | OPTIONS preflight succeeded | No response body is expected |
| 400 | Invalid, repeated, or unknown parameter | Check spelling, supported filters, and ranges |
| 404 | Unsupported election, route, or record | Use `/elections` and a record ID returned by the API |
| 405 | Unsupported HTTP method | Use GET, HEAD, or OPTIONS |
| 409 | Unsafe historical constituency comparison | Compare different supported years from 2011 onward |
| 500 | Unexpected server error | Retry later; check `/health` |

API errors have `error.message`. Hosting-level errors can have a different format. HEAD returns headers without a body. POST, PUT, PATCH, and DELETE cannot modify data.

If you get an empty list, check the year, spelling, exact party label, filters, and page number. Query text is limited to 160 characters per value. `page` starts at 1; `limit` must be 1–500. CSV accepts filters but does not accept `page` or `limit`. Do not send parameters to endpoints that do not list them.

If a seat percentage says **Under review**, read `quality_flags`; the API deliberately omits that calculation when source totals conflict. Changing filters cannot verify those source records.

## 10. Sources, accuracy, and responsible interpretation

This release contains **36,039 result rows** across 14 election cycles, including **35,337 candidate rows** and **702 NOTA rows**. All target years and 234 seat IDs per year are present. That does not certify every candidate row as accurate or complete.

The archive is **provisional**. Full official ECI row verification remains pending. Historical source copies, OpenCity's 2021 data, and the 2026 source archive are documented in [sources](https://tamilnadu-api.vercel.app/api/v1/sources). The [coverage audit](https://tamilnadu-api.vercel.app/api/v1/coverage) records unresolved issues. API responses retain source references and verification status.

Vote shares are computed from imported candidate votes plus NOTA, not certified turnout. Party shares are null if any seat in that election has relevant quality flags. Matching candidate names across years does not establish identity. Election winners do not necessarily represent current officeholders.

Historical responses use cache headers, so this is not a live counting feed. No commercial uptime guarantee is offered in this release. Use the audit and official election reports when accuracy is critical.

Created and built by **Shyam** · Independent project, not affiliated with ECI or the Tamil Nadu government. Project credit applies to original work; third-party data and artwork retain their respective rights.
