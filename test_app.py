import base64
import csv
import http.client
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from http.server import ThreadingHTTPServer
import app

class AccessTests(unittest.TestCase):
    def setUp(self):
        self.server=ThreadingHTTPServer(('127.0.0.1',0),app.Handler)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join()
    def request(self,path,credential=None):
        conn=http.client.HTTPConnection(*self.server.server_address)
        headers={}
        if credential is not None: headers['Authorization']='Basic '+base64.b64encode(credential.encode()).decode()
        conn.request('GET',path,headers=headers)
        r=conn.getresponse(); result=(r.status,dict(r.getheaders()),r.read());conn.close();return result
    def test_all_assets_and_data_are_public(self):
        for path in ['/','/app.js','/style.css','/api/events']:
            with self.subTest(path=path):
                status,headers,body=self.request(path)
                self.assertEqual(status,200)
                self.assertNotIn('WWW-Authenticate',headers)
    def test_public_data(self):
        import json
        status,headers,body=self.request('/api/events')
        self.assertEqual(status,200)
        events=json.loads(body)['events']
        self.assertEqual(len(events),111)
        self.assertEqual(sum(e['source']=='New submissions' for e in events),8)
        self.assertEqual(sum(not e['date'] for e in events),3)
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertFalse(any('email' in k.lower() for e in events for k in e))
    def test_missing_data_reports_failure(self):
        with patch.object(app,'load_events',side_effect=FileNotFoundError):
            self.assertEqual(self.request('/api/events')[0],503)
    def test_dashboard_and_traversal(self):
        status,headers,body=self.request('/')
        self.assertEqual(status,200);self.assertIn(b'SCHOOL EVENTS',body)
        self.assertEqual(self.request('/data/events.csv')[0],404)
        self.assertEqual(self.request('/../app.py')[0],404)

if __name__=='__main__': unittest.main()
