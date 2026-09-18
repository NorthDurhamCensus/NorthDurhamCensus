# The event importer

The census keeps **two tiers of events, and never blurs them.**

| | Verified | Imported |
|---|---|---|
| **File** | `data/events.js` | `data/events-imported.js` |
| **Where it comes from** | A neighbour checked it, by visit, call or message | Pulled automatically from a calendar an organisation publishes |
| **Edited by** | People, by hand | `tools/fetch-events.mjs`, overwritten every run |
| **On the calendar** | Solid colour | Outlined, italic, with the source named |
| **The claim being made** | "We stand behind this" | "Somebody published this; we have not checked it" |

That second column is the whole reason the split exists. The census is credible
because a person checked things. An importer cannot check anything, so what it
brings in is labelled as what it is, and a visitor can switch it off entirely
with the **View** buttons in the Calendar window.

When the map arrives it will work the same way: `listings.js` for places a
neighbour verified, `listings-imported.js` for anything pulled from open data.

---

## Running it

Needs Node 20 or newer. Nothing to install — no dependencies, by design.

```bash
node tools/fetch-events.mjs              # fetch and write the file
node tools/fetch-events.mjs --dry-run    # see what would happen, write nothing
node tools/fetch-events.mjs --only=scugog-arts --verbose   # test one source
```

In normal use nobody runs it by hand: the GitHub Action in
`.github/workflows/import-events.yml` runs it every morning at about 2:20am
Eastern and commits the result. Each run is an ordinary commit, so you can see
exactly what changed, and revert it if a feed goes haywire.

## Adding a source

Add an entry to `tools/sources.json` and open a pull request. Test it first:

```bash
node tools/fetch-events.mjs --only=your-new-id --verbose --dry-run
```

```json
{
  "id": "port-perry-legion",
  "name": "Royal Canadian Legion Branch 419",
  "type": "ics",
  "url": "https://example.ca/events.ics",
  "page": "https://example.ca/events",
  "township": "Scugog",
  "defaultCategory": "Sense of Belonging",
  "enabled": true,
  "note": "Why we trust this feed, or what still needs checking."
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Lowercase, hyphens. Used in event ids, so don't change it later. |
| `name` | yes | Shown to visitors as "Imported from …". |
| `type` | yes | `ics`, `rss`, `tribe` or `jsonld`. See below. |
| `url` | yes | The feed itself. |
| `page` | yes | The human page, linked from the source note. |
| `defaultCategory` | no | Which sense to use when the keywords don't decide. |
| `dateFrom` | no | `"content"` reads dates out of the text. Last resort. |
| `enabled` | yes | `false` keeps an entry documented without fetching it. |
| `note` | yes | Say what you know. Future volunteers read this. |

## The four feed types

**`ics`** — an iCalendar file. The best kind: real dates, real times, and repeat
rules we expand properly. Look for "Subscribe", "Add to calendar" or "Export to
Outlook" on an events page. Google Calendar publishes these at
`https://calendar.google.com/calendar/ical/<ID>/public/basic.ics` when a
calendar is shared publicly.

**`rss`** — an RSS or Atom feed. Quality varies. Some feeds carry proper event
dates; many publish the date the *post* went up, which is not the same thing.
If a feed has `mec:startDate` fields (Modern Events Calendar, common on Ontario
community WordPress sites) we use those, which is reliable.

**`tribe`** — the REST API of "The Events Calendar", the most popular WordPress
events plugin, at `https://<site>/wp-json/tribe/events/v1/events`. Always worth
trying on any WordPress site; it either works or 404s.

**`jsonld`** — `schema.org` Event markup embedded in an ordinary web page.
Publishers add this so search engines can read their events, so reading it is
using the page as intended. Squarespace and some Wix sites emit it.

## When a date has to be guessed

`dateFrom: "content"` hunts for a date in the title and description. It is a
heuristic and it does get things wrong. Anything found that way is tagged
`dateConfidence` and the Calendar window says, in the event's own details,
that the date was read from the description and may be wrong.

Use it only when a feed genuinely has no date field, and say so in the `note`.

## What we will not do

**No scraping against a site's wishes.** Every source is either a feed published
on purpose or structured data embedded for machines. If a site blocks automated
access, that is an answer, and we respect it.

**`durhamregion.com` is off limits.** It is Metroland/Torstar, the listings are
commercially licensed, and the site blocks automated access. It stays in
`sources.json` as `enabled: false` with that note so nobody wastes an afternoon
rediscovering why.

**No credentials, no paid APIs, no private data.** If a source needs an account,
it does not belong in a repository anyone can fork.

## When a feed breaks

Feeds rot. Sites get rebuilt, plugins get swapped, URLs move. The importer is
built so one dead feed never takes the rest down: a failing source is reported
and skipped, and the last good `events-imported.js` stays in place.

- The Action's log names every failed and empty source.
- `tools/runs/last-run.json` records what happened, so you can see when a feed
  stopped returning anything.
- A source that stays broken should be set `enabled: false` with a note, not
  deleted. The note saves the next person the same investigation.

## Feeds we still need

Several sources have `enabled: false` because no feed exists yet, not because
they are unwanted. The three township calendars are the big ones, and all three
run on the same platform, which publishes email subscriptions only.

`tools/feed-request-letter.md` is a short letter you can send to ask. That is
the single highest-value thing anyone can do for this calendar — more than any
amount of code.
