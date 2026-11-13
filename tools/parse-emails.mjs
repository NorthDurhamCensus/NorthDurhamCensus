#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   The newsletter reader
   ---------------------------------------------------------------------------
   Reads emails you have saved into data/email-drop/ and writes
   data/events-email.js.

   Run it:
     node tools/parse-emails.mjs              read the drop folder and write
     node tools/parse-emails.mjs --dry-run    show what it found, write nothing
     node tools/parse-emails.mjs --all        keep events outside North Durham

   Why this is separate from the feed importer:

   The raw emails stay on your computer. data/email-drop/ is gitignored, because
   a newsletter carries unsubscribe links tied to your own address and those do
   not belong in a public repository. Only the parsed events are committed.

   That also means GitHub Actions cannot do this job — it has no mailbox. So the
   nightly Action writes events-imported.js and never touches events-email.js,
   and the two files cannot clobber each other.
   --------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// Every feed here is Ontario, and so are the people reading it. GitHub's
// runners (and some laptops) run in UTC, which made a 6pm event read
// "11:00pm" and pushed evening events onto the next day. Pin the clock to
// Eastern before any date is touched.
process.env.TZ = "America/Toronto";
import { EMAIL_PARSERS, isNorthDurham, plainlyElsewhere } from "./lib/email-parsers.mjs";
import { guessCategory } from "./lib/categories.mjs";
import { guessTags } from "./lib/tags.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DROP = resolve(ROOT, "data", "email-drop");

const DAYS_BACK = 7;
const DAYS_AHEAD = 400;

/* Which parser handles which newsletter, matched on the sender or subject. */
const NEWSLETTERS = [
  {
    id: "durham-tourism",
    name: "Durham Tourism newsletter",
    parser: "durham-tourism",
    match: /tourism@durham\.ca|Durham Tourism E-newsletter/i,
    page: "https://www.durhamtourism.ca",
    filterToNorthDurham: true
  },
  {
    id: "brock-township",
    name: "Township of Brock",
    parser: "govstack-digest",
    html: true,
    match: /noreply@townshipofbrock\.ca|events\.townshipofbrock\.ca/i,
    page: "https://events.townshipofbrock.ca",
    filterToNorthDurham: false            // it is all Brock
  },
  {
    id: "durham-region-calendar",
    name: "Durham Region calendar",
    parser: "govstack-digest",
    html: true,
    match: /noreply@calendar\.durham\.ca|calendar\.durham\.ca\/default/i,
    page: "https://calendar.durham.ca",
    filterToNorthDurham: true
  },
  {
    id: "sideroads-of-scugog",
    name: "Sideroads of Scugog",
    parser: "sideroads",
    html: true,
    match: /connect@bigworldcreative\.ca|sideroadsofscugog/i,
    page: "https://www.sideroadsofscugog.ca/events",
    filterToNorthDurham: true          // mostly Scugog, but they list the casino and Lindsay too
  }
];

// Sideroads of Scugog is added below Durham Region.
/* Same time format as the feed importer, so both files read alike. */
function formatTime(start, end, allDay) {
  if (allDay) return "";
  const clock = d => {
    const h = d.getHours();
    return `${(h % 12) || 12}:${pad(d.getMinutes())}${h >= 12 ? "pm" : "am"}`;
  };
  if (end && end > start) {
    return isoDate(end) === isoDate(start)
      ? `${clock(start)} – ${clock(end)}`
      : `${clock(start)}, runs to ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}`;
  }
  return clock(start);
}

const trimText = (text, max) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
};

const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A saved email may be a raw .eml with headers, or just the body pasted into a
 * .txt file. Pull out the date and sender if they are there, and fall back to
 * the file's own name (2026-05-01-durham-tourism.txt) when they are not.
 */
