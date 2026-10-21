const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
(async()=>{
 const snapshot=JSON.parse(fs.readFileSync('docs/events.json','utf8'));
 const initial=snapshot.events.filter(e=>e.source==='New submissions');
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',url:'http://localhost/'});
 const w=dom.window;const d=w.document;let payload={events:initial};let fail=false;let liveCalls=0;let intervals=[];
 w.setInterval=(callback,ms)=>{intervals.push({callback,ms});return 1;};
 w.fetch=async url=>{
   if(!url.startsWith('https:')) return {ok:true,json:async()=>snapshot};
   liveCalls++;if(fail) throw new Error('offline');
   return {ok:true,json:async()=>payload};
 };
 w.eval(fs.readFileSync('app.js','utf8')+'\nwindow.testSync=syncSheets;');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(liveCalls,1);assert.equal(intervals[0].ms,300000);
 assert.match(d.getElementById('source').textContent,/synced at/);
 assert.equal(d.querySelectorAll('#events article').length,111);
 // Change the feed: updates and deletions replace the submission snapshot.
 const changed={...initial[0],title:'Updated live event',email:'do-not-export@example.test',notes:'PRIVATE TEST NOTE'};
 payload={events:[changed]};
 await w.testSync();
 assert.equal(d.querySelectorAll('#events article').length,104);
 assert.match(d.getElementById('events').textContent,/Updated live event/);
 assert.ok(!d.body.textContent.includes('PRIVATE TEST NOTE'));
 assert.ok(!d.body.textContent.includes('do-not-export@example.test'));
 assert.equal(d.getElementById('submitted').textContent,'1');
 fail=true;await w.testSync();
 assert.equal(d.querySelectorAll('#events article').length,104);
 assert.match(d.getElementById('sync-status').textContent,/last successful update/);
 fail=false;payload={events:[]};await w.testSync();
 assert.equal(d.querySelectorAll('#events article').length,103);
 payload={events:[{...changed,date:'2026-02-30'}]};await w.testSync();
 assert.match(d.getElementById('events').textContent,/Date needs review/);
 payload={unexpected:true};await w.testSync();
 assert.equal(d.querySelectorAll('#events article').length,104);
 assert.match(d.getElementById('source').textContent,/unavailable/);
 w.close();
 // Initial offline state must honestly identify the fallback snapshot.
 const offline=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',url:'http://localhost/'});
 offline.window.fetch=async url=>{if(url.startsWith('https:'))throw Error('offline');return {ok:true,json:async()=>snapshot};};
 offline.window.eval(fs.readFileSync('app.js','utf8'));
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(offline.window.document.getElementById('sync-status').textContent,/Showing uploaded spreadsheet snapshots/);
 assert.equal(offline.window.document.querySelectorAll('#events article').length,111);
 offline.window.close();
 console.log('PASS: live updates, removals, empty sheet, 5-minute polling, safe fields, invalid dates, malformed feed, and offline fallback.');
})().catch(error=>{console.error(error);process.exit(1)});
