# Accessibility Notes — Three Views Spectrum Demonstrator

Target: **WCAG 2.1 AA** (ADA Title II), with AAA where it was free.
Everything below is implemented in `index.html`, `styles/styles.css` and
`simulation.js`. No foundation file was modified.

---

## Structure and landmarks

* `<html lang="en">`; one `<h1>` only — rendered by `<kl-unl-masthead>`, not
  duplicated in the page.
* `<main class="app-shell">` holds three `<section class="panel">` regions, each
  labelled by its own `<h2>` via `aria-labelledby`. Heading levels do not skip.
* A "Skip to main content" link (`.sr-only .sr-only-focusable`) is the first
  focusable element.
* DOM order is **spectrometer → instructions → space view**, which matches the
  visual order on desktop and tablet-landscape.
* **Below 56 rem the panels are re-ordered visually with CSS `order` to space view
  → spectrometer → instructions**, so the thing the user operates comes first on a
  phone. This is a deliberate visual reorder of three independent, separately
  headed `<section>` landmarks; the DOM/reading sequence itself is unchanged, and
  because the space view holds the only tab stop in the layout, focus order still
  runs straight down the page with no visible jump. Screen-reader users navigate
  these by heading or landmark, and each panel is self-contained, so no
  information depends on which of the three is encountered first.

---

## Text alternatives for the graphics

Both diagrams are inline SVG with `role="img"`, a `<title>` and an
`aria-describedby` description that `render()` rewrites from state on every
change, so an audio-only user always has the current picture in words.

* **Spectrometer** — e.g. *"Emission spectrum: a dark band crossed by five narrow
  bright lines: two violet, one blue, one blue-green and one red."* The wording
  for each of the three spectra describes its **pattern**, not only its colours.
* **Space view** — e.g. *"A black sky. A cold, thin gas cloud lies at the centre
  and an incandescent light bulb to its right; a curved track arcs over both of
  them. The telescope is 49 percent along the track, pointing 82 degrees
  clockwise from horizontal, aimed at the gas cloud."*

A sighted-and-visible readout, **"Currently showing: <spectrum type>"**, sits
under the instrument so the spectrum type is never carried by the picture alone.

---

## Colour and contrast

* Page chrome uses the foundation's palette variables; no Flash colours were
  hardcoded into the layout.
* **One colour change to the original art:** the `SPECTROMETER` wordmark. Flash
  drew it in `#d36488` on the dark-red name plate — about **2.5 : 1**, which fails
  AA. It is now `#ffffff`, which is **≥ 5.1 : 1** against the lightest stop of the
  plate's gradient. The wordmark is also real text rather than baked-in outlines,
  so it scales with zoom and is exposed to screen readers.
* The spectra themselves keep their physically meaningful colours — they are the
  subject matter. They are never the *only* signal: the spectrum type is stated in
  the visible readout, in the SVG description, in `aria-valuetext` and in the live
  region.
* The on-diagram focus indicator uses `--button-outline-color` (`#ffbc00`), about
  **12 : 1** against the black sky — well past the 3 : 1 required for a graphical
  indicator. (The foundation's `--outline-color` blue would only have reached
  3.4 : 1 on black.)

---

## Keyboard

Tab order, in order, and nothing else: **skip link → masthead Reset / Help /
About → Telescope position slider.** No other element carries `tabindex`. The
SVG diagrams, the readout, the labels and the instruction text are *not* tab
stops — they reach assistive technology through descriptions and the live region.

### The draggable telescope

The telescope is mouse- and touch-draggable, so it has a full keyboard
equivalent, and both paths mutate the same state object and run the same ported
`setTelescopePosition()`:

* **Tab to focus** — the object's keyboard control is a native
  `<input type="range">`, *Position along the path*, sitting directly under the
  space view inside a `Telescope` fieldset. A native range was chosen over a
  `role="slider"` proxy on purpose: it is guaranteed focusable and operable in
  every browser, including Safari with its non-default full-keyboard-access
  setting, which is exactly where custom proxies fail. While it holds focus, a
  yellow ring is drawn **around the telescope itself** in the diagram (in addition
  to the native focus ring on the slider), so the focused object is visually
  identified, and the ghost telescope appears — the same feedback a mouse drag
  gives.
* **Click to focus** — `pointerdown` on the telescope also calls `.focus()` on
  that slider, so after clicking or tapping the telescope the arrow keys move it
  immediately, without tabbing first.
* **Keys** — ← / ↓ step back, → / ↑ step forward (1/120 of the track, roughly
  5 stage units — the 40-unit snap zones are about 15 steps wide, so they are easy
  to land in), **PageUp / PageDown** move by a larger step, **Home / End** jump to
  the ends of the track. All of this is the native range behaviour; nothing is
  re-implemented and nothing can get stuck.
* **Mouse wheel** — scrolling up/down over the slider *while it is focused*
  changes it by one step; `preventDefault()` is called only in that case, so the
  page still scrolls normally everywhere else.
