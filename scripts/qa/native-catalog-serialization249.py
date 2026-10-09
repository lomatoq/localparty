#!/usr/bin/env python3
"""Prepare a source-extracted Foundation diagnostic; compile only with --run."""
from pathlib import Path
import argparse, difflib, hashlib, json, subprocess, sys

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--run', action='store_true', help='Compile optimized Foundation probe and run exact/timing gates (requires macOS Swift/CryptoKit).')
parser.add_argument('--output', type=Path, default=ROOT / '.localparty-build/perf249/native-catalog-repro')
parser.add_argument('--expected-commit', help='Optional full HEAD lock for measured reproductions.')
args = parser.parse_args()
OUT = args.output.resolve()
OUT.mkdir(parents=True, exist_ok=True)
APP = ROOT / 'ios/LocalParty/LocalPartyApp.swift'
MODEL = ROOT / 'ios/LocalParty/ServerModel.swift'
sha = lambda text: hashlib.sha256(text.encode()).hexdigest()
app = APP.read_text()
model = MODEL.read_text()
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if args.expected_commit:
    assert head == args.expected_commit, ('Source base changed', head)
start = app.index('    private func publish() {')
end = app.index('    private func configureControllerBridge()', start)
publish = app[start:end].rstrip()
old_state = '        if let state = model.state, let data = try? JSONEncoder().encode(state), let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] { value = object }'
old_catalog = '        if let data = try? JSONEncoder().encode(lastGoodCatalog), let games = try? JSONSerialization.jsonObject(with: data) { value["catalog"] = games }'
new_state = '        var stateDictionaryReady = false\n' + old_state.replace('{ value = object }', '{ value = object; stateDictionaryReady = true }')
new_catalog = '        if !stateDictionaryReady || liveGames.isEmpty {\n    ' + old_catalog + '\n        }'
if publish.count(new_state) == 1 and publish.count(new_catalog) == 1:
    candidate_publish = publish
    publish = publish.replace(new_state, old_state).replace(new_catalog, old_catalog)
    source_variant = 'optimized-production'
else:
    assert publish.count(old_state) == 1 and publish.count(old_catalog) == 1, 'Unknown publish source: refuse guessed extraction.'
    candidate_publish = publish.replace(old_state, new_state).replace(old_catalog, new_catalog)
    source_variant = 'original-production'
baseline = app[:start] + publish + '\n' + app[end:]
candidate = app[:start] + candidate_publish + '\n' + app[end:]
(OUT / 'LocalPartyApp-baseline.swift').write_text(baseline)
(OUT / 'LocalPartyApp-candidate.swift').write_text(candidate)
(OUT / 'catalog-candidate.diff').write_text(''.join(difflib.unified_diff(baseline.splitlines(True), candidate.splitlines(True), fromfile='a/ios/LocalParty/LocalPartyApp.swift', tofile='b/ios/LocalParty/LocalPartyApp.swift')))
types = model[model.index('struct HostOption:'):model.index('@MainActor final class ServerModel:')].rstrip()
tvtypes = app[app.index('struct PartyTVBoardRow:'):app.index('@main struct LocalPartyApp:')].rstrip()
# Exactly the same generator command used by scripts/bundle-ios.py; no bundle or
# production file is written. Compare with current actual shipped resource below.
catalog = subprocess.check_output(['node', '-e', "const controls=require('./lib/host-controls');process.stdout.write(JSON.stringify(require('./lib/catalog').map(g=>({...g,hostControls:controls.schema(g)}))));"], cwd=ROOT)
assert len(json.loads(catalog)) == 36
bundled = (ROOT / 'ios/LocalParty/Server/native-catalog.json').read_bytes()
assert catalog == bundled, 'Current generated catalog differs from bundle; resolve before proof.'
(OUT / 'native-catalog.json').write_bytes(catalog)

def timed_body(source):
    a = source.index('        var value:')
    b = source.index('        guard let data = try? JSONSerialization.data(withJSONObject: value')
    return '        guard let model else { return nil }\n' + source[a:b] + '''        guard let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]), let payload = String(data: data, encoding: .utf8) else { return nil }
        return BuildOutput(data: data, payload: payload)
'''
def instrument(source):
    return source.replace('JSONEncoder().encode(state)', 'encodeState(state)').replace('JSONEncoder().encode(lastGoodCatalog)', 'encodeCatalog(lastGoodCatalog)').replace('JSONSerialization.jsonObject(with: data)', 'decodeObject(data)')
