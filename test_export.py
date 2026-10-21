import json
import tempfile
import unittest
import zipfile
from pathlib import Path
import export_site

class ExportTests(unittest.TestCase):
    def test_public_bundle(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp) / 'site'
            archive = export_site.export(folder)
            with zipfile.ZipFile(archive) as bundle:
                self.assertEqual(set(bundle.namelist()), {'index.html','app.js','style.css','events.json','_headers'})
                data = json.loads(bundle.read('events.json'))
                self.assertEqual(len(data['events']),111)
                for event in data['events']:
                    self.assertEqual(set(event),set(export_site.PUBLIC_FIELDS))
                self.assertIn(b"fetch('./events.json',", bundle.read('app.js'))
                self.assertIn(b'href="./style.css"',bundle.read('index.html'))
            with self.assertRaises(FileExistsError):
                export_site.export(folder)

if __name__ == '__main__': unittest.main()
