"""Rebuild source-year district labels, retaining missing values.

Tamil aliases are reviewed entries in seat-metadata.json, sourced from the
linked Tirunelveli government page. Never infer historical district labels.
Run after data:prepare when updating source CSVs.
"""
import csv
import json
import pathlib
import re
root = pathlib.Path(__file__).resolve().parents[1]
path = root / 'data/normalized/seat-metadata.json'
metadata = json.loads(path.read_text())
normalized = json.loads((root / 'data/normalized/2026.json').read_text())
key = lambda s: re.sub('[^a-z0-9]', '', s.lower())
master = {key(row['constituency_name']): row['constituency_id'] for row in normalized}
def rows(name):
    return csv.DictReader((root / 'data/raw' / name).open(encoding='utf-8-sig'))
districts = {}
for row in rows('tamil-nadu-assembly-elections-2021-1.csv'):
    seat = str(int(float(row['Constituency_No'])))
    name = row['District_Name'].strip() or None
    assert seat not in districts or districts[seat] == name, f'Conflicting district: {seat}'
    districts[seat] = name
new = {}
for row in rows('Tamil_Nadu_State_Elections_2026_Constituency_Metadata.csv'):
    seat = str(master[key(row['Constituency'])])
    assert seat not in new, f'Duplicate district row: {seat}'
    new[seat] = row['District'].strip() or None
assert len(districts) == len(new) == 234
metadata['districts'] = {'2021': districts, '2026': new}
path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
print('District labels rebuilt with source gaps retained.')
