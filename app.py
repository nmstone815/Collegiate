"""Collegiate public event dashboard. Python standard library only."""
import csv
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'


def load_events():
    with (DATA / 'events.csv').open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))



class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, content_type):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/events':
            try:
                body = json.dumps({'events': load_events(), 'mode': 'Uploaded CSV snapshots', 'school_year': '2026–2027'}).encode()
                return self.send(200, body, 'application/json; charset=utf-8')
            except (OSError, csv.Error):
                return self.send(503, b'Event data unavailable.', 'text/plain; charset=utf-8')
        pages = {'/': ('index.html', 'text/html; charset=utf-8'), '/app.js': ('app.js', 'text/javascript; charset=utf-8'), '/style.css': ('style.css', 'text/css; charset=utf-8')}
        if path not in pages:
            return self.send(404, b'Not found.', 'text/plain; charset=utf-8')
        filename, kind = pages[path]
        return self.send(200, (ROOT / filename).read_bytes(), kind)


if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    server = ThreadingHTTPServer((host, int(os.environ.get('PORT', '8000'))), Handler)
    print('Collegiate public dashboard started.', flush=True)
    server.serve_forever()
