/* =============================================================================
 * Three Views Spectrum Demonstrator  (threeViewsSpectra005.swf -> HTML5)
 *
 * Behaviour is a direct port of the decompiled ActionScript 1:
 *   - Symbol 17, frame 1  : setTelescopePosition(), the path/snap/intensity data
 *   - Symbol 2 "Telescope": TelescopeClass press / mouse-move / release drag
 *   - main timeline       : setIntensities()
 *
 * Every constant, table and formula below is verbatim from that source. All
 * geometry is expressed in the ORIGINAL Flash stage coordinate system; the SVG
 * viewBox does the scaling, so none of the maths depends on the display size.
 * ========================================================================== */

'use strict';

/* ===================== VERBATIM DATA FROM THE ACTIONSCRIPT ================= */

/* Symbol 17 sits on the main timeline at this stage position, so
   sprite coordinates + this offset = stage (viewBox) coordinates. */
const SPRITE_X = 135.7;
const SPRITE_Y = 448.85;

/* 180 / PI, exactly as it is spelled out in the AS source. */
const DEG = 57.29577951308232;

const START_POINT = { x: 69, y: 7 };

/* Six quadratic Bezier arcs: cx/cy = control point, ax/ay = anchor (end) point.
   Each arc starts where the previous one ended. */
const POINTS_LIST = [
  { cx:  47.2, cy:  -38.6, ax:  54.0, ay:  -79.4 },
  { cx:  63.4, cy: -135.8, ax: 101.9, ay: -175.8 },
  { cx: 153.0, cy: -228.9, ax: 232.0, ay: -237.4 },
  { cx: 279.4, cy: -242.5, ax: 334.0, ay: -214.2 },
  { cx: 358.6, cy: -201.3, ax: 377.9, ay: -213.3 },
  { cx: 428.7, cy: -244.9, ax: 494.0, ay: -208.0 }
];

const CLOUD_PARAMS = { r: 58, x: 246, y:  -60 };
const BULB_PARAMS  = { r: 36, x: 438, y:  -90 };

/* The three positions the telescope snaps to, with their pre-computed angles. */
const SNAP_POINTS = [
  { i: 0, t: 0.60, x:  53.13600, y:  -45.99200, rot:  -6.19883731350571 },
  { i: 2, t: 0.96, x: 225.72464, y: -236.64864, rot:  82.47803492394950 },
  { i: 5, t: 0.32, x: 411.89680, y: -226.50960, rot:  80.09581678702630 }
];

const SNAP_R = 40;          /* snap radius, stage units                        */
const N      = 50;          /* samples per arc used by the nearest-point search */

/* Authored (pre-script) placement of the telescope inside Symbol 17. */
const TELESCOPE_AUTHORED = { x: 61.7, y: -134.05, rot: 0 };

/* The first thing the original frame script does. */
const INITIAL_TARGET = { x: 226, y: -237 };

/* NOTE: the AS also declares "var fallOffFraction = 3.5;" inside
   setTelescopePosition but never uses it - the intensity formula below uses the
   literal 3. The dead variable is deliberately not reproduced. */

/* =============================== STATE ==================================== */

let state = null;
let els   = null;

function initialState() {
  return {
    telescope: { x: TELESCOPE_AUTHORED.x, y: TELESCOPE_AUTHORED.y, rot: TELESCOPE_AUTHORED.rot },
    ghost:     { x: 0, y: 0, rot: 0, visible: false },
    pathU:     0,          /* arc index + t of the free point on the path      */
    /* _alpha values (0-100) exactly as setIntensities() writes them; these can
       legitimately be NaN, see setIntensities(). */
    alphaContinuous: 0,
    alphaEmission:   0,
    alphaAbsorption: 0,
    mc: 0,                 /* how much of the view the gas cloud fills (0-1)   */
    bc: 0,                 /* how much of the view the light bulb fills (0-1)  */
    dragging: false,
    focused:  false
  };
}

/* ======================= PORTED SIMULATION LOGIC ========================== */

/* main timeline, frame 1:
 *   spectrometerMC.continuousMC._alpha = 100 * cI;  (etc.)
 * cI can be undefined in one branch of the original, which makes _alpha NaN.
 * The NaN is preserved here and turned into "fully transparent" at draw time,
 * which is what the Flash player did with it. */
