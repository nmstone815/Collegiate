'use strict';
let events = [];
let view = 'list';
let calendarMonth = '';
const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
function calendarDays(month) {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(year, number-1, 1, 12);
  const count = new Date(year, number, 0, 12).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let day=1; day<=count; day++) cells.push(`${month}-${String(day).padStart(2,'0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
function showView(next) {
  view = next;
  if (!calendarMonth) calendarMonth = $('month').value || monthKey(new Date());
  render();
}
function moveMonth(step) {
  const [year, month] = calendarMonth.split('-').map(Number);
  calendarMonth = monthKey(new Date(year,month-1+step,1,12));
  if (![...$('month').options].some(o=>o.value===calendarMonth)) {
    const option=node('option',new Date(calendarMonth+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}));
    option.value=calendarMonth; $('month').append(option);
  }
  $('month').value=calendarMonth;
  render();
}
function renderCalendar(selected) {
  const target=$('calendar'); target.replaceChildren();
  const monthName=new Date(calendarMonth+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
  $('calendar-title').textContent=monthName;
  const scroller=node('div',undefined,'calendar-scroll');
  const table=node('table',undefined,'calendar-table');
  table.setAttribute('aria-label',monthName+' events');
  const head=node('thead'); const headings=node('tr');
  for (const day of ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']) {const th=node('th',day);th.setAttribute('scope','col');headings.append(th);}
  head.append(headings);table.append(head);
  const body=node('tbody'); const days=calendarDays(calendarMonth); let row;
  const today=monthKey(new Date())+'-'+String(new Date().getDate()).padStart(2,'0');
  for (let i=0; i<days.length; i++) {
    if(i%7===0){row=node('tr');body.append(row);}
    const stamp=days[i]; const cell=node('td',undefined,stamp ? 'calendar-day' : 'calendar-blank');row.append(cell);
    if(!stamp) continue;
    const label=node('time',String(Number(stamp.slice(-2))),'day-number');label.setAttribute('datetime',stamp);
    if(stamp===today){label.classList.add('today');label.setAttribute('aria-label','Today, '+stamp);}cell.append(label);
    for(const e of selected.filter(e=>e.date===stamp)) {
      const detail=node('details',undefined,'calendar-event '+approval(e));
      const summary=node('summary',e.title);detail.append(summary);
      detail.append(node('p',e.time || 'Time to confirm'),node('p',e.location || 'Location to confirm'),node('p','Organizer: '+(e.organizer || 'Not assigned')));
      if(e.grades) detail.append(node('p',e.grades));
      detail.append(node('p',e.approval || 'Approval not provided'),node('p',e.source));
      if(e.confirmation) detail.append(node('p',e.confirmation));
      if(e.review) detail.append(node('p',e.review,'warning'));
      cell.append(detail);
    }
  }
  table.append(body);scroller.append(table);target.append(scroller);
}
const $ = id => document.getElementById(id);
const approval = e => !e.approval ? 'unknown' : /^yes, approved\.?$/i.test(e.approval.trim()) ? 'approved' : 'pending';
function node(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
function render() {
  const query = $('search').value.toLowerCase().trim();
  const selected = events.filter(e => (!query || [e.title,e.location,e.organizer,e.type,e.grades].join(' ').toLowerCase().includes(query)) && (!$('month').value || e.date.startsWith($('month').value) || (view==='calendar' && !e.date)) && (!$('origin').value || e.source === $('origin').value) && (!$('approval').value || approval(e) === $('approval').value) && (!$('flagged').checked || e.review));
  $('list-view').setAttribute('aria-pressed',String(view==='list'));
  $('calendar-view').setAttribute('aria-pressed',String(view==='calendar'));
  for(const id of ['calendar','calendar-nav','calendar-help']) $(id).hidden=view!=='calendar';
  const dated=selected.filter(e=>e.date.startsWith(calendarMonth) && e.date);
  const undated=selected.filter(e=>!e.date);
  const displayed=view==='calendar' ? dated.concat(undated) : selected;
  $('results').textContent = view==='calendar' ? `${dated.length} events this month · ${undated.length} without a date` : `${selected.length} event${selected.length === 1 ? '' : 's'}`;
  if(view==='calendar') renderCalendar(dated);
  $('events').hidden=view==='calendar' && !undated.length;
  const listEvents=view==='calendar' ? undated : displayed;
  $('events').replaceChildren();
  if(view==='calendar' && undated.length) $('events').append(node('h3','Date to confirm'));
  for (const e of listEvents) {
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
  if (view==='list' && !selected.length) $('events').append(node('p','No matching events. Try changing your filters.','empty'));
}
for (const id of ['search','month','origin','approval','flagged']) $(id).addEventListener('input',()=>{
  if($('month').value) calendarMonth=$('month').value;
  render();
});
$('list-view').addEventListener('click',()=>showView('list'));
$('calendar-view').addEventListener('click',()=>showView('calendar'));
$('prev-month').addEventListener('click',()=>moveMonth(-1));
$('next-month').addEventListener('click',()=>moveMonth(1));
async function load() {
  try {
    const response = await fetch('./events.json'); if (!response.ok) throw new Error('Could not load the event calendar. Please reload or ask your administrator.');
    const data = await response.json(); events = data.events.sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));
    $('total').textContent = events.length; $('submitted').textContent = events.filter(e=>e.source==='New submissions').length; $('review').textContent = events.filter(e=>e.review).length;
    $('source').textContent = data.mode;
    for (const month of [...new Set(events.filter(e=>e.date).map(e=>e.date.slice(0,7)))].sort()) { const option=node('option',new Date(month+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})); option.value=month; $('month').append(option); }
    render();
  } catch (error) { $('source').textContent='Calendar unavailable'; $('error').hidden=false; $('error').textContent=error.message; }
}
load();