def source_class(name, source, counted):
    body = instrument(source) if counted else source
    return '\nfinal class ' + name + ': MockStore {\n' + body.replace('private func publish()', 'override func publish()') + '\n}\n'
def timer_class(name, source):
    return '\nfinal class ' + name + ': MockStore {\n    override func build() -> BuildOutput? {\n' + timed_body(source) + '    }\n}\n'
template = (ROOT / 'scripts/qa/fixtures/native-catalog249.template.swift').read_text()
insertions = {'/*__ACTUAL_TYPES__*/':tvtypes + '\n' + types,
              '/*__ACTUAL_PUBLISH_CLASSES__*/':source_class('ProofBaseline', publish, True) + source_class('ProofCandidate', candidate_publish, True),
              '/*__UNINSTRUMENTED_TIMED_CLASSES__*/':timer_class('TimedBaseline', publish) + timer_class('TimedCandidate', candidate_publish)}
probe = template
for key, value in insertions.items():
    assert probe.count(key) == 1
    probe = probe.replace(key, value)
(OUT / 'NativeCatalog249Probe.swift').write_text(probe)
manifest = {'baselineCommit':head, 'baselineAppSHA256':sha(baseline), 'currentAppSHA256':sha(app), 'currentSourceVariant':source_variant, 'candidateAppSHA256':sha(candidate),
            'serverModelSHA256':sha(model), 'actualCodableTypesSHA256':sha(types), 'actualTVTypesSHA256':sha(tvtypes),
            'baselinePublishSHA256':sha(publish), 'candidatePublishSHA256':sha(candidate_publish),
            'probeSHA256':sha(probe), 'templateSHA256':sha(template),
            'catalogSHA256':hashlib.sha256(catalog).hexdigest(), 'bundledCatalogSHA256':hashlib.sha256(bundled).hexdigest(), 'catalogCount':36,
            'candidateScope':'success of whole-state JSONEncoder + dictionary extraction AND nonempty live catalog: retain encoded state.catalog; original fallback otherwise',
            'proofExtraction':'Exact current publish method + Codable types. Proof functions only rename private to override and wrap actual encode/decode calls for counters.',
            'timingExtraction':'Exact current value builder through final sortedKeys JSON and UTF8 payload conversion; no encode/decode counters. Entry/delivery/room actions measured separately as correctness only.',
            'foundationMocks':'WebKit ACK/errors/epoch/in-flight queue, deterministic QR return, model.command log, Rooms-call counter, Surface flags. No real WebKit/QR graphics/native scene timing claim.',
            'compiled':False, 'executed':False, 'productionChanged':False}
(OUT / 'source-proof.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
if args.run:
    # These explicit opt-in subprocesses do not build/install the app or start
    # browsers/device/simulator. Keep failed stdout/stderr as diagnostic ledger.
    try:
        with (OUT / 'compile.log').open('w') as log:
            subprocess.run(['swiftc', '-O', '-parse-as-library', '-module-cache-path', str(OUT / 'module-cache'), str(OUT / 'NativeCatalog249Probe.swift'), '-o', str(OUT / 'probe249')], stdout=log, stderr=subprocess.STDOUT, check=True)
        manifest['compiled'] = True
        manifest['executed'] = True
        (OUT / 'source-proof.json').write_text(json.dumps(manifest, indent=2) + '\n')
        with (OUT / 'run.log').open('w') as log:
            subprocess.run([str(OUT / 'probe249'), str(OUT / 'native-catalog.json'), str(OUT / 'native-catalog249-proof.json')], stdout=log, stderr=subprocess.STDOUT, check=True)
        subprocess.run([sys.executable, str(ROOT / 'scripts/qa/native-catalog249-analyze.py'), str(OUT / 'native-catalog249-proof.json')], check=True)
    except subprocess.CalledProcessError as error:
        manifest['executionError'] = str(error)
        (OUT / 'source-proof.json').write_text(json.dumps(manifest, indent=2) + '\n')
        raise
