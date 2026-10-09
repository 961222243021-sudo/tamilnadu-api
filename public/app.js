const $ = id => document.getElementById(id);
const apiBase = `${location.origin}/api/v1`;
$('base-url').textContent = apiBase;
let controller, requestId = 0, seats = [], yearsReady = false, retryAction;
const option = (text, value) => { const o = document.createElement('option'); o.textContent = text; o.value = value; return o; };
const format = value => Number.isFinite(value) ? value.toLocaleString('en-IN') : 'Under review';
function start(message) {
  controller?.abort(); controller = new AbortController();
  const task = { id: ++requestId, signal: controller.signal };
  $('status').textContent = message; $('status').className = '';
  $('retry').hidden = true; $('explorer').querySelector('button').disabled = true;
  $('results').replaceChildren(); $('summary').hidden = true;
  for (const id of ['json-link', 'csv-link', 'seat-csv-link']) $(id).hidden = true;
  $('explore').setAttribute('aria-busy', 'true');
  return task;
}
function finish(message) {
  $('status').textContent = message;
  $('explorer').querySelector('button').disabled = !seats.length || !$('constituency').value;
  $('explore').setAttribute('aria-busy', 'false');
}
function failed(error, task, retry) {
  if (task.id !== requestId) return;
  finish(error.message); $('status').className = 'error';
  retryAction = retry; $('retry').hidden = false;
}
async function get(path, task) {
  let response;
  try { response = await fetch(`${apiBase}${path}`, { signal: AbortSignal.any([task.signal, AbortSignal.timeout(20000)]) }); }
  catch (error) { if (task.signal.aborted) throw error; throw new Error('Could not reach the API. Check your connection and try again.'); }
  let body;
  try { body = await response.json(); } catch { throw new Error('The API returned an unexpected response. Please try again.'); }
  if (!response.ok) throw new Error(body.error?.message || `API error (${response.status}). Please try again.`);
  return body;
}
function fillSeats() {
  const previous = $('constituency').value;
  const q = $('seat-search').value.trim().toLowerCase();
  const matching = seats.filter(r => `${r.constituency_id} ${r.constituency_name}`.toLowerCase().includes(q));
  $('constituency').replaceChildren(...matching.map(r => option(`${r.constituency_id} · ${r.constituency_name}`, r.constituency_id)));
  if (matching.some(r => String(r.constituency_id) === previous)) $('constituency').value = previous;
  if (!matching.length) $('constituency').append(option('No matching constituency', ''));
  $('constituency').disabled = !matching.length;
  return matching.length;
}
async function loadConstituencies() {
  const year = $('year').value, task = start('Loading constituencies…');
  seats = []; $('constituency').disabled = true; $('seat-search').disabled = true; $('seat-search').value = '';
  $('constituency').replaceChildren(option('Loading constituencies…', ''));
  try {
    const { data } = await get(`/elections/${year}/constituencies?limit=500`, task);
    if (task.id !== requestId) return;
    seats = data; fillSeats(); $('seat-search').disabled = false;
    if (!seats.length) throw new Error('No constituencies are available for this year.');
    await showResults();
  } catch (error) { failed(error, task, loadConstituencies); }
}
async function showResults() {
  const year = $('year').value, seat = $('constituency').value;
  if (!seat) return;
  const task = start('Loading results…');
  try {
    const path = `/elections/${year}/constituencies/${seat}/results`;
    const { data } = await get(path, task);
    if (task.id !== requestId) return;
    const title = document.createElement('strong'); title.textContent = `${data.constituency_name} · ${year}`;
    const winner = document.createElement('p');
    winner.textContent = data.winner ? `${data.winner.candidate_name} (${data.winner.party}) won${Number.isFinite(data.winning_margin) ? ` by ${format(data.winning_margin)} votes` : '; margin under review'}.` : 'Winner requires review.';
    const detail = document.createElement('p'); detail.textContent = `${data.candidate_count} candidates · ${format(data.counted_vote_sum)} imported votes · ${format(data.nota_votes)} NOTA votes`;
    $('summary').replaceChildren(title, winner, detail);
    if (data.quality_flags.length) { const note = document.createElement('p'); note.textContent = `Source totals need review: ${data.quality_flags.join(', ')}. Computed percentages may be unavailable.`; $('summary').append(note); }
    $('summary').hidden = false;
    const rows = document.createDocumentFragment();
    for (const r of data.results) {
      const tr = document.createElement('tr'); if (r.status === 'won') tr.className = 'winner';
      for (const value of [r.rank ?? '—', r.candidate_name, r.party, format(r.votes), Number.isFinite(r.vote_share_pct) ? `${r.vote_share_pct.toFixed(2)}%` : 'Under review']) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      const td = document.createElement('td'), badge = document.createElement('span'); badge.className = `badge ${r.status}`; badge.textContent = r.status.toUpperCase(); td.append(badge); tr.append(td); rows.append(tr);
    }
    $('results').replaceChildren(rows);
    $('json-link').href = apiBase + path;
    $('csv-link').href = `${apiBase}/elections/${year}/export.csv`;
    $('seat-csv-link').href = `${apiBase}/elections/${year}/export.csv?constituency_id=${seat}`;
    for (const id of ['json-link', 'csv-link', 'seat-csv-link']) $(id).hidden = false;
    finish(`Showing ${data.results.length} result rows for ${data.constituency_name}, ${year}. Official row verification is pending.`);
  } catch (error) { failed(error, task, showResults); }
}
async function init() {
  const task = start('Loading election years…');
  try {
    const { data } = await get('/elections', task);
    if (task.id !== requestId) return;
    $('year').replaceChildren(...[...data].reverse().map(e => option(e.year, e.year)));
    $('year').disabled = false; yearsReady = true;
    await loadConstituencies();
  } catch (error) { failed(error, task, init); }
}
$('explorer').addEventListener('submit', e => { e.preventDefault(); if (yearsReady && seats.length) showResults(); });
$('year').addEventListener('change', loadConstituencies);
$('constituency').addEventListener('change', showResults);
$('seat-search').addEventListener('input', () => {
  const previous = $('constituency').value, count = fillSeats();
  if (!count) { start('No matching constituency. Try another name or number.'); finish('No matching constituency. Try another name or number.'); }
  else if (previous !== $('constituency').value || $('summary').hidden) showResults();
});
$('retry').addEventListener('click', () => retryAction?.());
$('copy-base').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(apiBase); $('copy-base').textContent = 'Copied!'; }
  catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents($('base-url')); selection.removeAllRanges(); selection.addRange(range); $('copy-base').textContent = 'URL selected'; }
  setTimeout(() => { $('copy-base').textContent = 'Copy'; }, 2000);
});
init();
