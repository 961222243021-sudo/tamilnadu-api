import { readFileSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const root = new URL('../',import.meta.url);
const coverage=JSON.parse(readFileSync(new URL('data/normalized/coverage.json',root)));
let total=0;
for (const e of coverage.elections) {
  const jsonPath=new URL(`data/normalized/${e.year}.json`,root);
  const rows=JSON.parse(existsSync(jsonPath) ? readFileSync(jsonPath) : gunzipSync(readFileSync(new URL(`data/normalized/${e.year}.json.gz`,root))));
  assert.equal(rows.length,e.result_rows);
  assert.equal(new Set(rows.map(r => r.constituency_id)).size,234);
  assert.equal(rows.filter(r => r.status==='won').length,234);
  assert.equal(new Set(rows.map(r => r.id)).size,rows.length);
  assert(rows.every(r => Number.isInteger(r.votes) && r.votes>=0));
  assert(rows.every(r => r.verification_status==='pending_official_row_verification'));
  writeFileSync(new URL(`data/normalized/${e.year}.json.gz`,root),gzipSync(JSON.stringify(rows),{level:9}));
  total+=rows.length;
}
assert.equal(total,coverage.total_result_rows);
assert.equal(coverage.all_officially_verified,false);
copyFileSync(new URL('data/normalized/coverage.json',root),new URL('public/coverage.json',root));
console.log(`Validated ${coverage.elections.length} election files, ${total} rows, 234 constituency IDs each. Official verification remains pending.`);
