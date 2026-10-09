const $ = id => document.getElementById(id);
const apiBase = `${location.origin}/api/v1`;
$('base-url').textContent=apiBase;
let loading=false;
async function get(path){const r=await fetch(`${apiBase}${path}`);const b=await r.json();if(!r.ok)throw new Error(b.error?.message||'Unable to load data.');return b;}
const option=(text,value)=>{const o=document.createElement('option');o.textContent=text;o.value=value;return o;};
function busy(on,message){loading=on;$('status').textContent=message;$('explorer').querySelector('button').disabled=on;}
async function loadConstituencies(){
  busy(true,'Loading constituencies…');
  try{
    const {data}=await get(`/elections/${$('year').value}/constituencies?limit=500`);
    $('constituency').replaceChildren(...data.map(r=>option(`${r.constituency_id} · ${r.constituency_name}`,r.constituency_id)));
    await showResults();
  }catch(e){busy(false,e.message);}
}
async function showResults(){
  const year=$('year').value,c=$('constituency').value;
  busy(true,'Loading results…');$('results').replaceChildren();$('summary').hidden=true;
  try{
    const path=`/elections/${year}/constituencies/${c}/results`;
    const {data}=await get(path);
    const title=document.createElement('strong');title.textContent=`${data.constituency_name} · ${year}`;
    const winner=document.createElement('p');winner.textContent=data.winner?`${data.winner.candidate_name} won by ${data.winning_margin.toLocaleString('en-IN')} votes.`:'Winner requires review.';
    const detail=document.createElement('p');detail.textContent=`${data.candidate_count} candidates · ${data.counted_vote_sum.toLocaleString('en-IN')} counted votes${data.quality_flags.length?' · Quality flags: '+data.quality_flags.join(', '):''}`;
    $('summary').replaceChildren(title,winner,detail);$('summary').hidden=false;
    for(const r of data.results){
      const tr=document.createElement('tr');if(r.status==='won')tr.className='winner';
      for(const value of [r.rank??'—',r.candidate_name,r.party,r.votes.toLocaleString('en-IN'),r.vote_share_pct===null?'Under review':r.vote_share_pct.toFixed(2)+'%']){const td=document.createElement('td');td.textContent=value;tr.append(td);}
      const td=document.createElement('td'),badge=document.createElement('span');badge.className=`badge ${r.status}`;badge.textContent=r.status.toUpperCase();td.append(badge);tr.append(td);$('results').append(tr);
    }
    $('json-link').href=apiBase+path;$('csv-link').href=`${apiBase}/elections/${year}/export.csv`;
    busy(false,'Collected source data · official row verification pending.');
  }catch(e){busy(false,e.message);}
}
$('explorer').addEventListener('submit',e=>{e.preventDefault();if(!loading)showResults();});
$('year').addEventListener('change',loadConstituencies);
$('copy-base').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(apiBase);$('copy-base').textContent='Copied';}catch{$('copy-base').textContent='Select URL to copy';}});
(async()=>{try{const {data}=await get('/elections');$('year').replaceChildren(...[...data].reverse().map(e=>option(e.year,e.year)));await loadConstituencies();}catch(e){busy(false,e.message);}})();
