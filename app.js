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
const SHEETS_FEED = 'https://script.google.com/macros/s/AKfycbzjWJwtToxnpag2NZmisIbmSKx4UEynmT2O2WpL_8Stg3xj2HB7KwNfTjrpkb8VrI0m/exec';
let importedEvents = [];
let syncing = false;
let lastSynced = null;
function applyEventCorrections(event) {
  const corrected={...event};
  corrected.title=corrected.title.replace(/\bHON\s+(?:Support|Supprt)\b/gi,'Collegiate Collective');
  if(/\bCollegiate Collective\b/i.test(corrected.title)) {
    corrected.organizer='Mrs. Okoye and the Collective';
    corrected.location='Staff Entrance';
    corrected.time='1:00 PM – 1:45 PM';
  }
  if(/\bchampionship\s+days?\b/i.test(corrected.title)) {
    corrected.organizer="Ms. Stone, Mrs. Feliz and GLC's";
    corrected.time='2:07 PM – 3:40 PM';
  }
  return corrected;
}
function applyEvents(next) {
  events = next.map(applyEventCorrections).sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));
  $('total').textContent = events.length;
  $('submitted').textContent = events.filter(e=>e.source==='New submissions').length;
  $('review').textContent = events.filter(e=>e.review).length;
  const chosen=$('month').value;
  const months=[...new Set(events.filter(e=>e.date).map(e=>e.date.slice(0,7)).concat(chosen ? [chosen] : []))].sort();
  $('month').replaceChildren();const all=node('option','All months');all.value='';$('month').append(all);
  for(const month of months) {
    const option=node('option',new Date(month+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}));
    option.value=month;$('month').append(option);
  }
  $('month').value=chosen;
  render();
}
function readFeed(data) {
  if (!data || !Array.isArray(data.events)) throw new Error('Invalid events feed');
  const fields=['title','date','time','location','organizer','type','grades','audience','approval','confirmation','review'];
  return data.events.map((row,index)=>{
    if(!row || typeof row.title!=='string' || !row.title.trim()) throw new Error('Invalid event title');
    const event={};
    for(const field of fields) event[field]=typeof row[field]==='string' ? row[field].trim() : '';
    if(event.date) {
      const parsed=new Date(event.date+'T12:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==event.date) {
        event.date='';event.review='Date needs review';
      }
    }
    if(!event.date && !event.review) event.review='Date needs review';
    event.source='New submissions';event.source_row=index+2;
    return event;
  });
}
function mergeLiveEvents(fresh) {
  const older=importedEvents.filter(e=>e.source!=='New submissions').map(e=>({...e}));
  const normalize=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  for(const event of fresh) {
    const title=normalize(event.title);
    if(!title || !event.date) continue;
    for(const old of older) {
      const oldTitle=normalize(old.title);
      if(old.date!==event.date || !oldTitle || !(title.includes(oldTitle) || oldTitle.includes(title))) continue;
      for(const candidate of [event,old]) if(!candidate.review.includes('Possible duplicate')) candidate.review=[candidate.review,'Possible duplicate; review before merging'].filter(Boolean).join('; ');
    }
  }
  return older.concat(fresh);
}
async function refreshImportedEvents() {
  const response=await fetch('/api/events', {cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error('Could not refresh imported events');
  const data=await response.json();
  if(!data || !Array.isArray(data.events)) throw new Error('Invalid imported events');
  importedEvents=data.events;
}
async function syncSheets(refreshImports=true) {
  if(syncing) return;
  syncing=true;$('refresh-events').disabled=true;
  $('source').textContent='Checking Google Sheets…';
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
  let importsRefreshed=!refreshImports;
  try {
    if(refreshImports) {
      try {
        await refreshImportedEvents();importsRefreshed=true;
        const submissions=lastSynced ? events.filter(e=>e.source==='New submissions') : importedEvents.filter(e=>e.source==='New submissions');
        applyEvents(importedEvents.filter(e=>e.source!=='New submissions').concat(submissions));
      } catch(error) { /* Keep the previous imported events if this request fails. */ }
    }
    const response=await fetch(SHEETS_FEED,{signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'follow'});
    if(!response.ok) throw new Error('Sheet request failed');
    const fresh=readFeed(await response.json());
    applyEvents(mergeLiveEvents(fresh));lastSynced=new Date();
    $('source').textContent='Google Sheets synced at '+lastSynced.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    $('sync-status').textContent=importsRefreshed ? 'Calendar refreshed. Automatic updates run every 5 minutes while this page is open.' : 'Google submissions updated, but the imported calendar could not be refreshed. Showing its previous version; refresh will retry.';
  } catch(error) {
    $('source').textContent='Google Sheets connection unavailable';
    $('sync-status').textContent=lastSynced ? 'Showing the last successful update from '+lastSynced.toLocaleString()+'. Automatic refresh will retry; you can also select Refresh now.' : 'Showing uploaded spreadsheet snapshots. Live Google Sheets updates could not be loaded. Automatic refresh will retry; you can also select Refresh now.';
  } finally {
    clearTimeout(timer);syncing=false;$('refresh-events').disabled=false;
  }
}
$('refresh-events').addEventListener('click',()=>syncSheets());
async function load() {
  try {
    await refreshImportedEvents();
    applyEvents(importedEvents);
    await syncSheets(false);
    setInterval(syncSheets,5*60*1000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden && (!lastSynced || Date.now()-lastSynced.getTime()>=5*60*1000)) syncSheets();
    });
  } catch (error) { $('source').textContent='Calendar unavailable'; $('error').hidden=false; $('error').textContent=error.message; }
}
load();
