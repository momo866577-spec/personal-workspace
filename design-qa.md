# Design QA — 英语学习摘要区

## Visual truth and captures

- Source visual truth: `C:/Users/User/AppData/Local/Temp/codex-clipboard-207516c2-4d06-486e-8e1a-fbfad89c69e3.png`
- Source pixels: 852 × 1846.
- Mobile implementation: `design-review/english-summary-mobile-fixed.png`
- Tablet implementation: `design-review/english-summary-tablet.png`
- Desktop implementation: `design-review/english-summary-desktop.png`
- CSS viewports checked: 390 × 844, 820 × 1180, and 1440 × 900.
- Captured pixels: 375 × 811, 805 × 1005, and 1287 × 891. Browser chrome was excluded; the source was normalized to the 390px mobile CSS width before comparison.
- State: English page, CEFR B1, zero progress, default device English voice.

## Full-view comparison evidence

- The former vertical sequence of five separated information cards was replaced with three explicit layers: vocabulary and level route, overall progress, and the four learning statistics.
- The responsive implementation preserves the selected pink jelly surfaces, burgundy typography, soft highlights, rounded silhouettes, and the persistent left navigation.
- At 390px, the summary becomes a compact two-column composition without horizontal page overflow. At tablet and desktop widths, the summary and progress cards share a row and the statistics remain grouped below.

## Focused region comparison evidence

- Vocabulary card: `NGSL` stays on one line at all checked widths; Oxford 3000 copy remains readable.
- Level route: CEFR B1, the direction indicator, and B2 remain centered within the right column.
- Progress card: `0 / 700`, `0%`, and the progress rail remain inside the card with no clipping.
- Statistics card: all four values and labels remain grouped and visible; the mobile layout uses a 2 × 2 grid.

## Required fidelity surfaces

- Fonts and typography: Existing app font stack and weights were preserved. Hierarchy matches the target through enlarged NGSL and progress values; no truncation or forced vertical glyph layout remains.
- Spacing and layout rhythm: The mobile ratio was corrected after the first pass exposed vertical NGSL wrapping. Final DOM measurements show no overflow in the summary, progress, route, or statistics surfaces.
- Colors and visual tokens: Existing pink and burgundy tokens were preserved; no new page-level color system was introduced.
- Image quality and asset fidelity: The selected region contains no raster illustration or custom image asset. Existing Lucide navigation icons were preserved.
- Copy and content: Existing curriculum values, controls, Simplified Chinese labels, and dynamic statistics remain unchanged except `目前词库` was standardized to `当前词库` to match the selected visual.

## Interaction and runtime checks

- Two native selects remain present and enabled: difficulty and pronunciation.
- English data, task checkboxes, pronunciation logic, and IndexedDB access were not changed.
- Browser console errors: none on mobile, tablet, or desktop checks.
- Horizontal overflow: none at tablet and desktop; the 390px app canvas remains fixed to the viewport and all revised cards stay within the English content column.

## Comparison history

- P1 found on first mobile pass: `NGSL` wrapped vertically because the level route minimum width left insufficient room.
- Fix: reduced only the mobile route column and padding, and made the vocabulary title non-wrapping.
- Post-fix evidence: `design-review/english-summary-mobile-fixed.png`; `NGSL` is horizontal and the measured card surfaces have no overflow.

## Findings

- P0: none.
- P1: none.
- P2: none.

## Follow-up polish

- P3: The live app keeps the existing difficulty control above the selected reference region because removing it would delete a working feature.

final result: passed
