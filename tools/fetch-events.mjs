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

   Imported events never mix with verified ones (those live in the site database).
   --------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// Every feed here is Ontario, and so are the people reading it. GitHub's
// runners (and some laptops) run in UTC, which made a 6pm event read
// "11:00pm" and pushed evening events onto the next day. Pin the clock to
// Eastern before any date is touched.
process.env.TZ = "America/Toronto";
import { parseIcs, parseRss, parseTribe, parseJsonLd, stripTags } from "./lib/parsers.mjs";
import { isNorthDurham } from "./lib/geography.mjs";
import { guessCategory } from "./lib/categories.mjs";
import { guessTags } from "./lib/tags.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/* --- Settings -------------------------------------------------------------- */

const DAYS_BACK = 7;        // keep a week of past events so the calendar isn't bare
const DAYS_AHEAD = 240;     // about eight months out
const TIMEOUT_MS = 20000;
const MAX_PER_SOURCE = 300;

const USER_AGENT =
  "NorthDurhamCensus/1.0 (+https://github.com/NorthDurhamCensus; community events importer)";

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
    const text = await response.text();
    // Hosting firewalls answer robots with a "checking your browser" page instead
    // of the feed. We don't try to get past those; we say so plainly, so the fix
    // (asking the organisation to let the importer through) is obvious.
    const challenge =
      /<title>\s*Just a moment/i.test(text) ? "Cloudflare" :
      /<title>\s*One moment, please/i.test(text) || /sgcaptcha/i.test(text) ? "SiteGround" : "";
    if (challenge) {
      throw new Error(`blocked by the website's ${challenge} bot protection — ask them to allow the importer (see tools/feed-request-letter.md)`);
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* --- What happened to a source ------------------------------------------- */

// One word per source in tools/runs/last-run.json, so a quiet failure is easy to spot
// (a feed that answers "ok" with nothing in it used to look healthy):
//   working   events found and kept
//   quiet     events found, but none in the date window or in North Durham
//   empty     the feed answered but listed no events at all (check it by hand:
//             some anti-bot pages look like an empty feed)
//   blocked   bot protection answered instead of the feed (ask; never work around it)
//   failed    anything else went wrong (network, not a feed, parse error)
export const STATUS_TAG = { working: "ok   ", quiet: "quiet", empty: "EMPTY", blocked: "BLOCK", failed: "FAIL " };
export function sourceStatus(line) {
  if (line.error) return /^blocked by/i.test(line.error) ? "blocked" : "failed";
  if (!line.count) return "empty";
  return line.kept ? "working" : "quiet";
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
    // status: what happened to this source, as one word (see sourceStatus below)
    const line = { id: source.id, name: source.name, status: "failed", ok: false, count: 0, kept: 0, error: null };
    try {
      const raw = await readSource(source, windowEnd);
      line.ok = true;
      line.count = raw.length;

      // Keep only events inside the window *before* applying the per-source cap.
      // Some feeds (Uxbridge's ICS) list years of past events first, so capping
      // the raw list used to throw away every current event.
      const inWindow = raw
        .filter(event => event.start && !isNaN(event.start) &&
                         event.start >= windowStart && event.start <= windowEnd)
        .sort((a, b) => a.start - b.start)
        .slice(0, MAX_PER_SOURCE);

      for (const event of inWindow) {

        // Regional and provincial feeds carry a lot that is not ours.
        if (source.filterToNorthDurham &&
            !isNorthDurham(event.title, `${event.location} ${event.description}`)) {
          line.filtered = (line.filtered || 0) + 1;
          continue;
        }

        const normalised = {
          // Hash the whole title + start time. The first 8 characters of the
          // title alone collided ("Uxbridge - Secord Forest ..." twice a day).
          id: `imp-${source.id}-${isoDate(event.start)}-${
            createHash("sha1").update(`${event.title}|${event.start.toISOString()}`)
              .digest("base64url").slice(0, 10)}`,
          title: trim(event.title, 120),
          date: isoDate(event.start),
          time: formatTime(event.start, event.end, event.allDay),
          location: trim(event.location, 120),
          description: trim(event.description, 400),
          category: guessCategory(event, source.defaultCategory),
          tags: guessTags(event),
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

      line.status = sourceStatus(line);
      console.log(`  ${STATUS_TAG[line.status]} ${source.name} — ${line.count} found, ${line.kept} kept` +
                  (line.filtered ? `, ${line.filtered} outside North Durham` : ""));
      if (verbose) {
        for (const e of collected.filter(c => c.source.id === source.id)) {
          console.log(`         ${e.date}  ${e.title}  [${e.category}]`);
        }
      }
    } catch (error) {
      line.error = error.message;
      line.status = sourceStatus(line);
      console.log(`  ${STATUS_TAG[line.status]} ${source.name} — ${error.message}`);
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
  const byStatus = report.reduce((n, r) => ({ ...n, [r.status]: (n[r.status] || 0) + 1 }), {});

  console.log(`\n${events.length} events kept` +
              (duplicates ? `, ${duplicates} duplicate${duplicates === 1 ? "" : "s"} merged` : "") +
              (failed.length ? `, ${failed.length} source${failed.length === 1 ? "" : "s"} failed` : ""));
  console.log("Sources: " + Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(", "));

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  /* Write the data file. Generated: never edit by hand, it is overwritten. */
  const header = [
    "// North Durham Census — IMPORTED events.",
    "//",
    "// GENERATED FILE. Do not edit by hand: it is overwritten every time the",
    "// importer runs. Hand-verified events are added on the site (Submit an Event).",
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
    JSON.stringify({ at: now.toISOString(), kept: events.length, duplicates, statuses: byStatus, sources: report }, null, 2),
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
