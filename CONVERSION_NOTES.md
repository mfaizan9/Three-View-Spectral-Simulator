# Conversion Notes — Three Views Spectrum Demonstrator

Source: `threeViewsSpectra005.swf` (Flash 6 / ActionScript 1, 700 × 500 stage,
12 fps, black background), decompiled with JPEXS/FFDec 26.2.1.
Output: `html5/`, sim-id **`threeviewsspectra`**.

---

## Behaviour model

A telescope sits on an invisible curved track that arcs over two light sources
floating in space: a cold, thin gas cloud on the left and an incandescent light
bulb on the right. The user drags the telescope; while the mouse is down a
30 %-opacity "ghost" telescope follows the nearest point on the track, and the
real telescope jumps to whichever of **three** fixed viewing positions the ghost
comes within 40 stage units of. At each of those positions the code works out how
much of the telescope's field of view the cloud and the bulb each fill, and from
that decides which of three stacked spectrum images the spectrometer at the top of
the screen shows: **continuous** (bulb alone), **emission** (cloud alone) or
**absorption** (bulb seen through the cloud). Nothing animates and nothing is
random — the whole demonstrator is that one drag plus a lookup.

---

## Where the original code lives

| Decompiled source | What it does |
| --- | --- |
| `scripts/DefineSprite_17/frame_1/DoAction.as` | `setTelescopePosition()`, the path table, `cloudParams`, `bulbParams`, the three snap points, and the intensity branching. Also the load-time call `setTelescopePosition(226, -237)`. |
| `scripts/Telescope.as` (Symbol 2, linkage `Telescope`) | `TelescopeClass` press / mouse-move / release drag, and the ghost's alpha. |
| `scripts/frame_1/DoAction.as` | `setIntensities(cI, eI, aI)` → the three `_alpha` values. |
| `texts/27.txt` | The on-screen instruction sentence (used verbatim). |
| `texts/8.txt` | The `SPECTROMETER` wordmark. |

---

## ActionScript → HTML5 mapping

| ActionScript 1 | HTML5 |
| --- | --- |
| `Object.registerClass("Telescope", TelescopeClass)` + `p.onPress` / `onMouseMoveFunc` / `onRelease` | Pointer Events on the telescope's transparent hit rectangle (`pointerdown` → `pointermove`/`pointerup` on `window`), plus an equivalent keyboard path. |
| `_parent._xmouse / _ymouse` | `toSpriteCoords()` maps client coordinates through the SVG's `viewBox` scale back into Symbol 17's coordinate system. |
| `setTelescopePosition(tx, ty)` | Ported line for line in `simulation.js`, including the 6 × 51 sample search, the `t ± step` tangent used for the heading, and the `90 + atan2(...)` convention. |
| `_x` / `_y` / `_rotation` | `transform="translate(x,y) rotate(deg)"` on an SVG `<g>`. Flash `_rotation` and SVG `rotate()` are both clockwise in screen coordinates, so the value carries over unchanged. |
| `_alpha` (0–100) | SVG `opacity` (0–1). |
| `ghostTelescopeMC._alpha = 30 / 0` | `opacity="0.3"` / hidden. |
| `setIntensities()` writing three `_alpha`s | Three `opacity` attributes on the three stacked spectrum images. |
| `updateAfterEvent()` | Dropped (no-op in a browser). |
| `getTimer()`, `onEnterFrame` | Not used by this sim — there is no animation and no timing loop. |
| `trace()` | Dropped. |

### Constants copied verbatim

`startPoint`, the six-arc `pointsList`, `cloudParams = {r:58, x:246, y:-60}`,
`bulbParams = {r:36, x:438, y:-90}`, the three snap points with their stored
rotations, `snapR = 40`, `n = 50`, the degree constant `57.29577951308232`, the
literal `3` in the coverage formula, and the load-time target `(226, -237)`.

Two faithful quirks are preserved and commented in the code:

* **`fallOffFraction = 3.5` is dead.** The original declares it inside
  `setTelescopePosition` but the coverage formula uses the literal `3`. The dead
  variable is not reproduced; the literal `3` is.
