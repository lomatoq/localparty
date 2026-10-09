'use strict';
// Run against current production, with the saved original method as numerical oracle.
// Browser timings in this oracle include the reference calculation and are not a benchmark.
const path=require('node:path');
process.env.GAME='curling';
process.env.QA_ROSTER='16';
process.env.QA_SECONDS='3';
process.env.QA_ENGINE=process.env.QA_ENGINE||'chromium';
process.env.QA_OUTPUT=process.env.QA_OUTPUT||path.resolve(__dirname,'../../output/playwright/performance247/camera-regression',process.env.QA_ENGINE);
process.env.PERF_SOURCE_DIR=path.resolve(__dirname,'../..');
process.env.QA_CAMERA_ORACLE='1';
for(const key of ['QA_UI_ORACLE','QA_RECONNECT','QA_NATIVE_VISIBILITY','QA_REQUIRE_STABLE','QA_GPU'])process.env[key]='0';
require('../../scripts/performance247-sports.cjs');
