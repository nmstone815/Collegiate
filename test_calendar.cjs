const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const site=process.env.TEST_SITE_DIR || '.';
const {JSDOM}=require('jsdom');
(async()=>{
 const dom=new JSDOM(fs.readFileSync(path.join(site,'index.html'),'utf8'),{runScripts:'outside-only',url:'http://localhost/'});
 const w=dom.window;const d=w.document;
 w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('docs/events.json','utf8'))});
 w.eval(fs.readFileSync(path.join(site,'app.js'),'utf8')+'\nwindow.testCalendarDays = calendarDays;');
 await new Promise(resolve=>setImmediate(resolve));
 const change=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('input'));};
 assert.equal(d.querySelectorAll('#events article').length,111);
 change('month','2026-11');d.getElementById('calendar-view').click();
 assert.equal(d.getElementById('calendar').hidden,false);
 assert.equal(d.getElementById('calendar-view').getAttribute('aria-pressed'),'true');
 assert.equal(d.querySelectorAll('.calendar-day').length,30);
 assert.equal(d.querySelector('.calendar-day time').getAttribute('datetime'),'2026-11-01');
 assert.equal(d.querySelector('.calendar-day').cellIndex,0); // Sunday
 assert.equal(d.querySelectorAll('#events article').length,3); // undated retained
 let friends=[...d.querySelectorAll('.calendar-event')].filter(e=>e.textContent.includes('Friendsgiving'));
 assert.equal(friends.length,2);assert.ok(friends.every(e=>e.textContent.includes('Organizer:')));
 change('origin','New submissions');
 assert.equal(d.querySelectorAll('#events article').length,0);
 assert.equal([...d.querySelectorAll('.calendar-event')].filter(e=>e.textContent.includes('Friendsgiving')).length,1);
 change('search','juice');assert.equal(d.querySelectorAll('.calendar-event').length,1);
 d.getElementById('list-view').click();assert.equal(d.querySelectorAll('#events article').length,1);
 assert.equal(d.getElementById('calendar').hidden,true);
 change('search','');change('origin','');change('month','2026-12');d.getElementById('calendar-view').click();
 d.getElementById('next-month').click();assert.equal(d.getElementById('calendar-title').textContent,'January 2027');
 d.getElementById('prev-month').click();assert.equal(d.getElementById('calendar-title').textContent,'December 2026');
 assert.equal(w.testCalendarDays('2028-02').filter(Boolean).length,29);
 assert.equal(w.testCalendarDays('2027-02').filter(Boolean).length,28);
 assert.equal(w.testCalendarDays('2026-08').indexOf('2026-08-01'),6);
 console.log('PASS: list/calendar toggle, weekday alignment, leap years, month navigation, shared filters, event details, and undated events.');
 w.close();
})().catch(e=>{console.error(e);process.exit(1)});
