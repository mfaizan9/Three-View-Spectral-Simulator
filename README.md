# Three Views Spectrum Demonstrator (HTML5)

**This simulation must be served over HTTP. It will not run from a double-clicked
`index.html` (a `file://` path).**

## Why

The shared KL-UNL masthead component (`foundation/kl-unl-masthead.js`) loads the
simulation title and the Help / About text with
`fetch('foundation/contents.json')`. Browsers block `fetch()` of local files under
the `file://` protocol for security (the same-origin policy), so opening
`index.html` directly gives you a page with an empty or broken masthead — no
title, no Reset, no Help, no About. Served over HTTP the fetch succeeds and the
simulation loads normally.

## How to run it locally

Open a terminal **inside this `html5/` folder** and use any static file server:

```bash
python3 -m http.server 8123
```

then open <http://localhost:8123/>

```bash
npx serve
```

(or `npx http-server`) — follow the URL it prints.

In VS Code, the **Live Server** extension works too: right-click `index.html`
and choose *Open with Live Server*.

Because you are serving from inside `html5/`, the simulation sits at the server
root — the URL is `http://localhost:8123/`, **not**
`http://localhost:8123/html5/index.html`.

On Windows, `python3` is usually just `python`:

```bash
python -m http.server 8123
```

## In production

When the folder is deployed to the cloud host it is already served over
HTTP/HTTPS, so it simply works. The `file://` limitation only affects local
double-clicking.

## What is in this folder

```
index.html            page scaffold: KL-UNL shell + <kl-unl-masthead> + panels
simulation.js         all simulation logic (ported from the ActionScript 1 source)
styles/styles.css     sim-specific styles only
foundation/           the shared KL-UNL files, copied in unchanged
assets/               the exported Flash vector art, reused as-is
CONVERSION_NOTES.md   behaviour model, AS -> HTML5 mapping, deviations
ACCESSIBILITY.md      WCAG affordances, keyboard map, screen-reader wording
```

There is no build step, no bundler, no framework and no CDN. Every file is
local; the only network requests the page makes are for its own files plus
`foundation/contents.json`.