* Tab always moves away cleanly; there is no keyboard trap. Canvas/SVG pointer
  handling cannot swallow the keys because the focused element is a real form
  control outside the SVG.

The masthead dialog manages its own focus trap, Escape handling and focus
restoration; nothing here interferes with it.

---

## Screen-reader narration (NVDA + VoiceOver)

* `#sr-status` is an `aria-live="polite" aria-atomic="true"` region. It is written
  **on commit** — the end of a pointer drag, a wheel step, a Reset — never on every
  intermediate move, so it does not flood.
* Slider changes are announced by the slider's own `aria-valuetext` rather than
  being duplicated into the live region, so an arrow press produces exactly one
  utterance.
* **Every number is spoken with its quantity name and its unit**, spelled as
  words, never as a bare number or a bare symbol:
  * `aria-valuetext` — *"49 percent along the path; telescope 82 degrees clockwise
    from horizontal, aimed at the gas cloud; an emission spectrum."*
  * live region — *"Telescope 10 percent along the path, pointing 6 degrees
    counter-clockwise from horizontal, aimed at the light bulb through the gas
    cloud. Spectrometer: Absorption spectrum: a continuous band of colour
    interrupted by five narrow dark gaps…"*
  * Negative rotations are read as *"counter-clockwise"* rather than as a minus
    sign, which screen readers handle inconsistently.
* What the telescope is aimed at is **derived from the ported physics** (the cloud
  and bulb coverage values), not from a hardcoded list of positions, so the
  narration cannot drift out of step with the simulation.
* The one interactive control has a real `<label for="…">` inside a
  `<fieldset>`/`<legend>`. The decorative *Start* / *End* markers beside the
  slider are `aria-hidden` so they are not read twice.

---

## Zoom, text size and reflow

* Base type is `1.125rem` in the `.app-shell` and everything is sized in
  `rem`/`em`, so it tracks the browser's font setting. Headings, legends, labels
  and body copy are all at or above that floor.
* No fixed pixel heights anywhere, so nothing crops when text grows.
* Both diagrams are vector SVG scaled by their `viewBox` — they stay sharp at any
  zoom instead of blurring, and the `SPECTROMETER` wordmark scales with them as
  real text.
* Verified with no horizontal scrolling and no clipping or overlap at 1100 px,
  768 px (iPad portrait), 550 px (≈ 200 % zoom of a 1100 px window) and 390 px
  (phone portrait). At 390 px `document.documentElement.scrollWidth` equals the
  viewport width exactly.
* **No canvas-baked text exists**, so nothing had to stay behind at a fixed size.

---

## Touch

* Pointer Events give mouse, pen and touch one code path.
* `touch-action: none` on the space-view SVG stops a telescope drag from scrolling
  or zooming the page; the rest of the page scrolls normally.
* The telescope's transparent hit rectangle is the full 97 × 42 stage units of the
  artwork, which is comfortably over 44 CSS px at every supported width. The
  slider is `min-height: 2.75rem` and the masthead buttons come from the
  foundation's `.button` sizing.
* Nothing is revealed by `:hover` only.

---

## Motion

The original has no animation, no timer and no tween, so there is nothing that
runs longer than 5 s, nothing that flashes, and no Pause control is needed. A
`prefers-reduced-motion` rule is present in `styles/styles.css` so that any
transition added later inherits the correct behaviour automatically.

---

## Mathematics

Not applicable: the demonstrator displays no equation, formula, variable or
mathematical symbol, and none was invented during the conversion — see the
*Mathematics / MathJax* section of CONVERSION_NOTES.md. Quantities that exist only
in speech carry their units in `aria-valuetext` and the live region.

---

## Deviations from the original, and why

| Change | Reason |
| --- | --- |
| `SPECTROMETER` wordmark recoloured `#d36488` → `#ffffff` | 2.5 : 1 failed WCAG 1.4.3; white reaches ≥ 5.1 : 1 (WCAG 1.4.3). |
| Instruction text moved from white-on-black onto a KL-UNL panel | Foundation palette and template usage (Goal B). |
| Added the *Position along the path* slider | Keyboard equivalent of the mouse drag (WCAG 2.1.1). It drives the same state and the same ported snapping code, so behaviour is unchanged. |
| Added the *Currently showing* readout | The spectrum type must not depend on reading the picture (WCAG 1.4.1, 1.1.1). |
| Ghost telescope also shown while the slider has focus | Keyboard users get the same "where am I on the track" feedback that mouse users get from the drag. |
| On-diagram focus ring in `#ffbc00` rather than `--outline-color` | 12 : 1 vs 3.4 : 1 on the black sky (WCAG 1.4.11, 2.4.7). |

None of these touches the simulation's physics, constants or state machine.

---

## Still required

**Human screen-reader QA is still required.** This document records what was
built and how it was reasoned about and measured; it is not a substitute for
testing with **NVDA on Windows (Chrome and Firefox)** and **VoiceOver on macOS
(Safari and Chrome)** and on **iOS VoiceOver with touch**, by someone who uses
those tools. Keyboard-only operation and 200 % zoom should be re-checked by hand
after any future change.