* **`cI` is left unassigned in one branch.** When the bulb is partly covered
  (`bc > 0 && mc > 0 && bc !== 1`) the original assigns only `aI` and `eI`, so
  `continuousMC._alpha` becomes `NaN`. The port keeps the `NaN` and turns it into
  "fully transparent" at draw time, which is what the Flash player did with it.
  With the three snap points that actually exist this branch is never reached, but
  it is ported rather than silently repaired.

### Verified behaviour

The three viewing positions produce exactly the three spectra, matching a hand
calculation of the original formulas:

| Snap point (sprite coords) | cloud fill `mc` | bulb fill `bc` | result |
| --- | --- | --- | --- |
| `(53.136, −45.992)`, rot −6.199° | 1 | 1 | **absorption** (`aI = 1`) |
| `(225.725, −236.649)`, rot 82.478° | 1 | 0 | **emission** (`eI = 1`) |
| `(411.897, −226.510)`, rot 80.096° | 0 | 1 | **continuous** (`cI = 1`) |

Between snap points the telescope does not move and the spectrometer does not
change — exactly as in the original. On load the demonstrator opens on the
emission view, as the original's `setTelescopePosition(226, -237)` does.

---

## Assets: reused, not redrawn

Every visual element in this demonstrator is exported Flash art. **Nothing is
code-drawn** — the original contains no `createEmptyMovieClip` / `beginFill` /
`drawArc` geometry at all — so no artwork was recreated by hand and no `<canvas>`
drawing was needed. The exported vector shapes are placed as SVG `<image>`
elements at their original stage coordinates and scales.

| `assets/` file | Decompiled source | Original symbol |
| --- | --- | --- |
| `telescope.svg` | `shapes/1.svg` | Symbol 1 (inside Symbol 2 `Telescope` and Symbol 16 ghost) |
| `spectrometer-case.svg` | `shapes/3.svg` | Symbol 3 |
| `spectrometer-face.svg` | `shapes/4.svg` | Symbol 5 (drawn at 75 % alpha) |
| `spectrometer-trim.svg` | `shapes/6.svg` | Symbol 6 (screws + name plate) |
| `spectrometer-screen.svg` | `shapes/18.svg` | main-timeline black screen rectangle |
| `spectrum-continuous.svg` | `shapes/21.svg` | Symbol 22 `continuousMC` |
| `spectrum-absorption.svg` | `shapes/19.svg` | Symbol 20 `absorptionMC` |
| `spectrum-emission.svg` | `shapes/23.svg` | Symbol 24 `emissionMC` |
| `gas-cloud-back.svg` | `shapes/9.svg` | Symbol 10 (66 % alpha) |
| `gas-cloud-mid.svg` | `shapes/11.svg` | Symbol 12 (66 % alpha) |
| `gas-cloud-front.svg` | `shapes/13.svg` | Symbol 14 (66 % alpha) |
| `lightbulb.svg` | `shapes/15.svg` | Symbol 15 |

The **only** change made to the exported files is an added
`viewBox="0 0 <width> <height>"` on the root `<svg>`. FFDec exports these shapes
with a pixel `width`/`height` but no `viewBox`, and without one an SVG cannot be
scaled to a different box — the content would be clipped instead. No path data,
colour, gradient or opacity was touched.

Placement was taken from the XFL export of the timeline, so every element sits at
its original position: the sprite that holds the space scene is at stage
`(135.7, 448.85)`, the spectrometer's parts carry the original `0.6778` and
`0.6001` scale factors, and so on. The three cloud layers each carry their own
66 % alpha (as in the original) rather than a single group opacity, which would
composite differently.

The `SPECTROMETER` wordmark is the one piece of art rendered as live text rather
than as a shape, so that it scales with browser zoom and is available to a screen
reader. It is recoloured — see ACCESSIBILITY.md.

---

## Layout

The original stage is a single 700 × 500 black field: spectrometer top-left,
instruction paragraph top-right, the space scene across the middle and bottom.
The KL-UNL version keeps that arrangement as three panels —

