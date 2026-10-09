"""Normalize collected factual archives and emit an honest coverage audit.

Run from any directory: python scripts/prepare_data.py
Raw source bytes are retained; no candidate identities are merged across elections.
"""
import collections
import csv
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
OUT = ROOT / 'data/normalized'
OUT.mkdir(exist_ok=True)
YEARS = [1967,1971,1977,1980,1984,1989,1991,1996,2001,2006,2011,2016,2021,2026]
OFFICIAL = 'https://www.eci.gov.in/statistical-reports'
SOURCE_2026 = 'https://github.com/heisenricher/Tamil-Nadu-Elections-2026-Dataset'
SOURCES = [
    {'id':'historical-archive','publisher':'Sushanth / just-rebel-spcell','url':'https://just-rebel-spcell.github.io/Election_Data/tamil_nadu.html','download_url':'https://just-rebel-spcell.github.io/Election_Data/assembly_tn_detail.csv','file':'assembly_tn_detail.csv','years':YEARS[:-1],'type':'secondary_eci_derived','official_source':OFFICIAL},
    {'id':'2026-archive','publisher':'heisenricher','url':SOURCE_2026,'download_url':'https://raw.githubusercontent.com/heisenricher/Tamil-Nadu-Elections-2026-Dataset/main/Tamil_Nadu_State_Elections_2026_Details.csv','file':'Tamil_Nadu_State_Elections_2026_Details.csv','years':[2026],'type':'secondary_results_archive','official_source':'https://results.eci.gov.in/ResultAcGenMay2026/'},
]

def read(name):
    return list(csv.DictReader((RAW/name).open(encoding='utf-8-sig')))

def number(v):
    return int(float(v)) if v and str(v).strip() else None

def norm(s):
    return re.sub('[^a-z0-9]', '', s.lower())

archive = read('assembly_tn_detail.csv')
master = {norm(r['AC_NAME']):int(r['AC_NO']) for r in archive if r['YEAR']=='2021'}
# Reviewed mappings, never automatic fuzzy matching. Numbers are election-scoped.
ALIASES = {'Anaikattu':44,'Anthiyur':105,'Bodinayakanur':200,'Chepauk-Thiruvallikeni':19,'Colachal':231,'Gandarvakkottai':178,'Kinathukadavu':122,'Krishnarayapuram':136,'Madurantakam':35,'Mayiladuthurai':161,'Oddanchatram':128,'Palacode':57,'Pappireddipatti':60,'Sholinghur':39,'Thirumayam':181,'Thiruparankundram':195,'Thiyagarayanagar':24,'Tirupattur':185,'Udumalaipettai':125,'Ulundurpettai':77,'Vriddhachalam':152}
by_year = collections.defaultdict(list)
for i,r in enumerate(archive,2):
    y,c = number(r['YEAR']),number(r['AC_NO'])
    by_year[y].append({'id':f'tn-assembly-{y}-{c}-{i}', 'year':y,'constituency_id':c,'constituency_name':r['AC_NAME'].strip(),'reservation':r['AC_TYPE'] or None,'candidate_name':r['NAME'].strip(),'party':r['PARTY'].strip(),'gender':r['SEX'] or None,'age':number(r['AGE']) or None,'votes':number(r['VOTES']),'general_votes':None,'postal_votes':None,'source_reported_votes':number(r['polled_votes']),'source_rank':number(r['rank']),'is_nota':r['PARTY'].upper()=='NOTA' or r['NAME'].upper()=='NOTA','source_id':'historical-archive','source_row':i})

# The 2021 archive collapses small parties into OTH. Use the more detailed
# OpenCity/TCPD factual copy; compare every constituency/vote multiset first.
check2021 = read('tamil-nadu-assembly-elections-2021-1.csv')
a=collections.Counter((r['constituency_id'],r['votes']) for r in by_year[2021])
b=collections.Counter((number(r['Constituency_No']),number(r['Votes'])) for r in check2021)
assert a==b, '2021 vote copies disagree; stop import for review'
ogd=json.load((RAW/'opencity-metadata.json').open())
package=next(d for d in ogd['result']['results'] if d['name']=='tamil-nadu-assembly-elections-2021')
resource=package['resources'][1]
SOURCES.append({'id':'opencity-2021','publisher':'OpenCity / TCPD','url':'https://data.opencity.in/dataset/tamil-nadu-assembly-elections-2021','download_url':resource['url'],'file':'tamil-nadu-assembly-elections-2021-1.csv','years':[2021],'type':'secondary_eci_derived','official_source':OFFICIAL,'crosscheck':'All constituency/vote row multisets match the historical archive. This is secondary-copy agreement, not official certification.'})
by_year[2021]=[]
for i,r in enumerate(check2021,2):
    c=number(r['Constituency_No'])
    by_year[2021].append({'id':f'tn-assembly-2021-{c}-{i}','year':2021,'constituency_id':c,'constituency_name':r['Constituency_Name'].strip(),'reservation':r['Constituency_Type'] or None,'candidate_name':r['Candidate'].strip(),'party':r['Party'].strip(),'gender':r['Sex'] or None,'age':number(r['Age']) or None,'votes':number(r['Votes']),'general_votes':None,'postal_votes':None,'source_reported_votes':number(r['Valid_Votes']),'source_rank':number(r['Position']),'is_nota':r['Party'].upper()=='NOTA' or r['Candidate'].upper()=='NOTA','source_id':'opencity-2021','source_row':i})

