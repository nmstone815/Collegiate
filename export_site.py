"""Build a static public website, excluding credentials and source spreadsheets."""
import csv
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC_FIELDS = ('title','date','time','location','organizer','type','grades','audience','approval','confirmation','source','source_row','review')


def export(output):
    output = Path(output)
    if output.exists():
        raise FileExistsError(f'Choose a new output directory: {output}')
    with (ROOT / 'data/events.csv').open(encoding='utf-8-sig', newline='') as stream:
        events = [{key: row.get(key, '') for key in PUBLIC_FIELDS} for row in csv.DictReader(stream)]
    html = (ROOT / 'index.html').read_text().replace('href="/style.css"', 'href="./style.css"').replace('src="/app.js"', 'src="./app.js"').replace('href="/"', 'href="./"')
    js = (ROOT / 'app.js').read_text().replace("fetch('/api/events')", "fetch('./events.json')")
    output.mkdir(parents=True)
    (output / 'index.html').write_text(html)
    (output / 'app.js').write_text(js)
    shutil.copyfile(ROOT / 'style.css', output / 'style.css')
    (output / 'events.json').write_text(json.dumps({'events': events, 'mode': 'Uploaded CSV snapshots', 'school_year': '2026–2027'}, ensure_ascii=False))
    (output / '_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\'; frame-ancestors \'none\'; base-uri \'none\'\n  Cache-Control: no-cache\n')
    archive = output.with_suffix('.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(output.iterdir()):
            bundle.write(path, path.name)
    return archive


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path, help='New directory for generated public files')
    args = parser.parse_args()
    print(export(args.output))
