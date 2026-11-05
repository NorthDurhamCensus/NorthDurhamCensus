/* ---------------------------------------------------------------------------
   Feed parsers
   ---------------------------------------------------------------------------
   Four ways an organisation might publish its events, and how we read each one.
   No dependencies: everything here is plain JavaScript against Node's built-in
   fetch, so there is nothing to install and nothing to keep patched.

   Every parser returns the same shape, so the importer downstream does not care
   where an event came from:

     { title, start, end, allDay, location, description, url, uid }

   `start` and `end` are JavaScript Date objects, or null.
   --------------------------------------------------------------------------- */

/* ===========================================================================
   iCalendar (.ics) — RFC 5545
   ===========================================================================
   The most reliable format, and the one most calendar software exports. */

/** Long values are wrapped across lines and continued with a space or tab. */
function unfold(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
}

/** `DTSTART;TZID=America/Toronto:20260711T080000` → name, params, value */
function parseLine(line) {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const parts = left.split(";");
  const params = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf("=");
    if (eq !== -1) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: parts[0].toUpperCase(), params, value };
}

/** Escaped text: \n \, \; \\ */
function unescapeText(value) {
  return String(value)
    .replace(/\\n/gi, "\n").replace(/\\,/g, ",")
    .replace(/\\;/g, ";").replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Dates come in three flavours:
 *   20260711            a whole day, no time
 *   20260711T080000Z    UTC
 *   20260711T080000     local to the calendar's timezone
 * We treat the third as local Eastern, which is right for every feed here.
 * A feed from outside Ontario would need its TZID honoured properly.
 */
function parseIcsDate(value, params) {
  const raw = String(value).trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
  if (dateOnly) {
    return {
      date: new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12, 0, 0),
      allDay: true
    };
  }
  const full = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(raw);
  if (!full) return { date: null, allDay: false };

  const [, y, mo, d, h, mi, s, zulu] = full;
  const allDay = params && params.VALUE === "DATE";

  if (zulu) {
    return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay };
  }
  return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay };
}

/**
 * Repeat rules, the pragmatic subset that community calendars actually use:
 * FREQ (DAILY/WEEKLY/MONTHLY/YEARLY), INTERVAL, COUNT, UNTIL, BYDAY.
 * Occurrences are generated only inside the window we care about, so a rule
 * with no end date cannot run away with us.
 */
const WEEKDAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expandRrule(rule, start, windowEnd, cap = 200) {
  const parts = {};
  for (const bit of String(rule).split(";")) {
    const eq = bit.indexOf("=");
    if (eq !== -1) parts[bit.slice(0, eq).toUpperCase()] = bit.slice(eq + 1);
  }

  const freq = (parts.FREQ || "").toUpperCase();
  if (!freq) return [start];

  const interval = Math.max(1, parseInt(parts.INTERVAL || "1", 10));
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;
  const until = parts.UNTIL ? parseIcsDate(parts.UNTIL, {}).date : null;
  const byDay = parts.BYDAY
    ? parts.BYDAY.split(",").map(d => WEEKDAYS[d.replace(/^[+-]?\d+/, "").toUpperCase()])
        .filter(d => d !== undefined)
    : null;

  const limit = until && until < windowEnd ? until : windowEnd;
  const out = [];
  const cursor = new Date(start);
  let steps = 0;

  while (cursor <= limit && out.length < cap && steps < 2000) {
    steps += 1;

    if (freq === "WEEKLY" && byDay && byDay.length) {
      // Emit each requested weekday within this week.
      const weekStart = new Date(cursor);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      for (const day of byDay) {
        const occurrence = new Date(weekStart);
        occurrence.setDate(weekStart.getDate() + day);
        occurrence.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
        if (occurrence >= start && occurrence <= limit) out.push(new Date(occurrence));
      }
    } else if (!byDay || freq !== "WEEKLY") {
      out.push(new Date(cursor));
    }

    if (freq === "DAILY") cursor.setDate(cursor.getDate() + interval);
    else if (freq === "WEEKLY") cursor.setDate(cursor.getDate() + 7 * interval);
    else if (freq === "MONTHLY") cursor.setMonth(cursor.getMonth() + interval);
    else if (freq === "YEARLY") cursor.setFullYear(cursor.getFullYear() + interval);
    else break;

    if (count && out.length >= count) break;
  }

  const unique = [...new Map(out.map(d => [d.getTime(), d])).values()]
    .sort((a, b) => a - b);
  return count ? unique.slice(0, count) : unique;
}