for i,r in enumerate(read('Tamil_Nadu_State_Elections_2026_Details.csv'),2):
    name=r['Constituency'].strip()
    c=ALIASES.get(name,master.get(norm(name)))
    assert c is not None, f'Unmapped constituency: {name}'
    by_year[2026].append({'id':f'tn-assembly-2026-{c}-{i}','year':2026,'constituency_id':c,'constituency_name':name,'reservation':None,'candidate_name':r['Candidate'].strip(),'party':r['Party'].strip(),'gender':None,'age':None,'votes':number(r['Total_Votes']),'general_votes':number(r['EVM_Votes']),'postal_votes':number(r['Postal_Votes']),'source_reported_votes':number(r['Tot_Constituency_votes_polled']),'source_rank':None,'is_nota':'NOTA' in r['Candidate'].upper() or 'none of the above' in r['Party'].lower(),'source_id':'2026-archive','source_row':i})

audit=[]
for y in YEARS:
    rows=by_year[y]
    groups=collections.defaultdict(list)
    for r in rows: groups[r['constituency_id']].append(r)
    missing=sorted(set(range(1,235))-set(groups))
    assert not missing and len(groups)==234, f'Incomplete constituency coverage: {y}'
    issues=[]
    for c,rr in sorted(groups.items()):
        total=sum(r['votes'] for r in rr)
        reported=sorted({r['source_reported_votes'] for r in rr if r['source_reported_votes'] is not None})
        flags=[]
        if len(reported)!=1: flags.append('inconsistent_reported_total')
        if total not in reported: flags.append('vote_sum_mismatch')
        if any(r['votes']==0 for r in rr): flags.append('zero_vote_rows_require_review')
        if any(r['general_votes'] is not None and r['general_votes']+r['postal_votes']!=r['votes'] for r in rr): flags.append('component_sum_mismatch')
        if flags: issues.append({'constituency_id':c,'constituency_name':rr[0]['constituency_name'],'flags':flags,'computed_vote_sum':total,'source_reported_totals':reported})
        candidate_votes=sorted([r['votes'] for r in rr if not r['is_nota']],reverse=True)
        max_votes=candidate_votes[0]
        winners=[r for r in rr if not r['is_nota'] and r['source_rank']==1]
        winner_id=winners[0]['id'] if len(winners)==1 else None
        if y==2026:
            top=[r for r in rr if not r['is_nota'] and r['votes']==max_votes]
            winner_id=top[0]['id'] if len(top)==1 else None
        for r in rr:
            r['rank']=None if r['is_nota'] else 1+sum(v>r['votes'] for v in candidate_votes)
            r['status']='nota' if r['is_nota'] else ('won' if r['id']==winner_id else ('lost' if winner_id else 'unresolved'))
            r['vote_share_pct']=round(r['votes']/total*100,4) if total and not flags else None
            r['vote_share_basis']='computed_candidate_votes_plus_nota' if r['vote_share_pct'] is not None else None
            r['verification_status']='pending_official_row_verification'
            r['quality_flags']=flags
    rows.sort(key=lambda r:(r['constituency_id'],r['is_nota'],r['rank'] or 999,r['source_row']))
    (OUT/f'{y}.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
    audit.append({'year':y,'election_id':f'tn-assembly-{y}','type':'assembly_general','expected_constituencies':234,'constituencies_present':len(groups),'missing_constituency_ids':missing,'result_rows':len(rows),'candidate_rows':sum(not r['is_nota'] for r in rows),'nota_rows':sum(r['is_nota'] for r in rows),'winner_rows':sum(r['status']=='won' for r in rows),'constituency_coverage':'all_234_present','official_verification':'pending','candidate_completeness':'not_officially_certified','quality_issue_constituencies':len(issues),'issues':issues,'source_ids':sorted({r['source_id'] for r in rows}),'notes':['General-election cycle results; not a complete by-election archive.','Constituency IDs are scoped to election year. Do not equate pre-2011 IDs with post-2011 boundaries.']+(['Includes archive records for delayed 2016 polls; denominator inconsistencies remain flagged.'] if y==2016 else [])})

for s in SOURCES:
    b=(RAW/s['file']).read_bytes()
    s['sha256']=hashlib.sha256(b).hexdigest()
    s['retrieved_at']='2026-10-09'
    s['official_row_verification']='pending'
coverage={'dataset_version':'2026-10-09.1','state':'Tamil Nadu','scope':'Assembly general-election cycles, 1967–2026','all_officially_verified':False,'release_status':'provisional','total_result_rows':sum(len(v) for v in by_year.values()),'total_candidate_rows':sum(not r['is_nota'] for v in by_year.values() for r in v),'elections':audit,'limitations':['All 234 constituency IDs are present for each target year, but this does not certify all candidate rows.','Official ECI downloads returned HTTP 406/502 during collection; no complete official row audit was possible.','2026 is a results-page archive, not a certified Form-20 dataset.','Historical party labels and name spellings follow source copies; parties and people are not merged across years.','District labels are source-year scoped and available only for 2021 and 2026; 19 labels are missing in the 2026 source. Tamil constituency search covers five Tirunelveli seats from 2011 onward. Tamil candidate names, turnout, affidavits, local-body and parliamentary elections are not part of this release.','Zero-vote rows and inconsistent reported totals are retained and flagged.','Secondary-copy agreement for 2021 and an official 2026 candidate-count check do not establish row-level official verification.']}
(OUT/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
(OUT/'sources.json').write_text(json.dumps(SOURCES,ensure_ascii=False,indent=2))
with (ROOT/'data/results.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=list(by_year[1967][0]))
    writer.writeheader()
    for y in YEARS: writer.writerows(by_year[y])
print(json.dumps({'years':len(YEARS),'rows':coverage['total_result_rows'],'candidates':coverage['total_candidate_rows'],'issues':{a['year']:a['quality_issue_constituencies'] for a in audit}}))
