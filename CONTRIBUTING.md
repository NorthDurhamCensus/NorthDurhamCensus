# Contributing to the North Durham Census

You do not need to be a programmer to improve this. The most valuable
contributions are a place you already know about, or an hour that has changed.

There are three ways in, easiest first.

---

## 1. Just tell us (no GitHub account needed)

Email **NorthDurhamCensus@outlook.com** and describe what you know.
A volunteer reads every submission and verifies it before it is listed.

## 2. Open an issue

Spotted something wrong but don't want to edit files?
[Open an issue](https://github.com/NorthDurhamCensus/NorthDurhamCensus/issues) describing the place, the
problem and, if you have it, a phone number or address we can check.

## 3. Edit the data yourself

The one file you edit is `data/listings.js` (the places). It is plain text.
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
in [tools/README.md](tools/README.md).

---

## Checking your change

There is no site in this repo any more, so the check is the data itself.

- A data file is still valid JavaScript if this prints a number:
  `node -e "global.window={};require('./data/listings.js');console.log(window.NDC.data.listings.length)"`
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
