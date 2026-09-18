# JS Paint, as vendored for the North Durham Census

Upstream: https://github.com/1j01/jspaint — MIT, by Isaiah Odhner.
The original `LICENSE.txt` is kept beside this file and still applies.

This is an unmodified copy **except** that large optional features were removed
to keep the census repository a reasonable size. It went from 88MB to about 5MB.

## Removed

| Removed | Size | Why |
|---|---|---|
| `lib/tracky-mouse/` | 22MB | Webcam head-tracking. A real accessibility feature, but it needs a camera and is most of the download. |
| `lib/pdf.js/` | 13MB | Opening PDFs as images. |
| `images/bubblegum`, `modern`, `winter`, `occult` | 8MB | Alternate themes. The classic theme is the one this site wants. |
| `images/88x31`, `images/about`, `images/meta`, the demo video | 4MB | Promotional art. |
| `localization/` except `en` | 9MB | 29 other languages. |
| `.git`, `cypress/`, `discord-activity/`, `scripts/`, Electron and packaging files | 26MB | Version control, tests, and desktop-app plumbing that never runs in a browser. |

Three loader lines in `index.html` were commented out rather than deleted, so
restoring any of the folders above is all that is needed to bring the feature
back.

## Not removed

Everything that draws: `src/`, `styles/`, `lib/os-gui`, `lib/98.css`,
`lib/gif.js`, `images/classic`, `images/icons`, `images/cursors`, `audio/`.

## Updating

Clone upstream fresh, re-apply the deletions above, and check the browser
console is clean. Do not hand-edit `src/` — keep this a copy, so it stays easy
to update.
