# Pocket Siege icon border cleanup

Run `node scripts/clean-pocket-icon-atlases.cjs` for a read-only dry run, or add
`--apply` to regenerate the nine public WebP atlases and their PNG mirrors.
The original generated source paths are recorded in `manifest.json`; those files
are never modified. Regeneration always starts from these sources, not previously
compressed WebP output. Missing original sources cause a clear error before writes.

The cleanup runs **before** alpha-bound cropping and 88-pixel normalization.
Consequently, adjacent-row fragments which would otherwise be pulled inside an
icon's padding are identified at the actual source cell boundary.

An eight-connected alpha component is removable only when it touches the outer
1.2% of the source cell and occupies no more than both 4.5% of the tile and 18%
of the largest component. The largest component is always protected. Large
boundary-clipped art, connected appendages, and all interior detached parts stay.
This intentionally conservative geometric rule cannot distinguish a contaminant
connected to the main artwork; it does not attempt to cut through such artwork.

`border-cleanup-report.json` records every one of the 321 icons and the pixel and
component counts. `border-cleanup-contact-sheet.png` shows each changed icon,
original on the left and cleaned on the right. The finalizer also checks that all
321 icon identifiers remain unique and no two finished sprites are exact copies.

Regression tests: `node --test tests/pocket-icon-cleanup.test.cjs`.