export function parseIcs(text, { windowEnd } = {}) {
  const lines = unfold(text).split("\n");
  const events = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") { current = { raw: {} }; continue; }
    if (trimmed === "END:VEVENT") { if (current) events.push(current); current = null; continue; }
    if (!current) continue;

    const parsed = parseLine(trimmed);
    if (!parsed) continue;
    current.raw[parsed.name] = { value: parsed.value, params: parsed.params };
  }

  const out = [];
  for (const event of events) {
    const raw = event.raw;
    if (!raw.DTSTART) continue;

    const startInfo = parseIcsDate(raw.DTSTART.value, raw.DTSTART.params);
    if (!startInfo.date || isNaN(startInfo.date)) continue;
    const endInfo = raw.DTEND ? parseIcsDate(raw.DTEND.value, raw.DTEND.params) : { date: null };

    const base = {
      title: unescapeText(raw.SUMMARY ? raw.SUMMARY.value : ""),
      location: unescapeText(raw.LOCATION ? raw.LOCATION.value : ""),
      description: unescapeText(raw.DESCRIPTION ? raw.DESCRIPTION.value : ""),
      url: raw.URL ? String(raw.URL.value).trim() : "",
      uid: raw.UID ? String(raw.UID.value).trim() : "",
      allDay: startInfo.allDay,
      end: endInfo.date
    };
    if (!base.title) continue;

    const starts = raw.RRULE && windowEnd
      ? expandRrule(raw.RRULE.value, startInfo.date, windowEnd)
      : [startInfo.date];

    const repeats = raw.RRULE ? describeRrule(raw.RRULE.value) : "";

    for (const start of starts) {
      out.push({ ...base, start, recurring: repeats });
    }
  }
  return out;
}

/** Turn a repeat rule back into something a neighbour would say out loud. */
function describeRrule(rule) {
  const parts = {};
  for (const bit of String(rule).split(";")) {
    const eq = bit.indexOf("=");
    if (eq !== -1) parts[bit.slice(0, eq).toUpperCase()] = bit.slice(eq + 1);
  }
  const names = { SU: "Sunday", MO: "Monday", TU: "Tuesday", WE: "Wednesday",
                  TH: "Thursday", FR: "Friday", SA: "Saturday" };
  const interval = parseInt(parts.INTERVAL || "1", 10);
  const days = parts.BYDAY
    ? parts.BYDAY.split(",").map(d => names[d.replace(/^[+-]?\d+/, "").toUpperCase()]).filter(Boolean).join(" and ")
    : "";

  switch ((parts.FREQ || "").toUpperCase()) {
    case "DAILY":   return interval === 1 ? "Every day" : `Every ${interval} days`;
    case "WEEKLY":  return days ? `Every ${days}` : (interval === 1 ? "Every week" : `Every ${interval} weeks`);
    case "MONTHLY": return interval === 1 ? "Every month" : `Every ${interval} months`;
    case "YEARLY":  return "Every year";
    default:        return "";
  }
}

/* ===========================================================================
   RSS and Atom
   =========================================================================== */

const NAMED_ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  ndash: "–", mdash: "—", hellip: "…", eacute: "é",
  egrave: "è", agrave: "à", ccedil: "ç", deg: "°",
  middot: "·", bull: "•", trade: "™", copy: "©", reg: "®"
};

/**
 * Feeds are full of entities, and doubly-encoded ones are common — WordPress
 * routinely emits `&#038;` where it means `&`. Decode repeatedly until the text
 * stops changing, so `&amp;#038;` resolves too.
 */
