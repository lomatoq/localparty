# Hands-free Motion and active-card material · 116 candidate

The user confirmed build115 detects throwing force but rejected the held-pad interaction. The active controller now uses FreeMotionThrow: no touch hold/release, no manual Position or Spin in Motion. Quiet arming plus a deliberate forward acceleration impulse sends one existing turn-token throw; stronger acceleration means higher power, transverse impulse means aim, and angular rotation around the fixed throwing direction means spin. Position stays centred. Strength gain was lowered by20% from the initial hands-free candidate; the tested gentle/medium/hard impulses retain distinct power headroom. Swipe is unchanged.

The initial TV direction is captured from a quiet phone pose at Motion activation. The phone's top edge or back must face the TV initially. Later grip changes are transformed into that fixed frame. Sensors alone do not locate the TV. Native attitude uses measured gravity to validate direct/inverse convention, independently of viewport orientation.

Motion Curling retains shake-to-sweep and removes the visible hold button. Pause, turn eligibility, stale samples, resize/orientation cancellation and single-command consumption remain gated.

The active Host game card has the same game-colour→lime masked gradient ring and material layers as Host’s Pick, in expanded and compact states. Its existing frosted sticky backing is retained.

## Evidence

- Final five-case actual WebKit controller/launcher/server run with synthetic native/browser sensor inputs: passed, errors=[], sourceDrift=[]; native Bowling and Curling at320/402, browser Bowling at402.29 fresh originals. No held-pad touch appears in the throw path. Actual throw token reaches rolling state once. Shake-to-sweep is delivered through the real game connection.
- Root personally inspected final originals: Bowling native ready320/402 and rolling402; Curling native ready402 and sweeping320; browser attitude fallback402; Host expanded active, compact active and Host’s Pick320. Other gallery frames are captured evidence, not a claim of individual visual approval.
- Host unchanged regression: first concurrent run exceeded the class-transition latency budget. Raw failure retained. Isolated repeat passed existing budgets and the active-game restart guard; errors=[] and stable=true. No thresholds were weakened.
- Full suite:675/676 pass; the only failure was stale generated prototype inventory after parallel graphics added assets. Regenerated inventory and all5 inventory tests pass. Required post-suite Party/Tanks/shrink/Spy/Millionaire integrations pass. Logs retained separately.
- Earlier restricted-server attempts failed with listen EPERM. Authorized local-server repeat is the evidence run; this is not an application failure.
- Read-only physical115 lifecycle log after the user's trial confirms native sensor delivery and three valid old held-pad releases, with zero stale/invalid samples. This corroborates the user's force-detection observation. It is not physical validation of FreeMotionThrow.

## Delivery state

The initial116 candidate was rejected as stale and never installed. After Claude’s final handover and the user’s stop confirmation,116 was rebuilt from integration-source-freeze116-final.json. Full676/676 tests and post-suite integrations passed; full/reduced Pocket juice browser checks passed. Product/signature validators passed and1717 runtime resources matched source. Version0.11.7(116) was installed over115 and launched; installed version was read back. New hands-free gesture feel remains unverified on physical hardware. See build116-install-provenance.json.

Gallery: http://127.0.0.1:17809/screen-state-audit-2026-10-03/free-motion116-review/index.html
Reports: output/playwright/screen-state-audit-2026-10-03/free-motion116-final-authorized/report.json and host-ring116-alone/report.json.
