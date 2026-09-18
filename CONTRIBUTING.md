# Contributing to the North Durham Census

You do not need to be a programmer to improve this. The most valuable
contributions are a place you already know about, or an hour that has changed.

There are three ways in, easiest first.

---

## 1. Just tell us (no GitHub account needed)

Open the site, double-click **Send a Tip**, and describe what you know.
A volunteer reads every submission and verifies it before it is listed.

## 2. Open an issue

Spotted something wrong but don't want to edit files?
[Open an issue](https://github.com/NorthDurhamCensus) describing the place, the
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
    "category": "Sense of Belonging",
    "address": "76 River St, Sunderland, ON",
    "hours": "Fri 4–10pm, Sat 2–10pm",
    "description": "Hall available to community groups. Friday dinners are open to everyone, not just members.",
    "contact": "705-357-1234",
    "lat": 44.2718,
    "lng": -79.0784,
    "tags": ["hall rental", "meals", "accessible"]
  }
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Any value not already used. The next number is fine. |
| `name` | yes | What a neighbour would call it. |
| `category` | yes | Must be **exactly** one of the eight senses below. |
| `address` | yes | Plain address, or how someone would actually find it. |
| `hours` | yes | Real hours. "Call for hours" is an honest answer. |
| `description` | yes | A sentence or two. What is it, who is it for, what does it cost? |
| `contact` | no | Phone, email or website. |
| `lat` / `lng` | yes | Decimal degrees. See below. |
| `tags` | no | Short labels: `"free"`, `"accessible"`, `"no appointment"`. |

**The eight senses**, spelled exactly like this:

`Taste` · `Sight` · `Sound` · `Touch` · `Smell` ·
`Sense of Security` · `Sense of Belonging` · `Common Sense`

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
    "category": "Taste",
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

## Changing how the site looks or works

- **Site name, contact address, the eight senses and their colours:** `config.js`.
- **The README.txt on the desktop:** `js/apps/notepad.js`.
- **What the paperclip says:** the `LINES` list in `js/clippy.js`.
- **Wallpapers and settings:** `js/settings.js`.
- **A new window:** copy the smallest file in `js/apps/` (`stories.js`), then add
  one line to `PROGRAMS` in `js/shell.js` and one `<script>` tag in `index.html`.

House style, so the code stays readable by people who don't write code daily:

- Plain JavaScript. No frameworks, no build step, no bundler.
- `js/apps/*` files never touch window chrome — they call `NDC.wm.open({...})`
  and fill the body they are handed.
- `98.css` is vendored and should not be edited. Put overrides in `desktop.css`.
- Comment the *why*, not the *what*.

## Checking your change

Open `index.html` in a browser. Then, before opening a pull request:

- Does the census still show every listing? (The status bar gives a count.)
- Press **F12** and look at the Console tab. It should be empty.
- Drag a window, resize it, minimise it, and open the site on a phone.

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
