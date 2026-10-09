/* Shared DOM rendering: imported names are always text, never HTML. */
window.TNResults = {
  chart(target, data) {
    target.replaceChildren();
    const heading = document.createElement('h3'); heading.textContent = 'Votes at a glance'; target.append(heading);
    const note = document.createElement('p'); note.textContent = 'Top five candidates by imported vote count, plus NOTA when present. Bar lengths are relative to the highest vote count.'; target.append(note);
    const candidates = data.results.filter(r => !r.is_nota).sort((a,b) => b.votes-a.votes).slice(0,5);
    const rows = [...candidates, ...data.results.filter(r => r.is_nota)];
    const max = Math.max(1, ...rows.map(r => r.votes));
    for (const row of rows) {
      const wrap = document.createElement('div'); wrap.className = 'vote-row';
      const label = document.createElement('p'); label.textContent = `${row.candidate_name} · ${row.party} · ${row.votes.toLocaleString('en-IN')} votes`;
      const track = document.createElement('div'); track.className = 'vote-track'; track.setAttribute('aria-hidden','true');
      const bar = document.createElement('div'); bar.className = row.status === 'won' ? 'vote-bar elected' : 'vote-bar'; bar.style.width = `${row.votes/max*100}%`; track.append(bar); wrap.append(label,track); target.append(wrap);
    }
  },
  verification(target, data) {
    target.replaceChildren();
    const title = document.createElement('summary'); title.textContent = data.quality_flags.length ? 'Source inconsistencies flagged · review details' : 'Imported archive · official row verification pending';
    const text = document.createElement('p'); text.textContent = 'These results are imported from the collected sources. A complete candidate-by-candidate check against official reports is pending. A winner label describes the imported election result.';
    const link = document.createElement('a'); link.href = '/api/v1/coverage'; link.textContent = 'Open the coverage audit';
    target.append(title,text,link);
    const list = document.createElement('ul');
    for (const id of [...new Set(data.results.map(r => r.source_id))]) { const li = document.createElement('li'); li.textContent = `Source: ${id}. Each JSON record includes source_row and verification_status.`; list.append(li); }
    for (const flag of data.quality_flags) { const li = document.createElement('li'); li.textContent = flag; list.append(li); }
    target.append(list);
  }
};
