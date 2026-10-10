#!/usr/bin/env python3
"""Summarize completed proof; no compilation or probe execution."""
from pathlib import Path
import json, random, statistics, sys

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / '.localparty-build/perf249/native-catalog-repro/native-catalog249-proof.json'
proof = json.loads(path.read_text())
assert proof.get('pass') is True, proof.get('error', 'Proof failed')
assert proof['catalogCount'] == 36
assert proof['caseCount'] == len(proof['cases']) == len(proof['plannedCases'])
assert [x['name'] for x in proof['cases']] == proof['plannedCases']
assert all(x['pass'] and x['exactFullDictionary'] and x['exactFullSortedKeysBytes'] for x in proof['cases'])
timing = proof['timing']
summary = {'pass':True, 'cases':len(proof['cases']), 'catalogCount':proof['catalogCount'],
           'catalogSHA256':proof['catalogSHA256'], 'metric':'CPU-side Foundation value-builder wall elapsed; no WK/native/cast/FPS claim',
           'timingOrder':'8 warm ABBA blocks,16 calls per batch;256 calls per variant per fixture. Three fixtures. Setup/checks/release outside timer; retained output slot assignment inside both timers.',
           'firstTimedCosts':'Run after correctness fixtures; Foundation/OS already warm. A then B order uncontrolled; diagnostic only.',
           'fixtures':[]}
for name in dict.fromkeys(x['fixture'] for x in timing):
    samples = [x for x in timing if x['fixture'] == name and x['kind'] == 'warm-balanced-ABBA']
    assert len(samples) == 32
    blocks = []
    for block in range(8):
        rows = sorted((x for x in samples if x['block'] == block), key=lambda x:x['position'])
        assert [x['variant'] for x in rows] == ['A','B','B','A']
        assert all(x['operations'] == 16 for x in rows)
        assert len({x['byteChecksum'] for x in rows}) == 1
        blocks.append(statistics.mean(x['msPerOperation'] for x in rows if x['variant'] == 'A') - statistics.mean(x['msPerOperation'] for x in rows if x['variant'] == 'B'))
    rng = random.Random(249)
    bootstrap = sorted(statistics.mean(rng.choices(blocks, k=len(blocks))) for _ in range(10000))
    a = [x['msPerOperation'] for x in samples if x['variant'] == 'A']
    b = [x['msPerOperation'] for x in samples if x['variant'] == 'B']
    summary['fixtures'].append({'name':name, 'baselineMeanMS':statistics.mean(a), 'candidateMeanMS':statistics.mean(b),
        'pairedSavedMeanMS':statistics.mean(blocks), 'pairedSavedMedianMS':statistics.median(blocks),
        'pairedBootstrap95SavedCI':[bootstrap[249],bootstrap[9749]], 'blockSavedMS':blocks,
        'callsPerVariant':sum(x['operations'] for x in samples if x['variant'] == 'A'),
        'firstTimedCosts':next(x for x in timing if x['fixture'] == name and x['kind'] != 'warm-balanced-ABBA'),
        'savedAboveMeasuredVariance':bootstrap[249] > 0})
out = path.with_name('summary.json')
out.write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
