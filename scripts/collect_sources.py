"""Download the source copies listed in the release manifest.

This is a repeatable collector, NOT an official-verification step.
Existing bytes are kept unless --refresh is given. Updates may change source IDs.
"""
import argparse
import hashlib
import json
import pathlib
import urllib.request

root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--refresh',action='store_true')
args=parser.parse_args()
sources=json.loads((root/'data/normalized/sources.json').read_text())
for source in sources:
    destination=root/'data/raw'/source['file']
    if destination.exists() and not args.refresh:
        actual=hashlib.sha256(destination.read_bytes()).hexdigest()
        if actual!=source['sha256']:raise SystemExit(f"Checksum mismatch: {source['file']}")
        print('Verified existing bytes:',source['file'])
        continue
    request=urllib.request.Request(source['download_url'],headers={'User-Agent':'TamilnaduAPI/0.1 (factual archive collector)'})
    with urllib.request.urlopen(request,timeout=30) as response: content=response.read()
    actual=hashlib.sha256(content).hexdigest()
    if actual!=source['sha256']:
        incoming=destination.with_suffix(destination.suffix+'.incoming')
        incoming.write_bytes(content)
        raise SystemExit(f"Source changed; saved {incoming.name} for review. Do not replace release data without auditing.")
    destination.write_bytes(content)
    print('Downloaded and verified:',source['file'])
