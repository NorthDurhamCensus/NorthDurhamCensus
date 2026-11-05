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

Everything the site shows lives in four files in `data/`. They are plain text.
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

One list for places, events and stories (the same as the North of the Ridges
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

### Adding an event

In `data/events.js`:

```js
  {
    "id": "5",
    "title": "Uxbridge Winter Market",
    "date": "2026-12-06",
    "time": "9:00am – 1:00pm",
    "location": "Uxbridge Arena, 291 Brock St W",
    "description": "Indoor market: produce, preserves, crafts.",
    "category": "Food & farms",
    "tags": ["Free", "Family-friendly"],
    "url": "https://example.ca",
    "recurring": "First Saturday, November through March",
    "contact": ""
  }
```

- `date` is always `YYYY-MM-DD`.
- `recurring` is a plain-English note. Anything with one also appears in the
  **Standing events** panel under the calendar, listed once however many dates
  it has.
- For something weekly, one entry with a `recurring` note reads better than one
  entry per week.

### Two kinds of event: verified and imported

The calendar holds two tiers, and they are never mixed.

| | Verified | Imported |
|---|---|---|
| File | `data/events.js` | `data/events-imported.js` |
| Comes from | A neighbour checked it | A calendar an organisation publishes |
| Edited by | You, by hand | A script, overwritten every night |
| On the calendar | Solid colour | Outlined, italic, source named |

**Only ever edit `data/events.js`.** The imported file is regenerated every
morning, so any change you make there is wiped by the next run.

If you check an imported event yourself — you rang the hall, or you were there —
that is exactly how it should graduate. Copy it into `data/events.js`, drop the
`imported` and `source` fields, correct anything that was wrong, and it becomes
part of the census proper.

Adding a new calendar source, or asking an organisation for a feed, is covered
in [tools/README.md](tools/README.md).

### Adding a story

In `data/stories.js`:

```js
  {
    "id": "s2",
    "title": "The headline",
    "source": "The Standard",
    "date": "March 2026",
    "excerpt": "A paragraph or two, quoted from the piece.",
    "url": "https://..."
  }
```

Optionally add `"body"` for a longer piece written for the census itself.
Blank lines in it become paragraphs.

### Adding a resource link

In `data/resources.js`, under `"local"` (North Durham) or `"organizing"`:

```js
  { "name": "...", "description": "...", "url": "https://...", "tag": "Housing" }
```

---

## Checking your change

There is no site in this repo any more, so the check is the data itself.

- A data file is still valid JavaScript if this prints a number:
  `node -e "global.window={};require('./data/events.js');console.log(window.NDC.data.events.length)"`
  (swap `events` for `listings`, `stories` or `resources`).
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
