# Tamilnadu API: election module plan

## Product

One documented API for developers, students, journalists, and citizen dashboards to query Tamil Nadu election archives. Begin with Assembly general-election cycles; keep result data separate from current representation and individual voter records.

## Implemented v1

- Fourteen year-scoped datasets, 1967–2026.
- Constituency results, all collected candidate rows, source-derived winners and losers.
- Candidate ranks, runner-up, winning margin, candidate/NOTA counts.
- Party vote and seat totals using source-specific labels.
- Candidate-result search, exact record lookup, pagination and filters.
- Constituency comparisons restricted to the modern numbering era, 2011 onward.
- Full-year or filtered CSV exports, spreadsheet formula escaping.
- Coverage report with unresolved issues, provenance, raw snapshots, checksums.
- OpenAPI 3.1, public CORS, health endpoint, mobile-responsive browser explorer.
- Node 24 Vercel Function; domain-independent API base `/api/v1`.

## Launch gate: official data certification

The initial build is a **provisional archive**, not a complete official dataset.

1. Obtain the official detailed results reports for every listed election year.
2. Match each year/constituency/candidate row; reconcile party spelling and candidate names without guessing identity.
3. Compare contestant counts, votes, NOTA, declared winners, seat totals, and report-level totals.
4. Resolve flagged 1967/2016 totals and zero-vote historical records against source documents.
5. Separate delayed polls and all by-elections into independently identified election events.
6. Audit 2026 against final Form 20, not only counting-day pages.
7. Publish a row-level reconciliation log and new version. Only then change verification status for verified rows.

Having 234 IDs in a file is a structural check; it does not prove complete candidate coverage. No missing vote value should be invented.

## Next releases

| Priority | Module | Required evidence |
| --- | --- | --- |
| 1 | Officially reconciled candidate results | Official reports and per-row audit |
| 2 | Tamil/English constituency search | Verified bilingual names, aliases, unique IDs |
| 3 | District and parliamentary-seat mapping | Election-year-specific official mapping; avoid stale district boundaries |
| 4 | Turnout, electorate, postal/ordinary split | Official fields with clear denominators and dates |
| 5 | Candidate history | Reviewed identity links; names alone are insufficient |
| 6 | By-elections | Official event dates and separate result sets |
| 7 | Tamil Nadu Lok Sabha history | Separate parliamentary constituency IDs and official reports |
| 8 | Local-body history | TNSEC datasets, ward IDs, election-year boundaries |
| 9 | Boundary maps | Geometry with confirmed license and delimitation version |
| 10 | Paid developer tier | Data reuse review, key management, durable rate limits, metering, SLA |

## API conventions

Use `/api/v1` for this schema; add `/api/v2` for breaking changes. Support stable snapshot versions, precise error codes, pagination, and source provenance. Never hardcode the deployment hostname. Keep explicit units and denominator descriptions. Party/alliance mappings must be election-specific. Election victories do not imply that someone remains an MLA today.

## Deployment defaults

Suggested name `tamilnadu-api`; framework Other; repository root; build `npm run build`; output `public`; Node `24.x`. No secret keys or database required. Documentation uses the assigned origin. Verify the real alias after deployment; a suggested name is not a domain reservation.
