import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, HEAD, OPTIONS, POST } from '../api/index.js';
const call = async path => {
  const response = GET(new Request(`https://example.vercel.app/api/v1${path}`));
  return { response, body:await response.json() };
};
test('all 14 years expose every constituency, one winner each, and provisional status', async () => {
  const {body}=await call('/elections');
  assert.equal(body.data.length,14);
  for(const e of body.data) {
    const {response,body:b}=await call(`/elections/${e.year}/winners?limit=500`);
    assert.equal(response.status,200);
    assert.equal(b.pagination.total,234);
    assert.equal(new Set(b.data.map(r=>r.constituency_id)).size,234);
    assert.equal(b.meta.official_row_verification,'pending');
    assert(b.data.every(r=>!r.is_nota && r.status==='won'));
  }
});
test('2026 candidate count, vote components, and first constituency agree with checked source',async()=>{
  const {body}=await call('/elections/2026');
  assert.equal(body.data.candidate_rows,4023);
  assert.equal(body.data.nota_rows,234);
  const {body:b}=await call('/elections/2026/constituencies/1/results');
  assert.equal(b.data.winner.votes,94320);
  assert.equal(b.data.winning_margin,27945);
  assert.equal(b.data.counted_vote_sum,232522);
  assert(b.data.results.every(r=>r.general_votes+r.postal_votes===r.votes));
});
test('pagination covers full results without omissions or duplicates',async()=>{
  const seen=new Set();let total;
  for(let page=1;page<=9;page++) {
    const {body}=await call(`/elections/2026/results?page=${page}&limit=500`);
    total=body.pagination.total;
    for(const r of body.data){assert(!seen.has(r.id));seen.add(r.id);}
  }
  assert.equal(seen.size,total);
});
test('NOTA is not counted as a candidate, a loser, or a winning seat',async()=>{
  const {body}=await call('/elections/2026/losers?limit=500');
  assert.equal(body.pagination.total,4023-234);
  assert(body.data.every(r=>!r.is_nota));
  const {body:b}=await call('/elections/2026/parties');
  assert.equal(b.data.reduce((s,r)=>s+r.seats_won,0),234);
  assert.equal(b.data.find(r=>r.is_nota).seats_contested,0);
});
test('ambiguous source totals suppress vote percentages and remain visible',async()=>{
  const {body}=await call('/elections/1967/constituencies/44/results');
  assert(body.data.quality_flags.includes('vote_sum_mismatch'));
  assert(body.data.results.every(r=>r.vote_share_pct===null));
});
test('ties retain equal competition rank without changing source-declared winner',async()=>{
  const {body}=await call('/elections/1996/results?constituency_id=1&limit=500');
  const rows=body.data.filter(r=>!r.is_nota);
  for (let i=1;i<rows.length;i++) if(rows[i].votes===rows[i-1].votes) assert.equal(rows[i].rank,rows[i-1].rank);
});
test('candidate search returns result records without asserting identity across years',async()=>{
  const {body}=await call('/candidates?year=2021&q=govindarajan');
  assert(body.pagination.total>0);
  assert(body.data.every(r=>r.year===2021));
  const record=body.data[0];
  const {body:b}=await call(`/records/${record.id}`);
  assert.deepEqual(b.data,record);
});
test('historical boundary comparison rejected; modern comparison works',async()=>{
  assert.equal((await call('/compare?from=2006&to=2021&constituency_id=1')).response.status,409);
  assert.equal((await call('/compare?from=2016&to=2021&constituency_id=1')).response.status,200);
});
test('invalid values, unknown queries, duplicate queries, and routes return errors',async()=>{
  for(const path of ['/elections/2025','/elections/2021/constituencies/235/results','/elections/2026/results?limit=501','/elections/2026/results?page=0','/elections/2026/results?status=winner','/elections/2026/results?district=Chennai','/elections/2026/results?page=1&page=2','/unknown']) {
    const {response,body}=await call(path);assert(response.status>=400);assert(body.error.message);
  }
});
test('Vercel rewrite query route and direct path produce identical data',async()=>{
  const direct=(await call('/elections/2026/winners?limit=2')).body;
  const rewritten=await GET(new Request('https://example.vercel.app/api/index?route=elections/2026/winners&limit=2')).json();
  assert.deepEqual(rewritten,direct);
});
test('CSV exports complete year and header flags verification',async()=>{
  const response=GET(new Request('https://example.vercel.app/api/v1/elections/2026/export.csv'));
  assert.equal(response.headers.get('X-Data-Verification'),'provisional');
  const text=await response.text();assert.equal(text.split('\r\n').length,4258);
  assert(text.includes('pending_official_row_verification'));
});
test('CORS preflight, HEAD, read-only enforcement, and coverage',async()=>{
  assert.equal(OPTIONS().status,204);
  assert.equal(OPTIONS().headers.get('Access-Control-Allow-Origin'),'*');
  assert.equal(await HEAD(new Request('https://example.vercel.app/api/v1/health')).text(),'');
  assert.equal(POST().status,405);
  const {body}=await call('/coverage');assert.equal(body.data.all_officially_verified,false);
});
