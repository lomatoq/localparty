# Agent concurrency investigation — 2026-10-02

User request: 10 group workers and an independent art director; root integrates.

## Verified facts

- Official Codex documentation supports `agents.max_concurrent_threads_per_session`; primary thread is excluded. `agents.max_threads` is the legacy alias. An unset value uses a client default; there is no documented universal four-agent ceiling.
- User config `/Users/hlebhlyaba/.codex/config.toml` initially had no agents table, no profile selection and no explicit multi_agent feature override.
- Installed bundled CLI reports `codex-cli 0.138.0-alpha.7`. Its binary contains the modern setting name and the exact thread-limit error text. Static app bundle inspection found no exposed corresponding app setting; that is not proof of a hardcoded limit.
- Current model execution explicitly exposes four concurrency slots, including root. Current tree contains root, game_ui_commander, social_ui_redesign and ui_rework_games.
- Actual new group03 launch returned `collab spawn failed: agent thread limit reached`.
- The user-authorized setting was saved as `[agents] max_concurrent_threads_per_session = 11`, with other config sections retained and parsed successfully.
- One real retry after the write returned the same thread-limit error. The current session did not adopt the new cap. Eleven live agents have NOT been launched.
- Pending human choice: open a new working chat for fresh-session validation or continue current bounded runtime. New chat must be explicitly authorized before app task creation; no background duplicate has been created.

## Documentation

- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://developers.openai.com/api/docs/guides/responses-multi-agent (separate hosted API concurrency setting; do not assume local TOML changes an already created hosted request)

## Resume packet

Read `group-plan.json`, `group-briefs/README.md`, `commander-findings.md`, `user-comments.md`, `design-rules.md`, `CLAUDE-HANDOFF.md`, `docs/agents/game-polish-lanes.md` and applicable AGENTS.md.

Preserve all dirty Claude work and current pending group02/group06 edits. No build, upload, reset or commit. The running source owners must freeze and report before new agents edit those files. New threads/agents need a real launch/status check; a stored task brief is not an active agent.

## Fresh-session validation

New authorized chat `01a0fc5b-9a58-7b90-a8ae-78420115152d` is active in the same project. Direct app thread evidence shows actual group01 through group08 subAgentActivity started events with unique thread IDs. This already exceeds the old three-subagent limit and confirms the saved setting took effect for the new session. Remaining group09/group10/art-director launch check is pending; do not call11active before their actual events.

Final launch verification: direct read_thread events show ELEVEN unique started subagents: group01, group02, group03, group04, group05, group06, group07, group08, group09, group10 and art_director. New root status reports all11running, plusitself. Both oldgroup02/group06 sourcesfrozen and finalhandoffsent to newroot. Requestedteamlaunch achieved; UIoverhaul continues innewchat.