function decodeEntities(text) {
  let out = String(text);
  for (let pass = 0; pass < 3; pass += 1) {
    const before = out;
    out = out
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&([a-z]+);/gi, (match, name) => {
        const key = name.toLowerCase();
        return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key) ? NAMED_ENTITIES[key] : match;
      });
    if (out === before) break;
  }
  return out;
}

function stripTags(html) {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

function tagValue(block, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  if (!match) return "";
  return stripTags(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

/** "2026-09-19" + "10:00 am" → a Date. Either part may be missing. */
function combineDateAndHour(dateText, hourText) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || "").trim());
  if (!day) return null;

  let hours = 12, minutes = 0;   // midday when no time is given
  const clock = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(String(hourText || "").trim());
  if (clock) {
    hours = parseInt(clock[1], 10) % 12;
    minutes = parseInt(clock[2], 10);
    if (clock[3] && clock[3].toLowerCase() === "pm") hours += 12;
    if (!clock[3]) hours = parseInt(clock[1], 10);
  }
  const date = new Date(+day[1], +day[2] - 1, +day[3], hours, minutes, 0);
  return isNaN(date) ? null : date;
}

export function parseRss(text, { dateFrom = "feed" } = {}) {
  const blocks = [
    ...text.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...text.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)
  ].map(m => m[0]);

  const out = [];
  for (const block of blocks) {
    const title = tagValue(block, "title");
    if (!title) continue;

    const description = tagValue(block, "description") || tagValue(block, "summary") ||
                        tagValue(block, "content:encoded") || tagValue(block, "content");

    // <link>url</link>, or Atom's <link href="url"/>
    let url = tagValue(block, "link");
    if (!url) {
      const href = /<link[^>]*href="([^"]+)"/i.exec(block);
      if (href) url = href[1];
    }

    // Best case: the feed carries real event dates in dedicated elements.
    // Modern Events Calendar (very common on Ontario community WordPress sites)
    // publishes mec:startDate / mec:startHour, which beats reading the prose.
    const mecStart = tagValue(block, "mec:startDate");
    if (mecStart) {
      const startDate = combineDateAndHour(mecStart, tagValue(block, "mec:startHour"));
      const endDate = combineDateAndHour(tagValue(block, "mec:endDate"), tagValue(block, "mec:endHour"));
      if (startDate) {
        out.push({
          title, description, url,
          start: startDate,
          end: endDate,
          allDay: !tagValue(block, "mec:startHour"),
          dateConfidence: "high",
          location: "",
          uid: tagValue(block, "guid") || url,
          recurring: "",
          feedCategory: tagValue(block, "mec:category")
        });
        continue;
      }
    }

    const explicit = tagValue(block, "ev:startdate") || tagValue(block, "start_date") ||
                     tagValue(block, "startDate");

    let start = null;
    let allDay = false;
    let dateConfidence = "high";

    if (explicit) {
      start = new Date(explicit);
    } else if (dateFrom === "content") {
      const found = findDateInText(`${title} ${description}`);
      if (found) { start = found.date; allDay = found.allDay; dateConfidence = found.confidence; }
    }
    if (!start || isNaN(start)) {
      // Last resort: the date the post went up. For a feed we already know
      // publishes post dates rather than event dates, that is a guess and is
      // marked as one, so a reviewer knows not to trust it.
      const published = tagValue(block, "pubDate") || tagValue(block, "published") ||
                        tagValue(block, "updated") || tagValue(block, "dc:date");
      if (published) start = new Date(published);
      dateConfidence = dateFrom === "content" ? "low" : "high";
    }
    if (!start || isNaN(start)) continue;

    out.push({
      title, description, url, start, end: null, allDay, dateConfidence,
      location: "", uid: tagValue(block, "guid") || url, recurring: ""
    });
  }
  return out;
}

/* ===========================================================================
   WordPress — The Events Calendar REST API
   =========================================================================== */

