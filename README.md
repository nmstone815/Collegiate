# Collegiatte

A public school event dashboard for school year 2026–2027. Anyone who can reach the website can view its events without a password. Python 3.12+ is required; no third-party dependencies.

## Run

From `/workspace/Collegiatte`, run `python3 app.py` for local development on port 8000. To bind to a hosting platform's network interface, use `HOST=0.0.0.0 PORT=8000 python3 app.py` (or the platform-provided PORT). For public use, put the application behind the hosting provider's HTTPS endpoint. Running a local server alone does not create a public URL.

No passwords or school accounts are required. The calendar exposes event titles, dates, times, locations, organizers, grades, approval statuses and review flags, including tentative/unapproved events. A forwarded link grants the same access. Email addresses and private freeform notes are excluded from the import. Source files, raw CSVs and local configuration are not served.

## Data

The initial snapshot is `data/events.csv`, excluded from Git and retained in the environment snapshot. Include this file in private deployment storage for hosting. For a fresh clone, import the source files first:

`python3 import_events.py --old /path/to/old.csv --new /path/to/new.csv`

This replaces the local combined CSV, preserves possible duplicates for review, and never edits Google Sheets. Years use the 2026–2027 school year; missing dates are flagged. Live Google Sheets synchronization is not connected.

## Validate

Run `python3 -m unittest -v` for HTTP and dataset checks, and `node --check app.js` for JavaScript syntax.

## Publish without a terminal

A ready-to-upload public website is generated with `python3 export_site.py /workspace/collegiatte-public-v1`. The exporter includes only the HTML, CSS, JavaScript, public event JSON, and hosting headers. It excludes passwords, Python source, uploaded spreadsheets, and private notes.

1. Download the generated ZIP and unzip it on your computer.
2. Open https://app.netlify.com/drop in your browser and sign in or create an account if prompted.
3. Upload the extracted folder containing `index.html`, `app.js`, `style.css`, and `events.json`.
4. Netlify provides the public website address. Keep the site in your account so you can update it.
5. Open that address in a private/incognito browser window and verify the calendar loads without signing in.

Anyone can access this website and its event data. This publishes the uploaded CSV snapshots; Google Sheets changes do not update the exported website. Re-import updated CSVs, export to a new output directory, and upload a new deployment to the same Netlify site to update it.

## GitHub Pages

The `docs/` directory contains the public website and event snapshot. In the GitHub repository, open Settings → Pages, select Deploy from a branch, select `main` and `/docs`, and save. GitHub will show the website address after deployment. Pages availability depends on the repository visibility and account plan. The exported data is deliberately public; do not add private spreadsheet notes or credentials to `docs/`.

## Calendar and list views

Use the List view / Calendar view buttons to switch layouts. The calendar supports month navigation and expandable event details. Search, source, approval, month and import-review filters apply to both views. Undated events remain visible below the calendar. On narrow screens the calendar scrolls horizontally.

Optional UI checks require jsdom in a development tools directory (the website has no runtime dependency). Run `NODE_PATH=/path/to/dev-tools/node_modules node test_calendar.cjs`; set `TEST_SITE_DIR=docs` to check the GitHub Pages version as well. Tests cover date alignment, leap years, month navigation, filters, details and undated entries.