function setIntensities(cI, eI, aI) {
  state.alphaContinuous = 100 * cI;
  state.alphaEmission   = 100 * eI;
  state.alphaAbsorption = 100 * aI;
}

/* Fraction of the telescope's field filled by a source, 0-1.
 *   angularWidth = asin(r / d)          -- angular radius of the source
 *   coverage     = 3 * (1 - offset / angularWidth), clamped to [0, 1] */
function sourceCoverage(params, p) {
  const x = params.x - p.x;
  const y = params.y - p.y;
  const d = Math.sqrt(x * x + y * y);
  let saw = params.r / d;
  if (saw > 1) {
    saw = 1;
  }
  const angularWidth  = DEG * Math.asin(saw);
  const pointingAngle = Math.abs(p.rot - DEG * Math.atan2(y, x));
  let c = 3 * (1 - pointingAngle / angularWidth);
  if (c > 1) {
    c = 1;
  } else if (c < 0) {
    c = 0;
  }
  return c;
}

/* Symbol 17, frame 1: setTelescopePosition(tx, ty).
 * tx / ty are in Symbol 17's (sprite) coordinates, i.e. what _xmouse/_ymouse
 * gave the original. */
function setTelescopePosition(tx, ty) {
  const pL   = POINTS_LIST;
  const n    = N;
  const step = 1 / n;

  let minD2 = Infinity;
  let best  = {};
  let x0    = START_POINT.x;
  let y0    = START_POINT.y;

  /* Walk every arc, sample it n+1 times, keep the sample closest to (tx, ty). */
  for (let i = 0; i < pL.length; i++) {
    const x1 = pL[i].cx, y1 = pL[i].cy;
    const x2 = pL[i].ax, y2 = pL[i].ay;

    let minD2ThisArc = Infinity;
    let minPtThisArc = {};

    for (let j = 0; j <= n; j++) {
      const t  = j * step;
      const k0 = (1 - t) * (1 - t);
      const k1 = 2 * t * (1 - t);
      const k2 = t * t;
      const x  = k0 * x0 + k1 * x1 + k2 * x2;
      const y  = k0 * y0 + k1 * y1 + k2 * y2;
      const dx = tx - x;
      const dy = ty - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < minD2ThisArc) {
        minD2ThisArc = d2;
        minPtThisArc = { i: i, t: t, x: x, y: y };
      }
    }

    if (minD2ThisArc < minD2) {
      minD2 = minD2ThisArc;
      best  = minPtThisArc;

      /* Heading = direction of the chord between the samples either side,
         turned 90 degrees so the telescope looks across the track. */
      let t  = best.t - step;
      let k0 = (1 - t) * (1 - t);
      let k1 = 2 * t * (1 - t);
      let k2 = t * t;
      const xb = k0 * x0 + k1 * x1 + k2 * x2;
      const yb = k0 * y0 + k1 * y1 + k2 * y2;

      t  = best.t + step;
      k0 = (1 - t) * (1 - t);
      k1 = 2 * t * (1 - t);
      k2 = t * t;
      const xa = k0 * x0 + k1 * x1 + k2 * x2;
      const ya = k0 * y0 + k1 * y1 + k2 * y2;

      best.rot = 90 + DEG * Math.atan2(ya - yb, xa - xb);
    }

    x0 = x2;
    y0 = y2;
  }

  /* The ghost always follows the free point on the path. */
  state.ghost.x   = best.x;
  state.ghost.y   = best.y;
  state.ghost.rot = best.rot;
  state.pathU     = best.i + best.t;

  /* The real telescope only moves when the free point is close enough to one
     of the three viewing positions; otherwise it stays exactly where it was. */
  const snapR2 = SNAP_R * SNAP_R;
  for (let i = 0; i < SNAP_POINTS.length; i++) {
    const snapPt = SNAP_POINTS[i];
    const dx = best.x - snapPt.x;
    const dy = best.y - snapPt.y;
    if (dx * dx + dy * dy < snapR2) {
      const p = snapPt;

      state.telescope.x   = p.x;
      state.telescope.y   = p.y;
      state.telescope.rot = p.rot;

      const mc = sourceCoverage(CLOUD_PARAMS, p);   /* cold, thin gas cloud   */
      const bc = sourceCoverage(BULB_PARAMS,  p);   /* incandescent light bulb */
      state.mc = mc;
      state.bc = bc;

      let cI, eI, aI;
      if (bc > 0 && mc === 0) {
        /* bulb only -> continuous spectrum */
        cI = bc;
        eI = 0;
        aI = 0;
      } else if (mc > 0 && bc === 0) {
        /* gas cloud only -> emission spectrum */
        eI = mc;
        cI = 0;
        aI = 0;
      } else if (bc > 0 && mc > 0) {
        if (bc === 1) {
          /* bulb seen through the cloud -> absorption spectrum */
          cI = 0;
          eI = 0;
          aI = 1;
        } else {
          /* Partial overlap. The original leaves cI unassigned here, so
             continuousMC._alpha becomes NaN (drawn as transparent). */
          aI = bc;
          eI = 1 - bc;
        }
      } else {
        /* nothing in view */
        cI = eI = aI = 0;
      }

      setIntensities(cI, eI, aI);
      break;
    }
  }
}

