# Contributing to the North Durham Census

You do not need to be a programmer to improve this. The most valuable
contributions are a place you already know about, or an hour that has changed.

There are three ways in, easiest first.

---

## 1. Just tell us (no GitHub account needed)

Email **NorthDurhamCensus@outlook.com** and describe what you know.
A volunteer reads every submission and verifies it before it is listed.

## 2. Fill in a form (a free GitHub account, no files)

Go to **[New issue](https://github.com/NorthDurhamCensus/NorthDurhamCensus/issues/new/choose)** and pick one:

| Form | Use it when |
|---|---|
| **Add a place** | You know a hall, park, market, food bank, club... that isn't in the Census |
| **Fix or close a place** | Hours changed, it moved, the phone is wrong, or it has closed |
| **Add a hamlet to the Moraine Map** | A village or crossroads community is missing from the map labels |
| **Suggest a calendar to import** | An organisation publishes its events online |

Each form asks plain questions with dropdowns and tick boxes. A volunteer turns
your answers into the data file, so you never have to worry about commas.

## 3. Edit the data yourself

### Which file do I change?

| I want to... | File | How |
|---|---|---|
| Add or fix a **place** (Places window, map pins) | `data/listings.js` | [Adding a listing](#adding-a-listing) |
| Add a pin to a **map layer** (parks, halls, schools, health, worship...) | `geo/<layer>.geojson` | [Map layers](#map-layers-geo) |
| Add a **hamlet name** to the Moraine Map | `geo/moraine-grid.json` | [Moraine Map hamlets](#moraine-map-hamlets) (one command) |
| Add a **calendar** for the nightly import | `tools/sources.json` | [Calendar sources](#calendar-sources) |
| Add a **photo** of a place | `data/photos/` | [Photos](#photos) |
| Add an **event** | none here | **Submit an Event** on [North of the Ridges](https://north-of-the-ridges.lovable.app/calendar) |

### Your first edit, click by click (no installs)

You can do all of this in a web browser.

1. **Sign in to GitHub** (or make a free account at [github.com](https://github.com/signup)).
2. **Open the file.** For places that's
   [data/listings.js](https://github.com/NorthDurhamCensus/NorthDurhamCensus/blob/main/data/listings.js).
3. **Click the pencil** (top right of the file, "Edit this file"). GitHub makes
   your own copy automatically. That's normal, it's called a *fork*.
4. **Make your change.** Copy a sample from this page, paste it in, and change
   the words. Watch the commas (see the two rules below).
5. **Click "Commit changes..."** (green button, top right). In the box, say
   what you did: `Add Sunderland Legion` or `Fix Palmer Park hours`.
   Choose **"Create a new branch... and start a pull request"**.
6. **Click "Propose changes"**, then **"Create pull request"**. Fill in the
   short checklist that appears. It asks how you know the information is right.
7. **That's it.** A volunteer checks it and merges it. About 5 minutes after it's
   merged, North of the Ridges shows it (reload the page with Ctrl+F5 if it was
   already open).

Made a mistake? Nothing goes live until a volunteer merges it, so you can't
break the site. Leave a comment on your pull request and we'll fix it together.

The file you'll edit most is `data/listings.js` (the places). It is plain text.
You can edit them in GitHub's own web editor: open the file, click the pencil,
make your change, and it will offer to open a pull request for you.

Each file looks like this — a header line, then a list in square brackets:

```js
window.NDC.data.listings =
[
  { ... },
  { ... }
];
```

**Two rules that prevent almost every mistake:**

- Every item except the last one ends with a comma.
- Text goes inside `"double quotes"`. Numbers do not.

If the site loads with an empty census after your edit, a comma or a quote is
missing. GitHub will usually highlight the line.

---

### Adding a listing

Add a new block inside `data/listings.js`:

```js
  {
    "id": "30",
    "name": "Sunderland Legion Branch 357",
    "category": "Community",
    "address": "76 River St, Sunderland, ON",
    "hours": "Fri 4–10pm, Sat 2–10pm",
    "description": "Hall available to community groups. Friday dinners are open to everyone, not just members.",
    "contact": "705-357-1234",
    "lat": 44.2718,
    "lng": -79.0784,
    "tags": ["Accessible", "Family-friendly"],
    "keywords": ["hall rental", "meals"]
  }
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Any value not already used. The next number is fine. |
| `name` | yes | What a neighbour would call it. |
| `category` | yes | Must be **exactly** one of the place categories below. |
| `address` | yes | Plain address, or how someone would actually find it. |
| `hours` | yes | Real hours. "Call for hours" is an honest answer. |
| `description` | yes | A sentence or two. What is it, who is it for, what does it cost? |
| `contact` | no | Phone or email. |
| `website` | no | Full web address, starting with https:// (shows as a Website button). |
| `lat` / `lng` | yes | Decimal degrees. See below. |
| `tags` | no | Only from the tag list below, spelled exactly. |
| `keywords` | no | Anything else worth searching for: `"hall rental"`, `"notary"`. Free text. |
| `featured` | no | `true` puts the place at the top of Places with a star. Keep it to the real gems, about one in five. |
| `photo` | no | `"photos/palmer-park.jpg"` (see `data/photos/README.md`) or a full https link. No photo? North of the Ridges draws a pixel postcard. |
| `photoCredit` | no | Who took the photo. Required when there is a photo that isn't yours. |
| `blurb` | no | One line for featured places: why it's worth the drive. |

### Categories

One list for places and events (the same as the North of the Ridges
site). Pick the one that says what the thing **is**. Spell it exactly.

| Category | For |
|---|---|
| `Community` | fairs, parades, fundraisers, clubs, halls, the Legion, worship, local business news |
| `Outdoors` | trails, parks, conservation areas, nature walks, clean-ups, gardens |
| `Arts & culture` | music, theatre, galleries, museums, heritage, books |
| `Food & farms` | markets, harvest suppers, farms, co-ops, community gardens |
| `Sports & rec` | teams, arenas, fitness, indoor walking, euchre and bingo |
| `Learning` | library programs, classes, workshops, talks, schools, makerspaces |
| `Help & support` | food banks, clinics, legal aid, housing, employment, free wifi |
| `Civic` | council, public meetings, consultations, elections |

### Tags

Tags say **who it suits and how to get in**. Use as many as are true, and only
these, spelled exactly (the list lives in `tools/lib/tags.mjs`):

| Group | Tags |
|---|---|
| Cost | `Free` · `Pay what you can` |
| Who it suits | `Family-friendly` · `Kids` · `Youth` · `Seniors` · `19+` |
| Getting in | `Accessible` · `Drop-in` · `Registration required` · `Dog-friendly` · `Other languages` |
| Ways to help | `Volunteers needed` |

- `Accessible` means you checked: step-free entrance, accessible washroom. Not a guess.
- `Free` means free to get in. Free coffee at a paid event isn't `Free`.
- Need a new tag? Suggest it in an issue rather than inventing one, so filters keep working.

**Finding lat/lng:** open [OpenStreetMap](https://www.openstreetmap.org),
right-click the spot, choose *Show address*. The two numbers appear in the URL.
North Durham is roughly `lat 44.0–44.4`, `lng -79.3 to -78.8`, so a number far
outside that range is a typo or a swapped pair.

### Events

Events don't live here any more. Verified events are added on the North of the
Ridges site (**Submit an Event**), and land in the site's own database.

This repo only holds the **imported** events, which a script writes every night:

| File | Comes from | Edit by hand? |
|---|---|---|
| `data/events-imported.js` | calendars organisations publish | No, overwritten nightly |
| `data/events-email.js` | newsletters sent to NorthDurhamCensus@outlook.com | No, regenerated |

On the calendar these show with a dotted outline and name their source. If you
check one yourself, add it on the site with Submit an Event and it becomes
verified.

Adding a new calendar source, or asking an organisation for a feed, is covered
in [Calendar sources](#calendar-sources) below and in [tools/README.md](tools/README.md).

---

### Map layers (geo/)

The **Map** window on North of the Ridges has layers you can switch on and off.
Each layer is one file in `geo/`. These pins come from open data and show as
dotted squares (not checked by a person), so if you've checked one yourself,
it's even better to add it to `data/listings.js` as well.

| Layer on the map | File | `kind` to use |
|---|---|---|
| Halls & libraries | `geo/amenities.geojson` | `Community hall` or `Library` |
| Parks | `geo/parks.geojson` | `Park & recreation` |
| Trails | `geo/trails.geojson` | `Trail` (a line, not a point; ask for help) |
| Schools & childcare | `geo/schools.geojson`, `geo/childcare.geojson` | `Public elementary school`, `Catholic elementary school`, `Public secondary school`, `Private school`, `Childcare` |
| Health & care | `geo/health.geojson`, `geo/seniors.geojson`, `geo/housing.geojson` | `Clinic / medical centre`, `Hospital`, `Community health service`, `Paramedic station`, `Senior Residence`, `Retirement`, `Long Term Care`, `Affordable housing` |
| Places of worship | `geo/worship.geojson` | `Place of worship` |

Each file is one long line that starts `{"type":"FeatureCollection","features":[`
followed by the pins. To add a pin, copy this block (comma at the end included)
and paste it **straight after** `"features":[` at the very start of the file:

```json
{"type": "Feature", "properties": {"name": "Nestleton Hall", "kind": "Community hall", "address": "3967 Highway 7a", "town": "Nestleton", "phone": "905-986-5032", "hours": "By booking", "website": "https://example.ca"}, "geometry": {"type": "Point", "coordinates": [-78.79648, 44.14038]}},
```

So the start of the file goes from `..."features":[{"type":"Feature",...` to
`..."features":[{"type": "Feature", "properties": {"name": "Nestleton Hall", ...}},{"type":"Feature",...`.

- **Careful: GeoJSON puts longitude first.** `[-78.79648, 44.14038]` is
  `[lng, lat]`, the opposite of `listings.js`. In North Durham the first number
  is about **-79**, the second about **44**.
- `name`, `kind` and the coordinates are required. `address`, `town`, `phone`,
  `hours` and `website` are optional; leave out any you don't know.
- Check the file is still valid: paste it into [jsonlint.com](https://jsonlint.com),
  or run `node -e "JSON.parse(require('fs').readFileSync('geo/parks.geojson','utf8'));console.log('ok')"`.

### Moraine Map hamlets

The **Moraine Map** is a pixel map of North Durham in 500 m squares. The five
main towns (Port Perry, Uxbridge, Beaverton, Cannington, Sunderland) have big
labels; hamlets like Caesarea, Epsom and Leaskdale have small ones.

The map stores a place as a square (`[column, row]`), not latitude and
longitude, so there's a small tool that works it out for you:

```bash
node tools/add-hamlet.mjs --list                          # see what's there
node tools/add-hamlet.mjs "Caesarea" 44.1562 -78.8277     # add or move one
node tools/add-hamlet.mjs --remove "Caesarea"             # take one off
```

1. Find the hamlet on [OpenStreetMap](https://www.openstreetmap.org),
   right-click its centre, choose *Show address*. The web address ends with
   `#map=17/44.1562/-78.8277`: latitude first, then longitude.
2. Run the tool with the name in quotes and the two numbers.
3. Commit `geo/moraine-grid.json`. The map picks it up about 5 minutes after the push
   (reload the page with Ctrl+F5 if it was open).

No computer with Node? Use the **Add a hamlet to the Moraine Map** form instead.

Notes on the Moraine Map itself (best views, wildlife, memories) are added on
the site: sign in, click a square. They don't live in this repo.

### Calendar sources

Every night the importer reads the calendars listed in `tools/sources.json` and
writes `data/events-imported.js`. To add one, put a new block in the
`"sources"` list:

```json
{
  "id": "scugog-shores-museum",
  "name": "Scugog Shores Museum Village",
  "type": "ics",
  "url": "https://example.ca/events/calendar.ics",
  "page": "https://example.ca/events",
  "township": "Scugog",
  "enabled": true,
  "note": "Their events page has a Subscribe to calendar button. Checked 9 Nov 2026."
}
```

| Field | Notes |
|---|---|
| `id` | Short, lowercase, dashes, never reused. It names the source on the calendar. |
| `type` | `ics` (a calendar feed, the best kind), `rss`, `tribe` (WordPress sites using The Events Calendar) or `jsonld` (events marked up inside the page). More in `tools/README.md`. |
| `url` | The feed itself. Open it in a browser: an `.ics` feed downloads a file or shows lines starting `BEGIN:VCALENDAR`. |
| `page` | The normal events page people would visit (shown as the source link). |
| `township` | `Uxbridge`, `Scugog`, `Brock`, `North Durham` if it covers more than one, or `Region` for all of Durham Region. |
| `enabled` | `true` to import. Use `false` with a `note` saying why if it can't be used yet. |
| `note` | What it is and when you checked. Future volunteers will thank you. |

**The line on scraping:** only add feeds an organisation publishes for others to
use. If a site blocks bots or says no in its `robots.txt`, set `"enabled": false`
and ask them instead. There's a ready-made letter in
[tools/feed-request-letter.md](tools/feed-request-letter.md).

Test it before you commit: `node tools/fetch-events.mjs --only=scugog-shores-museum --dry-run --verbose`.
Not sure? Use the **Suggest a calendar to import** form and we'll do it.

### Photos

Put the photo in `data/photos/` (landscape, about 1600px wide, JPEG, named after
the place like `palmer-park.jpg`), then point the listing at it:

```js
    "photo": "photos/palmer-park.jpg",
    "photoCredit": "Sam from Sunderland",
```

Only your own photos, or ones you have permission to use. No photos of people
who haven't said yes, and nothing with kids' faces. More in
[data/photos/README.md](data/photos/README.md).

---

## Checking your change

There is no site in this repo any more, so the check is the data itself.

- A data file is still valid JavaScript if this prints a number:
  `node -e "global.window={};require('./data/listings.js');console.log(window.NDC.data.listings.length)"`
- A `geo/` file is still valid if this prints `ok`:
  `node -e "JSON.parse(require('fs').readFileSync('geo/parks.geojson','utf8'));console.log('ok')"`
- The Moraine Map file: `node tools/add-hamlet.mjs --list` prints the hamlets if it's fine.
- For the importer: `node tools/fetch-events.mjs --dry-run`.
- Once merged, events show up on the North of the Ridges calendar within a day.

## Verification standard

The census is credible because every listing was checked by a person.

- Verify by visit, call or message. Never by scraping a website.
- Record hours as they actually are, including seasonal closures.
- Blackstock, Caesarea, Sunderland and Cannington count as much as Port Perry.
- If something has closed, remove it and say so in the pull request.
- If you are not sure, say so in the description rather than guessing.

## Code of conduct

Be decent to each other. Assume the person on the other end is a volunteer,
because they are. Disagreement about what belongs in the census is normal and
welcome; contempt is not.

## Licence

Contributions are made under the MIT licence, the same as the rest of the project.
