const match = /^\/read\/(\d{4})\/(\d{1,3})\/?$/.exec(location.pathname);
const status = document.getElementById('read-status');
async function load() {
  if (!match) { status.textContent = 'Choose a result from the explorer to open a readable page.'; return; }
  const [ , year, seat ] = match;
  try {
    const url = `/api/v1/results?year=${year}&constituency_id=${seat}`;
    const response = await fetch(url,{signal:AbortSignal.timeout(20000)}), body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || `HTTP ${response.status}`);
    const data = body.data;
    document.title = `${data.constituency_name} ${year} · Tamilnadu API`;
    document.getElementById('read-title').textContent = `${data.constituency_name_tamil ? data.constituency_name_tamil+' · ' : ''}${data.constituency_name} · ${year}`;
    status.textContent = data.winner ? `${data.winner.candidate_name} (${data.winner.party}) won. Margin: ${data.winning_margin === null ? 'under review' : data.winning_margin.toLocaleString('en-IN')+' votes'}.` : 'Winner requires review.';
    document.getElementById('read-detail').textContent = `${data.candidate_count} candidates · ${data.counted_vote_sum.toLocaleString('en-IN')} imported votes · ${data.nota_votes.toLocaleString('en-IN')} NOTA votes${data.district_name ? ' · Source district: '+data.district_name : ''}`;
    TNResults.chart(document.getElementById('vote-chart'),data); TNResults.verification(document.getElementById('verification'),data);
    for (const r of data.results) {
      const tr = document.createElement('tr');
      for (const value of [r.rank ?? '—',r.candidate_name,r.party,r.votes.toLocaleString('en-IN'),r.vote_share_pct === null ? 'Under review' : r.vote_share_pct.toFixed(2)+'%',r.status.toUpperCase()]) { const td=document.createElement('td');td.textContent=value;tr.append(td); }
      document.getElementById('read-results').append(tr);
    }
    document.getElementById('read-json').href = url;
    document.getElementById('read-csv').href = `/api/v1/elections/${year}/export.csv?constituency_id=${seat}`;
    document.getElementById('read-actions').hidden = false;
  } catch(error) { status.textContent = `Could not load this result: ${error.message}`; document.getElementById('read-retry').hidden=false; }
}
document.getElementById('read-retry').onclick=()=>location.reload(); load();
