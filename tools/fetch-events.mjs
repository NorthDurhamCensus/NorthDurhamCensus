#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   The event importer
   ---------------------------------------------------------------------------
   Reads every enabled feed in tools/sources.json, normalises what comes back,
   and writes data/events-imported.js.

   Run it:
     node tools/fetch-events.mjs              normal run
     node tools/fetch-events.mjs --dry-run    show what would change, write nothing
     node tools/fetch-events.mjs --only=<id>  test a single source
     node tools/fetch-events.mjs --verbose    print every event found

   Imported events are never mixed into data/events.js. That file stays
   hand-verified — a neighbour checked it. See tools/README.md.
   --------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseIcs, parseRss, parseTribe, parseJsonLd, stripTags } from "./lib/parsers.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/* --- Settings -------------------------------------------------------------- */

const DAYS_BACK = 7;        // keep a week of past events so the calendar isn't bare
const DAYS_AHEAD = 240;     // about eight months out
const TIMEOUT_MS = 20000;
const MAX_PER_SOURCE = 300;

const USER_AGENT =
  "NorthDurhamCensus/1.0 (+https://github.com/NorthDurhamCensus; community events importer)";

/* --- The eight senses ------------------------------------------------------ */
/* Keywords are checked in order, so put the more specific ones first. */

const SENSE_RULES = [
  ["Taste", /\b(market|farmers|food|dinner|supper|breakfast|brunch|lunch|bake|bbq|barbecue|harvest|pancake|chili|soup|tasting|brewery|winery|potluck|canning|preserves\b|jam making)/i],
  ["Sound", /\b(concert|music|band|choir|singer|song|orchestra|jam|open mic|karaoke|dance|theatre|theater|play|performance|recital|opera|fiddle|drum)/i],
  ["Sight", /\b(art|gallery|exhibit|paint|draw|photograph|film|movie|screening|museum|studio tour|craft show|quilt|sculpt|pottery)/i],
  ["Touch", /\b(workshop|makerspace|repair|build|woodwork|sew|knit|weav|fix|hands-on|maker|tinker|3d print|blacksmith)/i],
  ["Smell", /\b(trail|hike|walk|garden|nature|conservation|forest|park|birding|cleanup|clean-up|tree plant|paddle|canoe|ski|snowshoe)/i],
  ["Sense of Security", /\b(clinic|health|legal|housing|shelter|food bank|tax clinic|flu shot|vaccin|counsell|counsel|support group|crisis|warming|safety)/i],
  ["Common Sense", /\b(library|class|course|training|info session|seminar|lecture|talk|learn|tutor|literacy|computer|resume|how to|drop-in help)/i],
  ["Sense of Belonging", /\b(legion|community|social|club|meeting|euchre|bingo|coffee|seniors|youth|volunteer|fundrais|celebrat|festival|parade|fair|reunion|service|worship)/i]
];

/**
 * The title is what an event is; the description is where it wanders. Match the
 * title on its own first, because searching the whole blob files "Fishing Derby"
 * under Sight the moment the blurb happens to mention an art show down the road.
 * Only if the title says nothing do we look wider.
 */
function guessSense(event, fallback) {
  for (const [sense, pattern] of SENSE_RULES) {
    if (pattern.test(event.title)) return sense;
  }
  const wider = `${event.description} ${event.location}`;
  for (const [sense, pattern] of SENSE_RULES) {
    if (pattern.test(wider)) return sense;
  }
  return fallback || "Sense of Belonging";
}

/* --- Small helpers --------------------------------------------------------- */

const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function formatTime(start, end, allDay) {
  if (!start) return "";

  const clock = d => {
    const h = d.getHours();
    return `${(h % 12) || 12}:${pad(d.getMinutes())}${h >= 12 ? "pm" : "am"}`;
  };
  const day = d => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;

  // A fair that runs Friday to Sunday is not "5:00pm – 5:00pm". When the end
  // falls on a later day, say so as a span rather than a nonsense time range.
  if (end && !sameDay(start, end) && end > start) {
    const span = `runs to ${day(end)}`;
    return allDay ? span : `${clock(start)}, ${span}`;
  }

  if (allDay) return "";
  // Midnight with no end time almost always means "no time was given".
  if (start.getHours() === 0 && start.getMinutes() === 0 && !end) return "";
  return end && end > start ? `${clock(start)} – ${clock(end)}` : clock(start);
}

function trim(text, max) {
  const clean = stripTags(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut) + "…";
}

/** Same event from two sources should collapse into one. */
function fingerprint(event) {
  const title = event.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|at|in|on|of|and|annual|monthly|weekly)\b/g, " ")
    .replace(/\s+/g, " ").trim();
  return `${event.date}|${title}`;
}