/* Point on the path for a global parameter u in [0, 6] (arc index + t). Used by
 * the keyboard/slider path, which then goes through setTelescopePosition() so
 * both input methods run exactly the same snapping code. */
function pathPoint(u) {
  let i = Math.floor(u);
  let t = u - i;
  if (i >= POINTS_LIST.length) {
    i = POINTS_LIST.length - 1;
    t = 1;
  }
  const s  = (i === 0) ? START_POINT
                       : { x: POINTS_LIST[i - 1].ax, y: POINTS_LIST[i - 1].ay };
  const a  = POINTS_LIST[i];
  const k0 = (1 - t) * (1 - t);
  const k1 = 2 * t * (1 - t);
  const k2 = t * t;
  return {
    x: k0 * s.x + k1 * a.cx + k2 * a.ax,
    y: k0 * s.y + k1 * a.cy + k2 * a.ay
  };
}

/* ========================= DERIVED DESCRIPTIONS =========================== */

/* Flash _alpha -> SVG opacity. NaN (see setIntensities) means "not drawn". */
function opacityOf(alpha) {
  return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha / 100)) : 0;
}

const SPECTRUM_TEXT = {
  continuous: {
    name:   'Continuous spectrum',
    detail: 'a smooth, unbroken band of colour running from violet on the left, ' +
            'through blue, green and yellow, to red on the right'
  },
  absorption: {
    name:   'Absorption spectrum',
    detail: 'a continuous band of colour interrupted by five narrow dark gaps, ' +
            'at the same places where the emission lines appear'
  },
  emission: {
    name:   'Emission spectrum',
    detail: 'a dark band crossed by five narrow bright lines: two violet, ' +
            'one blue, one blue-green and one red'
  }
};

/* Which spectra are actually visible on the screen right now. */
function activeSpectra() {
  const out = [];
  if (opacityOf(state.alphaContinuous) > 0) { out.push('continuous'); }
  if (opacityOf(state.alphaAbsorption) > 0) { out.push('absorption'); }
  if (opacityOf(state.alphaEmission)   > 0) { out.push('emission');   }
  return out;
}

function spectrumName() {
  const a = activeSpectra();
  if (a.length === 0) { return 'No spectrum'; }
  if (a.length === 1) { return SPECTRUM_TEXT[a[0]].name; }
  return 'Blend of ' + a.join(' and ') + ' spectra';
}

function spectrumDetail() {
  const a = activeSpectra();
  if (a.length === 0) {
    return 'The spectrometer screen is dark: no spectrum is being recorded.';
  }
  if (a.length === 1) {
    return SPECTRUM_TEXT[a[0]].name + ': ' + SPECTRUM_TEXT[a[0]].detail + '.';
  }
  return 'A blend of ' + a.join(' and ') + ' spectra: ' +
         a.map(function (k) { return SPECTRUM_TEXT[k].detail; }).join('; ') + '.';
}

/* Short spoken form, e.g. "an emission spectrum". */
function spectrumPhrase() {
  const a = activeSpectra();
  if (a.length === 0) { return 'no spectrum'; }
  if (a.length === 1) { return 'a' + (a[0] === 'absorption' || a[0] === 'emission' ? 'n ' : ' ') + a[0] + ' spectrum'; }
  return 'a blend of ' + a.join(' and ') + ' spectra';
}

/* What the telescope is looking at, derived from the ported coverage values. */
function aimPhrase() {
  if (state.bc > 0 && state.mc === 0) { return 'aimed directly at the light bulb'; }
  if (state.mc > 0 && state.bc === 0) { return 'aimed at the gas cloud'; }
  if (state.bc > 0 && state.mc > 0)   { return 'aimed at the light bulb through the gas cloud'; }
  return 'aimed at empty space';
}