export function parseTribe(json) {
  const events = (json && json.events) || [];
  return events.map(event => ({
    title: stripTags(event.title || ""),
    description: stripTags(event.description || event.excerpt || ""),
    url: event.url || event.website || "",
    start: event.start_date ? new Date(event.start_date.replace(" ", "T")) : null,
    end: event.end_date ? new Date(event.end_date.replace(" ", "T")) : null,
    allDay: !!event.all_day,
    location: event.venue
      ? [event.venue.venue, event.venue.address, event.venue.city].filter(Boolean).join(", ")
      : "",
    uid: String(event.id || event.global_id || event.url || ""),
    recurring: ""
  })).filter(event => event.title && event.start && !isNaN(event.start));
}

/* ===========================================================================
   schema.org Event, embedded as JSON-LD
   ===========================================================================
   Publishers add this markup so search engines can read their events. Reading
   it is using the page exactly as intended, not scraping around it. */

export function parseJsonLd(html) {
  const out = [];
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];

  const collect = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(collect); return; }
    if (node["@graph"]) collect(node["@graph"]);

    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    const isEvent = types.some(t => typeof t === "string" && /Event$/i.test(t));
    if (!isEvent || !node.startDate) return;

    const start = new Date(node.startDate);
    if (isNaN(start)) return;

    let location = "";
    if (typeof node.location === "string") location = node.location;
    else if (node.location) {
      const place = node.location;
      const address = place.address;
      location = [
        place.name,
        typeof address === "string" ? address
          : address ? [address.streetAddress, address.addressLocality].filter(Boolean).join(", ") : ""
      ].filter(Boolean).join(", ");
    }

    out.push({
      title: stripTags(node.name || ""),
      description: stripTags(node.description || ""),
      url: typeof node.url === "string" ? node.url : "",
      start,
      end: node.endDate && !isNaN(new Date(node.endDate)) ? new Date(node.endDate) : null,
      allDay: /^\d{4}-\d{2}-\d{2}$/.test(String(node.startDate)),
      location,
      uid: node["@id"] || node.url || node.name || "",
      recurring: ""
    });
  };

  for (const block of blocks) {
    try { collect(JSON.parse(block[1].trim())); }
    catch { /* a malformed block should not stop the others */ }
  }
  return out.filter(event => event.title);
}

/* ===========================================================================
   Finding a date inside ordinary prose
   ===========================================================================
   Some feeds publish the date the post went up rather than the date of the
   event. For those we read the text. It is a heuristic, so anything found this
   way is flagged in the run report and lands in the review queue like the rest. */

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

export function findDateInText(text, today = new Date()) {
  const clean = String(text).replace(/\s+/g, " ");

  // 2026-07-11
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(clean);
  if (iso) {
    return { date: new Date(+iso[1], +iso[2] - 1, +iso[3], 12), allDay: true, confidence: "high" };
  }

  // "July 11, 2026" / "Jul 11 2026" / "11 July 2026"
  const monthFirst = /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/.exec(clean);
  const dayFirst = /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s*(\d{4})?\b/.exec(clean);

  for (const [match, a, b, year] of [
    monthFirst ? [monthFirst[0], monthFirst[1], monthFirst[2], monthFirst[3]] : null,
    dayFirst ? [dayFirst[0], dayFirst[2], dayFirst[1], dayFirst[3]] : null
  ].filter(Boolean)) {
    const month = MONTHS[String(a).slice(0, 3).toLowerCase()];
    const day = parseInt(b, 10);
    if (month === undefined || !(day >= 1 && day <= 31)) continue;

    // No year given: assume the next time that date comes round.
    let resolved = year ? parseInt(year, 10) : today.getFullYear();
    let date = new Date(resolved, month, day, 12);
    if (!year && date < new Date(today.getTime() - 14 * 864e5)) {
      date = new Date(resolved + 1, month, day, 12);
    }
    if (isNaN(date)) continue;
    return { date, allDay: true, confidence: year ? "high" : "medium" };
  }

  return null;
}

export { stripTags };
