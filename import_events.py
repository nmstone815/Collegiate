import calendar,csv,pathlib,re,json
from datetime import datetime,date
from difflib import SequenceMatcher
import argparse
parser=argparse.ArgumentParser(description='Import staff event CSV snapshots')
parser.add_argument('--old',required=True,type=pathlib.Path)
parser.add_argument('--new',required=True,type=pathlib.Path)
args=parser.parse_args()
old,new=args.old,args.new
out=pathlib.Path(__file__).resolve().parent/'data'
out.mkdir(exist_ok=True)
fields=['title','date','time','location','organizer','type','grades','audience','approval','confirmation','source','source_row','review']
events=[]
months={m.lower():i for i,m in enumerate(calendar.month_name) if m}
last_month=''
for n,r in enumerate(list(csv.reader(old.open(encoding='utf-8-sig')))[2:],3):
 r=r+['']*(26-len(r)); month=r[2].strip() or last_month
 if month: last_month=month
 day=r[3].strip(); stamp=''; issue=[]
 try: stamp=date(2026 if months[month.lower()]>=8 else 2027,months[month.lower()],int(day)).isoformat()
 except (ValueError,KeyError): issue.append('Missing or invalid date; confirm manually')
 for offset in [8,18]:
  title=r[offset].strip()
  if not title: continue
  if not any(c.isalnum() for c in title):
   continue
  e=dict.fromkeys(fields,'')
  e.update(title=title,date=stamp,source='Older calendar',source_row=n,review='; '.join(issue))
  if offset==8:
   e.update(type=r[9].strip(),audience=r[10].strip(),grades=r[11].strip(),time=r[12].strip(),location=r[13].strip(),organizer=r[14].strip())
  else:
   e.update(audience=r[19].strip(),grades=r[20].strip(),time=r[21].strip(),location=r[22].strip(),organizer=r[23].strip())
  events.append(e)
rows=list(csv.reader(new.open(encoding='utf-8-sig')))
for n,r in enumerate(rows[1:],2):
 if not any(r): continue
 e=dict.fromkeys(fields,'')
 try: stamp=datetime.strptime(r[7].strip(),'%m/%d/%Y').date().isoformat()
 except ValueError: stamp=''
 e.update(title=r[6].strip(),date=stamp,time=' – '.join(x.strip().lstrip('`') for x in r[8:10]),location=r[10].strip(),organizer=r[14].strip(),type=r[3].strip(),grades=r[4].strip(),approval=r[15].strip(),confirmation=r[11].strip(),source='New submissions',source_row=n)
 events.append(e)
def norm(s): return ' '.join(re.findall('[a-z0-9]+',s.lower()))
candidates=[]
for i,a in enumerate(events):
 for b in events[i+1:]:
  if a['source']==b['source'] or not a['date'] or a['date']!=b['date']: continue
  x,y=norm(a['title']),norm(b['title'])
  if x in y or y in x or SequenceMatcher(None,x,y).ratio()>.65:
   candidates.append({'date':a['date'],'older_title':a['title'],'new_title':b['title']})
   for e in [a,b]: e['review']='; '.join(filter(None,[e['review'],'Possible duplicate; review before merging']))
with (out/'events.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(events)
summary={'older_events':sum(e['source']=='Older calendar' for e in events),'new_submissions':sum(e['source']=='New submissions' for e in events),'total':len(events),'missing_dates':sum(not e['date'] for e in events),'possible_duplicates':candidates,'date_assumption':'August–December 2026; January–June 2027. Dates use numeric spreadsheet fields; weekday labels and date references within titles were not validated.','privacy':'Email addresses, freeform notes, and support requests omitted from this review export. Treat organizer names and approval status as internal.'}
(out/'import-summary.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