function tiltPhrase() {
  const r = Math.round(state.telescope.rot);
  if (r === 0) { return 'level with the horizontal'; }
  return Math.abs(r) + ' degrees ' + (r > 0 ? 'clockwise' : 'counter-clockwise') +
         ' from horizontal';
}

/* Slider value <-> path parameter. 120 steps span the whole path. */
const SLIDER_MAX = 120;
function uFromSlider(v) { return v / (SLIDER_MAX / POINTS_LIST.length); }
function sliderFromU(u) { return Math.round(u * (SLIDER_MAX / POINTS_LIST.length)); }
function percentAlongPath() {
  return Math.round((state.pathU / POINTS_LIST.length) * 100);
}

function valueText() {
  return percentAlongPath() + ' percent along the path; telescope ' + tiltPhrase() +
         ', ' + aimPhrase() + '; ' + spectrumPhrase() + '.';
}

function skyDescription() {
  return 'A black sky. A cold, thin gas cloud lies at the centre and an ' +
         'incandescent light bulb to its right; a curved track arcs over both of ' +
         'them. The telescope is ' + percentAlongPath() + ' percent along the track, ' +
         'pointing ' + tiltPhrase() + ', ' + aimPhrase() + '.';
}

/* ============================== RENDERING ================================= */

/* Single render(): everything on screen is redrawn from state, every time. */
function render() {
  const t = state.telescope;
  const g = state.ghost;

  els.telescopeGroup.setAttribute(
    'transform',
    'translate(' + (SPRITE_X + t.x).toFixed(3) + ',' + (SPRITE_Y + t.y).toFixed(3) + ') ' +
    'rotate(' + t.rot.toFixed(4) + ')'
  );

  els.ghostGroup.setAttribute(
    'transform',
    'translate(' + (SPRITE_X + g.x).toFixed(3) + ',' + (SPRITE_Y + g.y).toFixed(3) + ') ' +
    'rotate(' + g.rot.toFixed(4) + ')'
  );
  /* AS: ghostTelescopeMC._alpha = 30 while dragging, 0 otherwise. */
  els.ghostGroup.setAttribute('opacity', g.visible ? '0.3' : '0');
  els.ghostGroup.setAttribute('visibility', g.visible ? 'visible' : 'hidden');

  els.spectrumContinuous.setAttribute('opacity', String(opacityOf(state.alphaContinuous)));
  els.spectrumEmission.setAttribute('opacity',   String(opacityOf(state.alphaEmission)));
  els.spectrumAbsorption.setAttribute('opacity', String(opacityOf(state.alphaAbsorption)));

  els.sky.classList.toggle('is-dragging', state.dragging);
  els.sky.classList.toggle('is-focused',  state.focused);

  els.spectrumNameOut.textContent = spectrumName();
  els.specDesc.textContent        = spectrumDetail();
  els.skyDesc.textContent         = skyDescription();

  els.slider.setAttribute('aria-valuetext', valueText());
}

function announce(message) {
  els.status.textContent = message;
}

function fullDescription() {
  return 'Telescope ' + percentAlongPath() + ' percent along the path, pointing ' +
         tiltPhrase() + ', ' + aimPhrase() + '. Spectrometer: ' + spectrumDetail();
}

/* ============================ INPUT HANDLING ============================== */

/* Client coordinates -> Symbol 17 (sprite) coordinates. The SVG keeps its
   viewBox aspect ratio (width:100%; height:auto), so a simple rectangle
   mapping is exact at any display size and at any zoom level. */
function toSpriteCoords(clientX, clientY) {
  const r  = els.sky.getBoundingClientRect();
  const vb = els.sky.viewBox.baseVal;
  const sx = r.width  / vb.width;
  const sy = r.height / vb.height;
  return {
    x: vb.x + (clientX - r.left) / sx - SPRITE_X,
    y: vb.y + (clientY - r.top)  / sy - SPRITE_Y
  };
}

function onPointerMove(e) {
  if (!state.dragging) { return; }
  e.preventDefault();
  const p = toSpriteCoords(e.clientX, e.clientY);
  setTelescopePosition(p.x, p.y);
  els.slider.value = String(sliderFromU(state.pathU));
  render();
}

