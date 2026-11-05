# North Durham Census: the data engine

This repo no longer holds a website. It is the **data and event importer behind
[North of the Ridges](https://north-of-the-ridges.lovable.app/)**,
the community site for Uxbridge, Scugog and Brock Townships, Ontario.

The old Windows 98 Census desktop was retired in November 2026 and is no longer
in this repo.

## What runs here

Every night at 06:20 UTC a GitHub Action runs `tools/fetch-events.mjs`. It reads
every enabled feed in `tools/sources.json`, keeps what is actually in North
Durham, and commits `data/events-imported.js`.

North of the Ridges reads that file live from:

```
https://raw.githubusercontent.com/NorthDurhamCensus/NorthDurhamCensus/main/data/events-imported.js
```

**Do not rename or move that file, this repo, or the GitHub org** without
updating `src/lib/importedEvents.ts` in the News site first.

## What's here

| Folder | Holds |
|---|---|
| `data/` | Verified data (listings, events, stories, resources) and the generated imported events. See `data/README.md`. |
| `tools/` | The importer, feed parsers, newsletter reader, North Durham geography filter, the source list, and the letter for asking organisations for a feed. See `tools/README.md`. |
| `geo/` | GeoJSON layers for the map still to come (parks, trails, schools, health, worship, childcare, seniors, housing, amenities, the Durham boundary). |
| `.github/workflows/` | The nightly import. |

## The two-tier rule

Everything is either **verified** (a neighbour checked it, edited by hand) or
**imported** (an organisation published it, overwritten nightly by a script).
The two never mix. On the calendar, imported events get a dotted outline and
name their source.

## Run the importer yourself

Node 20, no dependencies, no install.

```bash
node tools/fetch-events.mjs --dry-run      # show what would change
node tools/fetch-events.mjs --only=<id>    # test one source
```

## The line on scraping

Sites that say no (robots.txt, bot protection, commercial licences) are left
alone and asked instead. The reasons are written next to each disabled source
in `tools/sources.json`.

## Licence

MIT. See `LICENSE`.