async function get(url, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, "Accept": "*/*" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/* --- Reading one source ---------------------------------------------------- */

async function readSource(source, windowEnd) {
  const body = await get(source.url, source.name);

  switch (source.type) {
    case "ics":
      if (!/BEGIN:VCALENDAR/i.test(body)) {
        throw new Error("did not look like an iCalendar file (no BEGIN:VCALENDAR)");
      }
      return parseIcs(body, { windowEnd });

    case "rss":
      if (!/<(rss|feed)\b/i.test(body)) {
        throw new Error("did not look like an RSS or Atom feed");
      }
      return parseRss(body, { dateFrom: source.dateFrom || "feed" });

    case "tribe": {
      let json;
      try { json = JSON.parse(body); }
      catch { throw new Error("REST endpoint did not return JSON"); }
      return parseTribe(json);
    }

    case "jsonld": {
      const found = parseJsonLd(body);
      if (!found.length) throw new Error("no schema.org Event markup found on the page");
      return found;
    }

    default:
      throw new Error(`unknown source type "${source.type}"`);
  }
}

/* --- Main ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const verbose = args.includes("--verbose");
  const only = (args.find(a => a.startsWith("--only=")) || "").split("=")[1];

  const config = JSON.parse(readFileSync(resolve(HERE, "sources.json"), "utf8"));
  const now = new Date();
  const windowStart = new Date(now.getTime() - DAYS_BACK * 864e5);
  const windowEnd = new Date(now.getTime() + DAYS_AHEAD * 864e5);

  let sources = config.sources.filter(s => s.enabled && s.url);
  if (only) sources = config.sources.filter(s => s.id === only);

  if (!sources.length) {
    console.error(only ? `No source with id "${only}".` : "No enabled sources with a URL.");
    process.exit(1);
  }

  console.log(`North Durham Census — importing events`);
  console.log(`Window: ${isoDate(windowStart)} to ${isoDate(windowEnd)}`);
  console.log(`Sources: ${sources.length}\n`);

  const collected = [];
  const report = [];

  for (const source of sources) {
    const line = { id: source.id, name: source.name, ok: false, count: 0, kept: 0, error: null };
    try {
      const raw = await readSource(source, windowEnd);
      line.ok = true;
      line.count = raw.length;

      for (const event of raw.slice(0, MAX_PER_SOURCE)) {
        if (!event.start || isNaN(event.start)) continue;
        if (event.start < windowStart || event.start > windowEnd) continue;

        const normalised = {
          id: `imp-${source.id}-${isoDate(event.start)}-${
            Buffer.from(event.title).toString("base64url").slice(0, 8)}`,
          title: trim(event.title, 120),
          date: isoDate(event.start),
          time: formatTime(event.start, event.end, event.allDay),
          location: trim(event.location, 120),
          description: trim(event.description, 400),
          category: guessSense(event, source.defaultCategory),
          url: event.url || source.page || "",
          recurring: event.recurring || "",
          contact: "",
          // Provenance. This is what makes an imported event visibly different
          // from one a neighbour checked.
          imported: true,
          source: { id: source.id, name: source.name, page: source.page || "" }
        };
        // Only carried when the date was inferred from prose rather than read
        // from a real date field, so a reviewer knows which ones to check.
        if (event.dateConfidence && event.dateConfidence !== "high") {
          normalised.dateConfidence = event.dateConfidence;
        }
        collected.push(normalised);
        line.kept += 1;
      }

      console.log(`  ok   ${source.name} — ${line.count} found, ${line.kept} in window`);
      if (verbose) {
        for (const e of collected.filter(c => c.source.id === source.id)) {
          console.log(`         ${e.date}  ${e.title}  [${e.category}]`);
        }
      }
    } catch (error) {
      line.error = error.message;
      console.log(`  FAIL ${source.name} — ${error.message}`);
    }
    report.push(line);
  }

  /* Collapse duplicates, preferring whichever source we listed first. */
  const seen = new Map();
  for (const event of collected) {
    const key = fingerprint(event);
    if (!seen.has(key)) seen.set(key, event);
  }
  const events = [...seen.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
  );

  const duplicates = collected.length - events.length;
  const failed = report.filter(r => !r.ok);

  console.log(`\n${events.length} events kept` +
              (duplicates ? `, ${duplicates} duplicate${duplicates === 1 ? "" : "s"} merged` : "") +
              (failed.length ? `, ${failed.length} source${failed.length === 1 ? "" : "s"} failed` : ""));

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  /* Write the data file. Generated: never edit by hand, it is overwritten. */
  const header = [
    "// North Durham Census — IMPORTED events.",
    "//",
    "// GENERATED FILE. Do not edit by hand: it is overwritten every time the",
    "// importer runs. Hand-verified events belong in events.js instead.",
    "//",
    `// Generated ${now.toISOString()} by tools/fetch-events.mjs`,
    `// Sources: ${report.filter(r => r.ok).map(r => r.name).join(", ") || "none"}`,
    "",
    "window.NDC = window.NDC || {}; window.NDC.data = window.NDC.data || {};",
    "window.NDC.data.eventsImported =",
    ""
  ].join("\n");

  const outPath = resolve(ROOT, "data", "events-imported.js");
  writeFileSync(outPath, header + JSON.stringify(events, null, 2) + ";\n", "utf8");
  console.log(`Wrote data/events-imported.js`);

  /* A machine-readable record of the run, handy when a feed quietly dies. */
  mkdirSync(resolve(HERE, "runs"), { recursive: true });
  writeFileSync(
    resolve(HERE, "runs", "last-run.json"),
    JSON.stringify({ at: now.toISOString(), kept: events.length, duplicates, sources: report }, null, 2),
    "utf8"
  );

  if (failed.length) {
    console.log(`\nFailed sources (the importer still succeeded):`);
    for (const f of failed) console.log(`  ${f.name}: ${f.error}`);
  }
}

main().catch(error => {
  console.error("Importer failed:", error);
  process.exit(1);
});
