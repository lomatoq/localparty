# Party coins — 173

Coins are the existing aggregate participation rewards presented as a persistent virtual balance: 10 per completed match and 30 extra for a win. The server preserves historical `points` values, adds `coins`, and keeps `points` as a compatibility alias. This does not change game scores, team rankings, purchase logic, or grant money with real value. Existing statistics reset deliberately also resets coins. Duplicate match events cannot award twice; late events after statistics reset are rejected. Unplayed connected players expose a zero balance; established rankings still list players who have completed a match.

Match awards come from the authoritative stored event, not recomputed by clients. Test/bot demonstration matches do not award persistent coins. Phone result rows retain game scores and add a separate gold earned badge. Aggregate phone, native host, and TV standings show balances. TV match podiums show a separate award, while company podiums show balances.

One flat SVG coin is shared. Award feedback uses up to three transform/opacity sprites per visible row, bounded to 24 sprites globally, ending in under 650 ms. No permanent frame loop, shadows or blur. Reduced motion disables travel; hidden/native-hidden pages cancel active sprites. Result keys prevent reconnect/update replay.

Evidence: `output/playwright/coins173/`. These are labelled renderer fixtures using production styles and rendering modules, not physical iPhone/AirPlay acceptance or real game-outcome recordings. Unit tests verify persisted authoritative outcomes. Browser capture includes long-name updates preserving badges and duplicate update suppression at 320/393 px in Chromium and WebKit, native host rankings, TV company/match podiums.