function endDrag() {
  if (!state.dragging) { return; }
  state.dragging    = false;
  state.ghost.visible = false;          /* AS: ghostTelescopeMC._alpha = 0 */
  window.removeEventListener('pointermove',   onPointerMove);
  window.removeEventListener('pointerup',     endDrag);
  window.removeEventListener('pointercancel', endDrag);
  render();
  announce(fullDescription());
}

/* AS TelescopeClass.onPress */
function onTelescopePointerDown(e) {
  e.preventDefault();
  state.dragging      = true;
  state.ghost.x       = state.telescope.x;
  state.ghost.y       = state.telescope.y;
  state.ghost.rot     = state.telescope.rot;
  state.ghost.visible = true;

  /* Click-to-focus: after a click or tap the arrow keys move the telescope
     straight away, without having to Tab to the control first. */
  els.slider.focus({ preventScroll: true });
  state.focused = (document.activeElement === els.slider);

  window.addEventListener('pointermove',   onPointerMove, { passive: false });
  window.addEventListener('pointerup',     endDrag);
  window.addEventListener('pointercancel', endDrag);
  render();
}

/* Keyboard / slider path: identical maths, identical snapping. */
function onSliderInput() {
  const p = pathPoint(uFromSlider(Number(els.slider.value)));
  setTelescopePosition(p.x, p.y);
  render();
}

/* Mouse wheel adjusts the focused value control by one step. */
function onSliderWheel(e) {
  if (document.activeElement !== els.slider) { return; }
  e.preventDefault();
  const dir = (e.deltaY < 0) ? 1 : -1;
  const next = Math.min(SLIDER_MAX, Math.max(0, Number(els.slider.value) + dir));
  if (next === Number(els.slider.value)) { return; }
  els.slider.value = String(next);
  onSliderInput();
  announce(fullDescription());
}

/* ============================== RESET ===================================== */

/* Restore the exact state the original frame script leaves behind on load. */
function resetSim(quiet) {
  state = initialState();
  setTelescopePosition(INITIAL_TARGET.x, INITIAL_TARGET.y);
  /* AS: ghostTelescopeMC._alpha = 0. The ghost only reappears if the position
     control still holds keyboard focus (the drag-equivalent state). */
  state.focused       = (document.activeElement === els.slider);
  state.ghost.visible = state.focused;
  els.slider.value = String(sliderFromU(state.pathU));
  render();
  if (!quiet) {
    announce('Simulation reset. ' + fullDescription());
  }
}

/* ================================ INIT ==================================== */

/* Foundation hook. This demonstrator displays no mathematics, so there is no
   equation to typeset - see CONVERSION_NOTES.md. */
function klunlInitEqn() { /* intentionally empty */ }
window.klunlInitEqn = klunlInitEqn;

function init() {
  els = {
    sky:                document.getElementById('sky-svg'),
    telescopeGroup:     document.getElementById('telescope-group'),
    telescopeHit:       document.getElementById('telescope-hit'),
    ghostGroup:         document.getElementById('ghost-group'),
    spectrumContinuous: document.getElementById('spectrum-continuous'),
    spectrumEmission:   document.getElementById('spectrum-emission'),
    spectrumAbsorption: document.getElementById('spectrum-absorption'),
    spectrumNameOut:    document.getElementById('spectrum-name'),
    specDesc:           document.getElementById('spec-svg-desc'),
    skyDesc:            document.getElementById('sky-svg-desc'),
    slider:             document.getElementById('telescope-position'),
    status:             document.getElementById('sr-status')
  };

  els.slider.max  = String(SLIDER_MAX);
  els.slider.min  = '0';
  els.slider.step = '1';

  els.telescopeHit.addEventListener('pointerdown', onTelescopePointerDown);

  els.slider.addEventListener('input', onSliderInput);
  els.slider.addEventListener('wheel', onSliderWheel, { passive: false });

  /* The ghost telescope marks the free point on the track while the position
     control has focus, mirroring what a mouse drag shows. */
  els.slider.addEventListener('focus', function () {
    state.focused       = true;
    state.ghost.visible = true;
    render();
  });
  els.slider.addEventListener('blur', function () {
    state.focused       = false;
    state.ghost.visible = state.dragging;
    render();
  });

  /* Reset comes from the shared masthead component (bubbling, composed). */
  document.addEventListener('sim-reset', function () { resetSim(false); });

  resetSim(true);
  klunlInitEqn();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
