const el=id=>document.getElementById(id);
let controller, serial=0;
const years=[2026,2021,2016,2011,2006,2001,1996,1991,1989,1984,1980,1977,1971,1967];
for(const year of years){const o=document.createElement('option');o.value=year;o.textContent=year;el('play-year').append(o);}
function update(){
 controller?.abort();serial++;el('play-form').querySelector('button').disabled=false;
 const type=el('play-endpoint').value, list=['constituencies','winners','losers'].includes(type), global=['coverage','elections'].includes(type), seat=type==='results';
 el('play-year').disabled=global; el('play-seat').disabled=!seat;el('seat-label').hidden=!seat;
 for(const name of ['query','page','limit']) {el(name+'-label').hidden=!list;el('play-'+name).disabled=!list;}
 let path='/api/v1/'+(global ? type : type==='results' ? 'results' : `elections/${el('play-year').value}/${type}`);
 const q=new URLSearchParams();if(seat){q.set('year',el('play-year').value);q.set('constituency_id',el('play-seat').value);}
 if(list){if(el('play-query').value.trim()) q.set('q',el('play-query').value.trim());q.set('page',el('play-page').value);q.set('limit',el('play-limit').value);}
 const url=location.origin+path+(q.size?'?'+q:'');el('request-url').href=url;el('request-url').textContent=url;
 el('play-js').textContent=`const response = await fetch(${JSON.stringify(url)});\nconst body = await response.json();\nif (!response.ok) throw new Error(body.error?.message || 'Request failed');\nconsole.log(body.data, body.pagination);`;
 el('play-python').textContent=`import requests\nresponse = requests.get(${JSON.stringify(url)}, timeout=20)\nresponse.raise_for_status()\nbody = response.json()\nprint(body['data'])`;
 el('play-status').textContent='Request ready. Press Run to fetch the current URL.';el('play-response').textContent='Press Run request to see JSON here.';
}
el('play-form').addEventListener('input',update);
el('play-form').addEventListener('submit',async e=>{e.preventDefault();controller?.abort();controller=new AbortController();const id=++serial;el('play-form').querySelector('button').disabled=true;el('play-status').textContent='Loading…';try{const r=await fetch(el('request-url').href,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});const b=await r.json();if(id!==serial)return;el('play-response').textContent=JSON.stringify(b,null,2);el('play-status').textContent=`HTTP ${r.status}${b.pagination ? ' · Page '+b.pagination.page+' of '+b.pagination.pages+' · '+b.pagination.total+' total rows' : ''}${r.ok ? '' : ' · '+(b.error?.message ?? 'Request failed')}`;}catch(error){if(id===serial)el('play-status').textContent='Request failed. Check your connection and run again.';}finally{if(id===serial)el('play-form').querySelector('button').disabled=false;}});update();
