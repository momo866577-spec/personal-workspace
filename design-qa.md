# Jelly Rail UI Design QA

## Evidence

- Source visual target: `design-qa-assets/source-jelly-blue.png`
- Blue implementation: `design-qa-assets/implementation-jelly-blue.png`
- Pink implementation: `design-qa-assets/implementation-jelly-pink.png`
- Side-by-side comparison: `design-qa-assets/comparison-blue.png`
- Primary viewport: 834 × 1194
- Mobile viewport: 390 × 844
- State: light mode, dashboard, real local workspace data (no fake records)

## Visual comparison

The implementation preserves the source direction: a permanent left feature rail, large blue/pink jelly progress card, glossy focus action, compact task list, paired learning/exercise cards, and a recent-notes section. The production UI uses live progress and records, so the displayed values intentionally differ from the generated source mockup.

## Interaction and responsive checks

- Switched between `蓝莓果冻` and `樱粉果冻` from Settings without reload.
- Confirmed the active theme persists through the existing LocalStorage theme provider.
- Confirmed all eight existing feature entries remain available in the left rail.
- Confirmed dashboard title is `今日工作台`.
- Confirmed no horizontal overflow at 834 × 1194 or 390 × 844.
- Confirmed the mobile layout retains a usable left rail and touch-sized controls.
- Confirmed page transitions and button hover/press states use spring-based Motion animation.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the selected navigation item uses an additional outer outline for accessibility and stronger location feedback; this is a deliberate production adaptation of the source visual.
- P3: content density is slightly higher than the visual target because the production dashboard exposes real task metadata and keeps every existing feature reachable.

## Result

Previous Jelly Rail dashboard pass: passed.

## Blueberry Jelly Feature-page Remediation

- Source problem capture: `design-qa-assets/blue-jelly-fix/english-before.png`
- Revised implementation: `design-qa-assets/blue-jelly-fix/english-after.png`
- Same-state comparison: `design-qa-assets/blue-jelly-fix/english-comparison.png`
- Checked-state evidence: `design-qa-assets/blue-jelly-fix/english-checked.png`
- Mobile evidence: `design-qa-assets/blue-jelly-fix/english-mobile.png`
- Cross-page evidence: `design-qa-assets/blue-jelly-fix/tasks-after.png`
- Viewports: 834 × 1194 and 390 × 844 CSS px, device scale factor 1.
- State: light mode, `jelly-blue`, English curriculum and daily-plan screens.

### Comparison history

1. P1: English cards, vocabulary cells, and unchecked controls blended into near-white surfaces. Fixed with pale-blue layered surfaces, dark navy text, visible blue checkbox borders, and distinct selected gradients.
2. P2: the jelly material stopped at the dashboard. Fixed by extending glossy gradients, white edge highlights, inner shadows, soft blue cast shadows, and press states to feature cards, inputs, dialogs, learning controls, and shared functional panels.
3. Post-fix evidence shows five visible and operable English checkboxes; the first checkbox was checked and restored successfully. No horizontal overflow occurred at either viewport.

### Fidelity surfaces

- Typography: dark navy hierarchy is readable over every blue surface; supporting text remains visibly secondary.
- Layout: original feature structure and responsive left rail are unchanged.
- Color and tokens: pure-white functional surfaces were replaced with consistent pale-blue gradients and semantic blue states.
- Image quality: no raster assets are required for this material-only interface correction; existing vector icons remain sharp.
- Copy and content: English vocabulary, task data, labels, and controls are unchanged.
- Console errors: none.

## Blueberry Jelly Desktop Regression

- User report: `design-qa-assets/blue-jelly-desktop-fix/dashboard-before-user.png`
- Revised implementation: `design-qa-assets/blue-jelly-desktop-fix/dashboard-after.png`
- Side-by-side comparison: `design-qa-assets/blue-jelly-desktop-fix/dashboard-comparison.png`
- Source capture: 1917 x 1015 px including browser chrome; the 1917 x 922 app area was normalized for comparison.
- Test viewport: 1920 x 1080 CSS px, device scale factor 1. Browser capture surface: 1368 x 1072 px.
- State: light mode, `jelly-blue`, dashboard.

### Comparison history

1. P1: a legacy global `main` margin shifted the desktop workspace away from the navigation rail. Fixed with a theme-scoped desktop layout reset and an explicit 1180 px readable content width.
2. P1: a broad text-color rule changed the progress and focus-card copy from white to navy. Fixed with component-level contrast tokens for the saturated jelly surfaces.
3. P2: a legacy global `header` margin also affected nested card headers, making the task title appear detached from its list. Fixed by resetting nested headers inside the themed workspace only.

### Browser evidence

- Main content now begins immediately after the left rail: stage left 147.2 px, main left 179.2 px, page left 180.1 px.
- Dashboard content width is 1179.4 px and the hero width is 1162.4 px.
- Progress and focus-card computed text color is `rgb(255, 255, 255)`.
- Task-card header computed left margin is `0px`.
- No horizontal overflow was detected.

## Daily Plan Compact Layout Regression

- Source visual truth: `design-qa-assets/daily-plan-compact-fix/before.png`
- Revised desktop implementation: `design-qa-assets/daily-plan-compact-fix/after.png`
- Mobile implementation: `design-qa-assets/daily-plan-compact-fix/mobile-after.png`
- Full-view comparison: `design-qa-assets/daily-plan-compact-fix/comparison.png`
- Desktop viewport: 1280 x 720 CSS px, device scale factor 1.
- Mobile viewport: 390 x 844 CSS px, device scale factor 1.
- State: light mode, `jelly-blue`, daily-plan screen with five generated English tasks.

### Comparison history

1. P1: the 72 px drag icon inflated every task row to 97.6 px. It is now 20 px inside a 32 px hit target; desktop task rows measure about 66.4 px.
2. P1: page navigation retained the previous document scroll position, placing both daily-plan headings above the viewport. Navigation now resets the document to the top; both headings remain visible after switching from a scrolled settings page.
3. P1: task names used single-line truncation and became unreadable on the narrow mobile content column. Titles now wrap to two lines and remain readable; mobile rows measure about 71.4 px.
4. P2: filter spacing and progress spacing were too loose relative to the compact rows. They now use a smaller, consistent rhythm without changing the controls or task behavior.

### Fidelity surfaces

- Typography: titles retain the existing navy hierarchy and use a two-line mobile-safe treatment.
- Layout: left navigation, page structure, drag order, filters, editing, and deletion remain unchanged; only density and scroll restoration changed.
- Color and tokens: the existing Blueberry Jelly gradients, edges, shadows, and contrast are unchanged.
- Image quality: no raster assets were introduced or replaced.
- Copy and content: task data and labels are unchanged.
- Browser checks: no horizontal overflow at 1280 x 720 or 390 x 844; scroll reset verified from 572 px to 0 px on navigation.

final result: passed