* **Spectrometer** (top-left) — the instrument, plus a "Currently showing:" readout,
* **How to Use This Demonstrator** (top-right) — the verbatim instruction text,
* **Space View** (full width, below) — the scene and the telescope position control,

— using `.app-shell`, `.app-layout`, `.panel`, `.panel__heading`,
`.panel__canvas-wrap`, `.control-fieldset` and `.control-row__slider` from the
foundation. Below 56 rem the foundation's own breakpoint collapses the layout to
a single column, and the panels are re-ordered to **Space View → Spectrometer →
How to Use** (CSS `order` in `styles/styles.css`) so that on a phone the thing the
user operates comes first; see ACCESSIBILITY.md for why that reorder is safe.

The space-view SVG uses `viewBox="115 140 585 360"`, i.e. the original stage
coordinate system cropped to the region the scene actually occupies (the top-left
of the stage held the spectrometer and text, which now live in their own panels).
All ported maths still runs in unmodified Flash stage coordinates; the `viewBox`
does all the scaling, so pointer hit-testing and the snapping arithmetic are
identical at any display size or zoom level.

**Divergences from the screenshot, and why:**

* The original's white-on-black instruction text is now dark text on the KL-UNL
  white panel background (foundation palette; Goal B outranks Goal C).
* The wordmark colour changed for contrast (see ACCESSIBILITY.md).
* A "Currently showing:" readout and a **Position along the path** slider were
  added. The readout exists so the spectrum type is not conveyed by picture
  alone; the slider is the keyboard equivalent of the mouse drag. Neither changes
  the physics or the state machine — both read from and write to the same state
  the drag does.

---

## contents.json

`foundation/contents.json` was copied in **byte-for-byte unchanged**: the shared
file already contains a `threeviewsspectra` entry
(`meta.title = "Three Views Spectrum Demonstrator"`, `meta.version = "2.0"`, plus
Help and About text). No entry needed to be added, and nothing in the foundation
was edited. `kl-unl-masthead.js`, `kl-unl.css` and `kl-unl.js` are byte-for-byte
copies as well.

---

## Mathematics / MathJax

**This demonstrator displays no mathematics.** The original shows one prose
sentence, the word `SPECTROMETER`, and pictures — no equations, no formulas, no
variables, no numeric readouts, no units on screen. Nothing was invented for the
conversion, so there is nothing for MathJax to typeset and no MathJax bundle is
loaded. The foundation's `kl-unl.js` is still included and `klunlInitEqn()` is
redefined in `simulation.js` per the pipeline protocol; it is simply empty. If a
future revision adds a displayed quantity, it must go through
`klunlShowEquation()` as LaTeX.

Numbers that exist only in speech (the telescope's position as a percentage of
the path and its tilt in degrees) are delivered through `aria-valuetext` and the
live region, always with their quantity name and unit.

---

## Animation, timing and reset

There is no animation to port: the original has no `onEnterFrame`, no tween and
no timer, so there is nothing that runs for more than 5 s, nothing that flashes,
and no Pause button is required. `prefers-reduced-motion` is still honoured in
`styles/styles.css` so any future transition inherits the behaviour.

Reset is the masthead's — `simulation.js` listens for the bubbling, composed
`sim-reset` event and calls `resetSim()`, which rebuilds the state object from
scratch and re-runs the original's load-time `setTelescopePosition(226, -237)`,
returning the demonstrator to the exact state it opens in. No second Reset button
was added.

---

## Browser notes

Everything used here is long-standing, standards-based and prefix-free: inline
SVG with `viewBox`, SVG `<image>` (with both `href` and `xlink:href` for older
WebKit), CSS grid/flexbox, `accent-color`, Pointer Events, and a native
`<input type="range">`. Pointer coordinates are mapped with
`getBoundingClientRect()` rather than `getScreenCTM()`, which avoids the one SVG
API with a history of engine differences. `touch-action: none` on the space view
keeps a touch drag from scrolling the page on iOS. No Chrome-only API is used and
no vendor-prefixed declaration stands alone. No per-browser difference was found
that needed working around.
