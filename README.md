# The North Durham Census

**A count of what actually counts.**
A community census of the senses across Scugog, Uxbridge and Brock Townships, Ontario.
An independent, volunteer-run project. Not affiliated with Statistics Canada.

The official census counts people. This one counts what a place can taste, see,
hear, make and share. Conventional advocacy says *look what we lack*. This census
says *look what we already have* — and asks why it stays invisible, unsupported
and unshared.

The site is a small Windows 98 desktop you can poke around in. Listings live in
folders by sense, events on a calendar, stories in a reader, and there is a
paperclip who has opinions.

---

## Run it

There is no build step, no npm install and no framework. Two ways to open it:

**Double-click `index.html`.** That is it. Everything works offline, including
the data, because the data files are plain JavaScript rather than fetched JSON.

**Or serve it locally**, which is closer to how it behaves when published:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish it

The site is entirely static, so it hosts anywhere that serves files:
GitHub Pages, Netlify, Cloudflare Pages, or a folder on any web server.

For **GitHub Pages**: push to `main`, then Settings → Pages → Deploy from a
branch → `main` / `/ (root)`. The `.nojekyll` file is already here, which stops
GitHub from hiding folders and breaking the icons.

## What's in here

```
index.html          the desktop
config.js           site name, contact address, the eight senses  ← start here
data/               listings, events, stories, resources          ← and here
  listings.js         every place in the census
  events.js           the community calendar
  stories.js          reported stories of solidarity
  resources.js        links out, local and further afield
js/
  util.js             small shared helpers
  wm.js               the window manager (drag, resize, minimise, stack)
  settings.js         preferences, saved in the visitor's own browser
  shell.js            desktop icons, Start menu, taskbar clock
  clippy.js           the assistant
  main.js             boot
  apps/               one file per window: folders, calendar, stories,
                      mail, notepad, about, control-panel
css/
  98.css              window chrome (vendored, MIT — do not edit)
  desktop.css         everything else
assets/icons/       the 16px and 32px icons
geo/                Durham Region map layers, for the map window to come
```

## Contributing

Most useful contributions are not code. Adding a place you know about, or
correcting hours that have changed, matters more than anything in `js/`.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** — it covers adding a listing, an event
or a story without touching any code you don't want to touch.

## The eight senses

| Sense | What it holds |
|---|---|
| Taste | what we eat |
| Sight | what we see |
| Sound | what we hear |
| Touch | what we make & fix |
| Smell | fresh air & forests |
| Sense of Security | housing, health & legal help |
| Sense of Belonging | gathering places |
| Common Sense | practical help |

Five live in the body. Three don't. A place is lived through all eight.

## Licence and credits

Project code and data: **MIT** (see [LICENSE](LICENSE)).
Third-party components and their licences: see [NOTICE.md](NOTICE.md).

- [98.css](https://jdan.github.io/98.css/) by Jordan Scales — window chrome (MIT)
- [React95 icon set](https://github.com/React95/React95) — desktop icons (MIT)
- [Durham Region Open Data](https://opendata.durham.ca) — trails, parks, libraries, community halls
- [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors — map data

Listings are gathered and verified by neighbours, on foot and by phone. Never scraped.
