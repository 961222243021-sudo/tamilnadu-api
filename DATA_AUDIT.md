# Election data coverage audit

Collected on 2026-10-09. **Provisional; complete official row verification is pending.**

| Year | Constituencies | Candidate rows | NOTA rows | Winners | Flagged constituencies |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1967 | 234/234 | 778 | 0 | 234 | 2 |
| 1971 | 234/234 | 748 | 0 | 234 | 0 |
| 1977 | 234/234 | 1390 | 0 | 234 | 0 |
| 1980 | 234/234 | 1029 | 0 | 234 | 0 |
| 1984 | 234/234 | 1499 | 0 | 234 | 0 |
| 1989 | 234/234 | 3046 | 0 | 234 | 0 |
| 1991 | 234/234 | 2834 | 0 | 234 | 2 |
| 1996 | 234/234 | 5017 | 0 | 234 | 1 |
| 2001 | 234/234 | 1860 | 0 | 234 | 0 |
| 2006 | 234/234 | 2586 | 0 | 234 | 0 |
| 2011 | 234/234 | 2748 | 0 | 234 | 0 |
| 2016 | 234/234 | 3781 | 234 | 234 | 2 |
| 2021 | 234/234 | 3998 | 234 | 234 | 0 |
| 2026 | 234/234 | 4023 | 234 | 234 | 0 |

Total: **36,039 result rows**, including **35,337 candidates**. All 14 target election years and their 234 constituency IDs are present. Candidate completeness is not officially certified.

## Unresolved source issues

- 1967, constituency 44 (Peranamallur): inconsistent_reported_total, vote_sum_mismatch. Imported vote sum 63601; source-reported totals [62832, 66728].
- 1967, constituency 152 (Perambalur): vote_sum_mismatch. Imported vote sum 65959; source-reported totals [66728].
- 1991, constituency 31 (Pallipet): zero_vote_rows_require_review. Imported vote sum 96565; source-reported totals [96565].
- 1991, constituency 151 (Aravakurichi): zero_vote_rows_require_review. Imported vote sum 104232; source-reported totals [104232].
- 1996, constituency 118 (Modakkurichi): zero_vote_rows_require_review. Imported vote sum 117215; source-reported totals [117215].
- 2016, constituency 134 (Aravakurichi): inconsistent_reported_total. Imported vote sum 164582; source-reported totals [164582, 164583, 164584, 164585, 164586, 164587, 164588, 164589, 164590, 164591, 164592, 164593, 164594, 164595, 164596, 164597, 164598, 164599, 164600, 164601, 164602, 164603, 164604, 164605, 164606, 164607, 164608, 164609, 164610, 164611, 164612, 164613, 164614, 164615, 164616, 164617, 164618, 164619, 164620, 164621].
- 2016, constituency 174 (Thanjavur): inconsistent_reported_total. Imported vote sum 186444; source-reported totals [186444, 186445, 186446, 186447, 186448, 186449, 186450, 186451, 186452, 186453, 186454, 186455, 186456, 186457, 186458].

Zero-vote rows may be legitimate or source placeholders; they are retained for official review. Inconsistent source totals are not corrected without evidence. Computed percentages are suppressed for flagged constituencies.

## Verification performed

- Raw file checksums retained in the source manifest.
- All 234 constituency IDs present in each year; one source-derived winner per seat.
- Unique result IDs, nonnegative integer votes, no omitted or duplicated pagination rows.
- All 2021 constituency/vote row multisets agree between the two collected copies.
- 2026: 4,023 candidates and 234 NOTA rows; all component sums and reported constituency sums agree.
- ECI affidavit portal search shows 4,023 contesting candidates for 2026; first-seat leading vote totals match the official report excerpt.
- No complete official report reconciliation performed; official downloads returned 406/502.

## Source limitations

- All 234 constituency IDs are present for each target year, but this does not certify all candidate rows.
- Official ECI downloads returned HTTP 406/502 during collection; no complete official row audit was possible.
- 2026 is a results-page archive, not a certified Form-20 dataset.
- Historical party labels and name spellings follow source copies; parties and people are not merged across years.
- Tamil candidate/constituency names, district filters, turnout, affidavits, local-body and parliamentary elections are not part of this release.
- Zero-vote rows and inconsistent reported totals are retained and flagged.
- Secondary-copy agreement for 2021 and an official 2026 candidate-count check do not establish row-level official verification.
