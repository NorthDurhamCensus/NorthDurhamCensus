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

## Map data — `geo/*.geojson`

- Durham Region Open Data — regional trails, parks and recreation, libraries and
  community halls. https://opendata.durham.ca
- OpenStreetMap contributors, ODbL. https://www.openstreetmap.org/copyright

## Census listings, events and stories — `data/*.js`

Gathered and verified by local volunteers. MIT, like the rest of the project.
