# Popup 144 — spacing and game-detail correction

Removed stacked padding/margins in rules, empty rankings and game-detail footer. Game detail now owns its outer inset (20px sides, 28px top), has one action row: Play, Controller, circular Back. Full-width disclosure surfaces inside the inset column; no nested focus outline. Initial focus is the title, keyboard disclosure focus remains visible via fill.

Fresh captures: output/playwright/popup144/index.html. WebKit 320/393 and Chrome 393. Host test asserts all three buttons share y and 48px height, no horizontal overflow, and disclosure side insets >=19px. Captured expanded disclosures with pinned actions. Player 15 cases, host 9 cases, additional confirmations 6; localized host and rooms refreshed. Browser fixtures, no physical-device validation.

Separate shader research: ui-shader-research-2026-10-06.md. No researched shaders introduced into this spacing pass.