function readDroppedEmail(path, filename) {
  const raw = readFileSync(path, "utf8");

  let emailDate = null;
  let headerBlob = "";

  const dateHeader = /^Date:\s*(.+)$/im.exec(raw.slice(0, 4000));
  if (dateHeader) {
    const parsed = new Date(dateHeader[1].trim());
    if (!isNaN(parsed)) emailDate = parsed;
  }
  const fromHeader = /^From:\s*(.+)$/im.exec(raw.slice(0, 4000));
  const subjectHeader = /^Subject:\s*(.+)$/im.exec(raw.slice(0, 4000));
  headerBlob = [fromHeader && fromHeader[1], subjectHeader && subjectHeader[1]].filter(Boolean).join(" ");

  if (!emailDate) {
    const fromName = /(\d{4})-(\d{2})-(\d{2})/.exec(filename);
    if (fromName) emailDate = new Date(+fromName[1], +fromName[2] - 1, +fromName[3], 12);
  }

  return { text: raw, emailDate, hint: `${filename} ${headerBlob}` };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const keepAll = args.includes("--all");

  if (!existsSync(DROP)) {
    mkdirSync(DROP, { recursive: true });
    console.log(`Created ${DROP}`);
    console.log("Save newsletter emails there as .txt or .eml, then run this again.");
    console.log("See tools/README.md for how.");
    return;
  }

  const files = readdirSync(DROP)
    .filter(f => f.toLowerCase() !== "readme.md")
    .filter(f => [".txt", ".eml", ".md", ".html"].includes(extname(f).toLowerCase()))
    .sort();

  if (!files.length) {
    console.log("Nothing in data/email-drop/ to read.");
    console.log("Save a newsletter there as a .txt file and run this again.");
    return;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - DAYS_BACK * 864e5);
  const windowEnd = new Date(now.getTime() + DAYS_AHEAD * 864e5);

  console.log(`North Durham Census — reading newsletters`);
  console.log(`Files: ${files.length}\n`);

  const collected = [];

  for (const filename of files) {
    const { text, emailDate, hint } = readDroppedEmail(join(DROP, filename), filename);

    const newsletter = NEWSLETTERS.find(n => n.match.test(hint) || n.match.test(text.slice(0, 4000)));
    const parserId = newsletter ? newsletter.parser : "generic";
    const parse = EMAIL_PARSERS[parserId];
    const sourceName = newsletter ? newsletter.name : "A community newsletter";

    let found = [];
    try {
      found = parse(text, { emailDate });
    } catch (error) {
      console.log(`  FAIL ${filename} — ${error.message}`);
      continue;
    }

    const shouldFilter = !keepAll && (!newsletter || newsletter.filterToNorthDurham !== false);
    let kept = 0;

    for (const event of found) {
      if (!event.start || isNaN(event.start)) continue;
      if (event.start < windowStart || event.start > windowEnd) continue;
      const where = `${event.location || ""} ${event.description || ""} ${event.tagText || ""}`;
      if (shouldFilter && !isNorthDurham(event.title, where)) continue;
      // Even a source kept whole drops a listing that is plainly held elsewhere
      // (Brock's calendar carries the odd Oshawa event).
      if (!keepAll && plainlyElsewhere(event.title, where)) continue;

      collected.push({
        id: `eml-${newsletter ? newsletter.id : parserId}-${isoDate(event.start)}-${
          createHash("sha1").update(`${event.title}|${event.start.toISOString()}`)
            .digest("base64url").slice(0, 10)}`,
        title: event.title,
        date: isoDate(event.start),
        time: formatTime(event.start, event.end, event.allDay),
        location: event.location || "",
        description: trimText(event.description, 400),
        category: guessCategory(event),
        tags: guessTags({ title: event.title, description: `${event.description || ""} ${event.tagText || ""}` }),
        url: event.url || (newsletter ? newsletter.page : ""),
        recurring: "",
        contact: "",
        imported: true,
        dateConfidence: event.dateConfidence || "medium",
        source: {
          id: newsletter ? newsletter.id : parserId,
          name: sourceName,
          page: newsletter ? newsletter.page : "",
          via: "newsletter"
        }
      });
      kept += 1;
    }

    console.log(`  ok   ${filename} — ${found.length} found, ${kept} in North Durham and in window` +
                (newsletter ? `  [${newsletter.name}]` : "  [generic parser]"));
  }

  const seen = new Map();
  for (const event of collected) {
    const key = event.date + "|" + event.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!seen.has(key)) seen.set(key, event);
  }
  const events = [...seen.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
  );

  console.log(`\n${events.length} events kept` +
              (collected.length - events.length ? `, ${collected.length - events.length} duplicates merged` : ""));

  for (const event of events.slice(0, 40)) {
    console.log(`  ${event.date}  ${event.category.padEnd(18)}  ${event.title}`);
  }
  if (events.length > 40) console.log(`  … and ${events.length - 40} more`);

  if (dryRun) { console.log("\nDry run — nothing written."); return; }

  const header = [
    "// North Durham Census — events read from newsletters.",
    "//",
    "// GENERATED FILE. Do not edit by hand: it is overwritten whenever someone",
    "// runs tools/parse-emails.mjs. Hand-verified events are added on the site (Submit an Event).",
    "//",
    "// These came from prose in an email rather than a calendar feed, so the",
    "// dates are read rather than given. Treat them as leads to check, not facts.",
    "//",
    `// Generated ${now.toISOString()}`,
    "",
    "window.NDC = window.NDC || {}; window.NDC.data = window.NDC.data || {};",
    "window.NDC.data.eventsEmail =",
    ""
  ].join("\n");

  writeFileSync(resolve(ROOT, "data", "events-email.js"),
                header + JSON.stringify(events, null, 2) + ";\n", "utf8");
  console.log("\nWrote data/events-email.js");
  console.log("Commit that file. The raw emails stay on your computer.");
}

main();
