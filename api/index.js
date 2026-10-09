import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const root = new URL('../data/normalized/', import.meta.url);
const read = name => {
  const bytes=readFileSync(new URL(name,root));
  return JSON.parse((name.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
};
const coverage = read('coverage.json');
const sources = read('sources.json');
const years = coverage.elections.map(e => e.year);
// Read-only release data, reused within a warm process. No mutable user state.
const datasets = Object.fromEntries(years.map(y => [y, read(`${y}.json.gz`)]));
const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'X-Content-Type-Options': 'nosniff',
  'X-Dataset-Version': coverage.dataset_version,
  'X-Data-Verification': 'provisional',
};
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ApiError(status, message); };
const meta = () => ({ dataset_version: coverage.dataset_version, release_status: 'provisional', official_row_verification: 'pending' });
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=3600' : 'no-store', ...extra },
});
function integer(value, name, min, max) {
  if (!/^\d+$/.test(String(value))) fail(400, `${name} must be an integer.`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) fail(400, `${name} must be between ${min} and ${max}.`);
  return n;
}
function yearOf(value) {
  const y = integer(value, 'year', 1967, 2026);
  if (!years.includes(y)) fail(404, `Election ${y} is not in this release. See /api/v1/elections.`);
  return y;
}
function checkQuery(q, allowed) {
  for (const key of q.keys()) {
    if (key === 'route') continue;
    if (!allowed.includes(key)) fail(400, `Unknown query parameter: ${key}`);
    if (q.getAll(key).length !== 1) fail(400, `Provide ${key} only once.`);
    if (q.get(key).length > 160) fail(400, `${key} is too long.`);
  }
}
function paging(rows, q) {
  const page = integer(q.get('page') ?? '1', 'page', 1, 100000);
  const limit = integer(q.get('limit') ?? '50', 'limit', 1, 500);
  return { data: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) }, meta: meta() };
}
const low = s => String(s).toLowerCase();
function filter(rows, q) {
  const search = q.get('q');
  const party = q.get('party');
  const status = q.get('status');
  if (status && !['won', 'lost', 'nota', 'unresolved'].includes(status)) fail(400, 'status must be won, lost, nota, or unresolved.');
  if (search) rows = rows.filter(r => [r.candidate_name, r.constituency_name, r.party].some(v => low(v).includes(low(search))));
  if (party) rows = rows.filter(r => low(r.party) === low(party));
  if (status) rows = rows.filter(r => r.status === status);
  if (q.has('constituency_id')) {
    const c = integer(q.get('constituency_id'), 'constituency_id', 1, 234);
    rows = rows.filter(r => r.constituency_id === c);
  }
  return rows;
}
function resultSummary(rows) {
  const winner = rows.find(r => r.status === 'won');
  const candidates = rows.filter(r => !r.is_nota).sort((a,b) => b.votes-a.votes);
  const runner = candidates.find(r => r.id !== winner?.id);
  const flags = [...new Set(rows.flatMap(r => r.quality_flags))];
  return { constituency_id: rows[0].constituency_id, constituency_name: rows[0].constituency_name, year: rows[0].year,
    candidate_count: candidates.length, winner: winner ?? null, runner_up: runner ?? null,
    winning_margin: winner && runner ? winner.votes - runner.votes : null,
    counted_vote_sum: rows.reduce((s,r) => s+r.votes,0), nota_votes: rows.filter(r => r.is_nota).reduce((s,r) => s+r.votes,0),
    quality_flags: flags, official_row_verification: 'pending' };
}
function constituencies(rows) {
  const groups = Map.groupBy(rows, r => r.constituency_id);
  return [...groups.values()].map(resultSummary).map(({ winner, runner_up, ...r }) => ({ ...r,
    winner: winner ? { candidate_name: winner.candidate_name, party: winner.party, votes: winner.votes } : null,
    runner_up: runner_up ? { candidate_name: runner_up.candidate_name, party: runner_up.party, votes: runner_up.votes } : null,
  }));
}
function parties(rows) {
  const sum = rows.reduce((s,r) => s+r.votes,0);
  const clean = rows.every(r => !r.quality_flags.length);
  return [...Map.groupBy(rows, r => r.party).entries()].map(([party, rr]) => ({ party,
    is_nota: rr.every(r => r.is_nota), candidate_count: rr.filter(r => !r.is_nota).length,
    seats_contested: new Set(rr.filter(r => !r.is_nota).map(r => r.constituency_id)).size,
    seats_won: rr.filter(r => r.status === 'won').length,
    votes: rr.reduce((s,r) => s+r.votes,0),
    vote_share_pct: clean ? Math.round(rr.reduce((s,r) => s+r.votes,0)/sum*1000000)/10000 : null,
    vote_share_basis: clean ? 'computed_candidate_votes_plus_nota' : null,
  })).sort((a,b) => b.seats_won-a.seats_won || b.votes-a.votes);
}
function csv(rows, y) {
  const columns = ['id','year','constituency_id','constituency_name','candidate_name','party','votes','general_votes','postal_votes','rank','status','is_nota','vote_share_pct','verification_status','source_id','source_row','quality_flags'];
  const cell = v => {
    let s = Array.isArray(v) ? v.join(';') : String(v ?? '');
    // Keep spreadsheet applications from evaluating imported text as formulas.
    if (/^[=+@\-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"','""') + '"';
  };
  const text = [columns.join(','), ...rows.map(r => columns.map(c => cell(r[c])).join(','))].join('\r\n');
  return new Response(text, { headers: { ...baseHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="tamilnadu-assembly-${y}.csv"`, 'Cache-Control':'public, max-age=60, s-maxage=3600' } });
}
export function GET(request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams;
    // Earlier deployments used :path*. Vercel forwards that captured parameter
    // alongside route; discard it only when it matches the actual routed path.
    const publicRoute = url.pathname.startsWith('/api/v1/') ? url.pathname.slice(8) : null;
    if (q.getAll('path').length === 1 && q.get('path') === (publicRoute ?? q.get('route'))) q.delete('path');
    const route = url.pathname.startsWith('/api/v1') ? url.pathname.slice('/api/v1'.length) : '/' + (q.get('route') ?? '');
    const parts = route.split('/').filter(Boolean);
    if (!parts.length) {
      checkQuery(q, []);
      const base = `${url.origin}/api/v1`;
      return json({ name:'Tamilnadu API', creator:'Shyam', version:'v1', scope:coverage.scope,
        endpoints:['health','coverage','sources','elections','results','candidates','compare'], docs:'/docs', guide:'/guide', openapi:'/openapi.json',
        examples:{ elections:`${base}/elections`, constituencies:`${base}/elections/2026/constituencies?limit=500`,
          seat_results:`${base}/results?year=2026&constituency_id=13`, all_winners:`${base}/elections/2026/winners?limit=500`,
          full_year_csv:`${base}/elections/2026/export.csv` }, meta:meta() });
    }
    if (parts.length === 1 && ['health','coverage','sources'].includes(parts[0])) {
      checkQuery(q, []);
      return json(parts[0] === 'health' ? { status:'ok', elections:years.length, result_rows:coverage.total_result_rows, meta:meta() } : { data:parts[0] === 'coverage' ? coverage : sources, meta:meta() });
    }
    if (parts[0] === 'results' && parts.length === 1) {
      checkQuery(q, ['year','constituency_id']);
      if (!q.has('year') || !q.has('constituency_id')) fail(400, 'Provide year and constituency_id. Example: /api/v1/results?year=2026&constituency_id=13');
      const y = yearOf(q.get('year'));
      const c = integer(q.get('constituency_id'), 'constituency_id', 1, 234);
      const selected = datasets[y].filter(r => r.constituency_id === c);
      return json({ data:{ ...resultSummary(selected), results:selected }, meta:meta() });
    }
    if (parts[0] === 'candidates' && parts.length === 1) {
      checkQuery(q, ['year','q','party','status','constituency_id','page','limit']);
      const rows = q.has('year') ? datasets[yearOf(q.get('year'))] : years.flatMap(y => datasets[y]);
      return json(paging(filter(rows,q),q));
    }
    if (parts[0] === 'records' && parts.length === 2) {
      checkQuery(q, []);
      const match = /^tn-assembly-(\d{4})-(\d+)-(\d+)$/.exec(parts[1]);
      if (!match) fail(404, 'Result record not found.');
      const row = datasets[yearOf(match[1])].find(r => r.id === parts[1]);
      if (!row) fail(404, 'Result record not found.');
      return json({ data:row, meta:meta() });
    }
    if (parts[0] === 'compare' && parts.length === 1) {
      checkQuery(q,['from','to','constituency_id']);
      const from = yearOf(q.get('from')), to = yearOf(q.get('to'));
      const c = integer(q.get('constituency_id'),'constituency_id',1,234);
      if (from === to) fail(400,'Choose two different election years.');
      if (from < 2011 || to < 2011) fail(409,'Historical boundaries and IDs changed. Automated constituency comparison is supported only for 2011 onward.');
      const a = resultSummary(datasets[from].filter(r => r.constituency_id === c));
      const b = resultSummary(datasets[to].filter(r => r.constituency_id === c));
      return json({ data:{ from:a, to:b, winning_party_label_changed:a.winner?.party !== b.winner?.party, counted_vote_sum_change:b.counted_vote_sum-a.counted_vote_sum, note:'Party labels follow each source. Label changes do not necessarily mean a different party. This compares election results, not current officeholders.' }, meta:meta() });
    }
    if (parts[0] !== 'elections') fail(404,'Endpoint not found. See /docs.');
    if (parts.length === 1) {
      checkQuery(q,[]);
      return json({ data:coverage.elections.map(({issues,...e}) => e), meta:meta() });
    }
    const y = yearOf(parts[1]), rows = datasets[y];
    if (parts.length === 2) {
      checkQuery(q,[]);
      return json({ data:{ ...coverage.elections.find(e => e.year === y), parties:parties(rows) }, meta:meta() });
    }
    if (parts.length === 3 && ['results','winners','losers','export.csv'].includes(parts[2])) {
      checkQuery(q,parts[2] === 'export.csv' ? ['q','party','status','constituency_id'] : ['q','party','status','constituency_id','page','limit']);
      let selected = filter(rows,q);
      if (parts[2] === 'winners') selected = selected.filter(r => r.status === 'won');
      if (parts[2] === 'losers') selected = selected.filter(r => r.status === 'lost');
      return parts[2] === 'export.csv' ? csv(selected,y) : json(paging(selected,q));
    }
    if (parts.length === 3 && parts[2] === 'parties') {
      checkQuery(q,[]);
      return json({ data:parties(rows), meta:meta() });
    }
    if (parts.length === 3 && parts[2] === 'constituencies') {
      checkQuery(q,['q','page','limit']);
      let selected = constituencies(rows);
      if (q.get('q')) selected = selected.filter(r => low(r.constituency_name).includes(low(q.get('q'))));
      return json(paging(selected,q));
    }
    if (parts.length === 5 && parts[2] === 'constituencies' && parts[4] === 'results') {
      checkQuery(q,[]);
      const c = integer(parts[3],'constituency_id',1,234);
      const selected = rows.filter(r => r.constituency_id === c);
      return json({ data:{ ...resultSummary(selected), results:selected }, meta:meta() });
    }
    fail(404,'Endpoint not found. See /docs.');
  } catch (error) {
    if (!(error instanceof ApiError)) console.error('Tamilnadu API request failed', error);
    return json({ error:{ message:error instanceof ApiError ? error.message : 'Internal server error.' }, meta:meta() }, error.status ?? 500);
  }
}
export function OPTIONS() { return new Response(null,{status:204,headers:baseHeaders}); }
export function HEAD(request) { const response=GET(request); return new Response(null,{status:response.status,headers:response.headers}); }
const rejected = () => json({error:{message:'Read-only API. Use GET, HEAD, or OPTIONS.'}},405,{Allow:'GET, HEAD, OPTIONS'});
export const POST=rejected, PUT=rejected, PATCH=rejected, DELETE=rejected;
