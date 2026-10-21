'use strict';
let events = [];
const $ = id => document.getElementById(id);
const approval = e => !e.approval ? 'unknown' : /^yes, approved\.?$/i.test(e.approval.trim()) ? 'approved' : 'pending';
function node(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
function render() {
  const query = $('search').value.toLowerCase().trim();
  const selected = events.filter(e => (!query || [e.title,e.location,e.organizer,e.type,e.grades].join(' ').toLowerCase().includes(query)) && (!$('month').value || e.date.startsWith($('month').value)) && (!$('origin').value || e.source === $('origin').value) && (!$('approval').value || approval(e) === $('approval').value) && (!$('flagged').checked || e.review));
  $('results').textContent = `${selected.length} event${selected.length === 1 ? '' : 's'}`;
  $('events').replaceChildren();
  for (const e of selected) {
    const card = node('article', undefined, 'event');
    const dateBox = node('div', undefined, 'date');
    if (e.date) { const d = new Date(`${e.date}T12:00:00`); dateBox.append(node('span', d.toLocaleDateString('en-US',{month:'short'})),node('strong',String(d.getDate())),node('small',String(d.getFullYear()))); }
    else dateBox.append(node('span','DATE'),node('strong','?'),node('small','To confirm'));
    const body = node('div',undefined,'event-body');
    body.append(node('div', e.type || 'School event', 'category'),node('h3',e.title));
    body.append(node('p',`${e.time || 'Time to confirm'} · ${e.location || 'Location to confirm'}`,'details'));
    body.append(node('p',`Organizer: ${e.organizer || 'Not assigned'}${e.grades ? ' · ' + e.grades : ''}`,'details'));
    const tags = node('div',undefined,'tags'); tags.append(node('span',e.source,'tag'));
    tags.append(node('span',e.approval || 'Approval not provided','tag ' + approval(e)));
    if (e.confirmation) tags.append(node('span',e.confirmation,'tag'));
    if (e.review) body.append(node('p',e.review,'warning'));
    body.append(tags); card.append(dateBox,body); $('events').append(card);
  }
  if (!selected.length) $('events').append(node('p','No matching events. Try changing your filters.','empty'));
}
for (const id of ['search','month','origin','approval','flagged']) $(id).addEventListener('input',render);
async function load() {
  try {
    const response = await fetch('/api/events'); if (!response.ok) throw new Error('Could not load the event calendar. Please reload or ask your administrator.');
    const data = await response.json(); events = data.events.sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));
    $('total').textContent = events.length; $('submitted').textContent = events.filter(e=>e.source==='New submissions').length; $('review').textContent = events.filter(e=>e.review).length;
    $('source').textContent = data.mode;
    for (const month of [...new Set(events.filter(e=>e.date).map(e=>e.date.slice(0,7)))].sort()) { const option=node('option',new Date(month+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})); option.value=month; $('month').append(option); }
    render();
  } catch (error) { $('source').textContent='Calendar unavailable'; $('error').hidden=false; $('error').textContent=error.message; }
}
load();
