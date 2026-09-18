# Third-party components

Everything bundled here is redistributable. Nothing needs to be fetched from a
CDN at run time, so the site works offline and keeps working if an outside
service disappears.

## 98.css — `css/98.css`, `css/ms_sans_serif*.woff*`

Windows 98 window chrome, by Jordan Scales. MIT licence.
https://github.com/jdan/98.css

Vendored at v0.1.21. To update, replace the file from
`https://unpkg.com/98.css@<version>/dist/98.css` along with the four font files
beside it. Do not edit it in place; put overrides in `css/desktop.css`.

## React95 icon set — `assets/icons/*.png`

Desktop and title-bar icons, from the React95 project. MIT licence.
https://github.com/React95/React95

Taken from the `@react95/icons` package. Files were renamed to describe their
use (`folder.png`, `mail.png`) rather than their original catalogue numbers.
Four 16px icons (`info-16`, `question-16`, `bulb-16`, `earth-16`) were produced
by nearest-neighbour downscaling of their 32px originals, because the package
ships no 16px version of those.

## Webamp — `vendor/webamp/`

The Winamp window. By Jordan Eldredge. MIT licence.
https://github.com/captbaritone/webamp

Vendored as a single 939KB ES module rather than loaded from a CDN, on the
project's own advice: a free CDN can stop operating at any time.

**The skin is not MIT.** Webamp's README is explicit that "while the Winamp
name, interface, and sample audio file are surely property of Nullsoft, the code
within this project is released under the MIT License." The classic Winamp 2.91
skin is baked into the bundle. Every Webamp deployment carries the same
position; if that ever needs to change, pass your own `initialSkin` in
`js/apps/winamp.js`.

## JS Paint — `vendor/jspaint/`

The Paint window. By Isaiah Odhner. MIT licence.
https://github.com/1j01/jspaint

Vendored and pruned from 88MB to about 5MB. What was removed and why is in
`vendor/jspaint/NORTH-DURHAM-CENSUS-CHANGES.md`. The upstream `LICENSE.txt` is
kept beside it.

As with Webamp, the code is MIT; the appearance of MS Paint's icons and cursors
is Microsoft's.

## Music — `assets/audio/reaching-out.mp3`

"Reaching Out" by Kevin MacLeod (incompetech.com).
**Creative Commons Attribution 3.0** — https://creativecommons.org/licenses/by/3.0/

Converted from Ogg Vorbis to MP3 for browser compatibility; otherwise unchanged.
CC BY requires this attribution to travel with the file. See
`assets/audio/README.md`.

## Minesweeper — `js/apps/minesweeper.js`

Written for this project, MIT like the rest. Not derived from any existing
implementation: the board is drawn with CSS bevels and text rather than a sprite
sheet, so there is no artwork carrying anyone else's licence.

Worth recording why it was not borrowed. The two best-known browser Windows
desktops cannot be reused: `1j01/98` states it is "source-available ... but not
open source", and `pkage/98` carries no licence at all and was archived in 2020.
Of the standalone Minesweepers, most either ship Microsoft's original sprites —
which their MIT licences do not cover — or are AGPL-3.0.

## Map data — `geo/*.geojson`

- Durham Region Open Data — regional trails, parks and recreation, libraries and
  community halls. https://opendata.durham.ca
- OpenStreetMap contributors, ODbL. https://www.openstreetmap.org/copyright

## Census listings, events and stories — `data/*.js`

Gathered and verified by local volunteers. MIT, like the rest of the project.
