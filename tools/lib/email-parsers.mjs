/* ---------------------------------------------------------------------------
   Newsletter parsers
   ---------------------------------------------------------------------------
   Some of the biggest calendars in North Durham publish no feed at all, but
   they will happily email you. This reads those emails.

   It is a fallback, not a favourite. A newsletter is prose written for people,
   so parsing it is guesswork in a way that reading an iCalendar file is not.
   Everything found here lands in the imported tier and says which newsletter
   it came from.

   Each parser takes the plain-text body of one email and returns the same
   shape the feed parsers do:

     { title, start, end, allDay, location, description, url, uid, recurring }
   --------------------------------------------------------------------------- */

import { isNorthDurham, plainlyElsewhere } from "./geography.mjs";
export { isNorthDurham, plainlyElsewhere };

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sept: 8, sep: 8,
  oct: 9, nov: 10, dec: 11
};

/* ---------------------------------------------------------------------------
   Durham Tourism monthly e-newsletter
   ---------------------------------------------------------------------------
   Ends with an "Upcoming Events" block in a reliably consistent shape:

     May 1: Jane's Walk – Historic Whitby Walking Tour
     May 2 and 3: Oshawa Art Association Spring Art Festival
     May 14 to 17: Opening Weekend at Forsythe Family Farms

   A single date, two dates joined by "and", or a range joined by "to".
   The year is not in the line, so it comes from the email's own date.
   --------------------------------------------------------------------------- */

export function parseDurhamTourism(text, { emailDate }) {
  const out = [];
  const year = emailDate ? emailDate.getFullYear() : new Date().getFullYear();

  // Take everything after the "Upcoming Events" heading. The block runs to the
  // sign-off, which always starts "For unique trip ideas".
  const start = text.search(/Upcomin\s*g?\s*Events/i);
  if (start === -1) return out;
  const block = text.slice(start).split(/For unique trip ideas|Unsubscribe \|/i)[0];

  // "May 2 and 3: Title" / "May 14 to 17: Title" / "May 1: Title"
  const pattern = new RegExp(
    "\\b([A-Za-z]{3,9})\\s+(\\d{1,2})" +          // first month + day
    "(?:\\s*(and|to|–|-|through)\\s*(?:([A-Za-z]{3,9})\\s+)?(\\d{1,2}))?" +
    "\\s*:\\s*" +                                  // the colon
    "([^:]+?)" +                                   // the title
    "(?=\\s+[A-Z][a-z]{2,8}\\s+\\d{1,2}\\s*(?:and|to|–|-|through)?\\s*\\d{0,2}\\s*:|$)",
    "g"
  );

  let match;
  while ((match = pattern.exec(block)) !== null) {
    const month = MONTHS[match[1].toLowerCase()];
    if (month === undefined) continue;

    const firstDay = parseInt(match[2], 10);
    const joiner = match[3];
    const secondMonth = match[4] ? MONTHS[match[4].toLowerCase()] : month;
    const secondDay = match[5] ? parseInt(match[5], 10) : null;

    const title = match[6].replace(/\s+/g, " ").trim().replace(/[.,;]+$/, "");
    if (!title || title.length < 4) continue;

    // A newsletter dated December listing January events means next year.
    let eventYear = year;
    if (emailDate && month < emailDate.getMonth() - 6) eventYear = year + 1;

    const first = new Date(eventYear, month, firstDay, 12);
    if (isNaN(first)) continue;

    if (secondDay && /and/i.test(joiner || "")) {
      // Two separate days: emit both.
      out.push(makeEvent(title, first, null, "durham-tourism"));
      const second = new Date(eventYear, secondMonth, secondDay, 12);
      if (!isNaN(second)) out.push(makeEvent(title, second, null, "durham-tourism"));
    } else if (secondDay) {
      // A range: one event that runs across several days.
      const end = new Date(eventYear, secondMonth, secondDay, 12);
      out.push(makeEvent(title, first, isNaN(end) ? null : end, "durham-tourism"));
    } else {
      out.push(makeEvent(title, first, null, "durham-tourism"));
    }
  }

  return dedupe(out);
}

/* ---------------------------------------------------------------------------
   A generic fallback
   ---------------------------------------------------------------------------
   For newsletters we have not written a parser for yet. Finds lines that look
   like "<date>: <title>" or "<title> — <date>" and little else. Expect misses;
   a proper parser per newsletter is always better.
   --------------------------------------------------------------------------- */

export function parseGenericNewsletter(text, { emailDate }) {
  const out = [];
  const year = emailDate ? emailDate.getFullYear() : new Date().getFullYear();
  const lines = String(text).split(/\n|(?<=\.)\s{2,}/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8 || trimmed.length > 200) continue;

    const dated = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\s*[:–—-]\s*(.+)$/.exec(trimmed);
    if (!dated) continue;

    const month = MONTHS[dated[1].toLowerCase()];
    if (month === undefined) continue;

    const date = new Date(dated[3] ? parseInt(dated[3], 10) : year, month, parseInt(dated[2], 10), 12);
    if (isNaN(date)) continue;

    const title = dated[4].replace(/\s+/g, " ").trim();
    if (title.length < 4) continue;

    out.push(makeEvent(title, date, null, "newsletter"));
  }
  return dedupe(out);
}

/* --- Shared ---------------------------------------------------------------- */

function makeEvent(title, start, end, tag) {
  // "Workshop at the Uxbridge Historical Centre" — the venue is the tail.
  const venue = /\bat (?:the )?([A-Z][^,]{3,60})$/.exec(title);
  return {
    title,
    start,
    end,
    allDay: true,
    location: venue ? venue[1].trim() : "",
    description: "",
    url: "",
    uid: `${tag}-${start.toISOString().slice(0, 10)}-${title.slice(0, 40)}`,
    recurring: "",
    dateConfidence: "medium"      // read from prose, never from a date field
  };
}

/* ---------------------------------------------------------------------------
   Govstack calendar digests
   ---------------------------------------------------------------------------
   The Township of Brock ("What's happening next week") and Durham Region
   ("In Durham Region this Week") run the same calendar software, and its
   weekly email is a two-column HTML table:

     <tr><td>October 24 2026, 10:00 AM to 12:00 PM</td>
         <td><a href="https://events.townshipofbrock.ca/default/Detail/...">Title</a>
             <br/><p>Description</p></td></tr>

   Every row states its own full date and time, so this is the one newsletter
   we can trust as much as a feed. Each event links to its own page.
   --------------------------------------------------------------------------- */

const decode = s => String(s)
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&lsquo;/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&ndash;|&mdash;/g, "-")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

// "October 24 2026, 10:00 AM to 12:00 PM" / "October 25 2026, 1:00 PM" / "November 7 2026"
const GOVSTACK_WHEN = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*([AP]M))?(?:\s*to\s*(\d{1,2}):(\d{2})\s*([AP]M))?/i;

const hour24 = (h, ampm) => (Number(h) % 12) + (/p/i.test(ampm) ? 12 : 0);

export function parseGovstackDigest(html) {
  const out = [];
  const rows = String(html).split(/<tr[^>]*>/i).slice(1);
  for (const row of rows) {
    const cells = row.split(/<td[^>]*>/i).slice(1);
    if (cells.length < 2) continue;
    const when = GOVSTACK_WHEN.exec(decode(cells[0]));
    if (!when) continue;                      // the "Date | Event" header row
    const month = MONTHS[when[1].toLowerCase()];
    if (month === undefined) continue;
    const allDay = !when[4];
    const start = new Date(+when[3], month, +when[2],
      allDay ? 12 : hour24(when[4], when[6]), allDay ? 0 : +when[5]);
    const end = when[7]
      ? new Date(+when[3], month, +when[2], hour24(when[7], when[9]), +when[8])
      : null;

    const link = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(cells[1]);
    if (!link) continue;
    const title = decode(link[2]);
    const description = decode(cells[1].slice(cells[1].indexOf(link[0]) + link[0].length));
    // Brock often opens the description with "At Manilla Hall".
    const at = /^At ([^\n.]{3,60})/.exec(description);

    out.push({
      title,
      start,
      end: end && end > start ? end : null,
      allDay,
      location: at ? at[1].trim() : "",
      description,
      url: link[1].replace(/^http:/, "https:"),
      dateConfidence: "high"
    });
  }
  return dedupe(out);
}

/* ---------------------------------------------------------------------------
   Sideroads of Scugog
   ---------------------------------------------------------------------------
   A Squarespace newsletter. Each event is one paragraph:

     SAT/SUN | OCT 24-25
     <a href="...tracking...u=https://www.sideroadsofscugog.ca/events/...">Pumpkin Palooza at Willowtree Farm</a>
     Pumpkins, Corn Maze, Games and Family Fun! ...

   Headers come as "SAT | OCT 24 - FREE", "SAT/SUN | OCT 24-25",
   "FRI OCT 30 | 6-9pm" or "EVERY WED | 6:30-9pm". Only the ones with a real
   month and day become events; "EVERY ..." and "THUR & FRI" have no date and
   are left out (they would need a person to say which weeks). The year comes
   from the email's own date.

   Sideroads writes these listings, so we keep the facts (what, when, where)
   and send people to Sideroads for the rest: no description is copied.
   --------------------------------------------------------------------------- */

const SIDEROADS_HEADER = /^(?:[A-Z]{3,4}(?:\s*[/&]\s*[A-Z]{3,4})?\s*\|?\s*)?([A-Z]{3,4})\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s*(?:\|\s*(.*?))?\s*(?:[-–]\s*(FREE))?\s*$/i;

// "6-9pm", "11am-8pm", "6:30-9pm", "7pm"
function sideroadsTime(text) {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm))?/i.exec(text || "");
  if (!m) return null;
  const endAmpm = m[6] || m[3];
  const startAmpm = m[3] || (m[6] && +m[1] <= +m[4] ? m[6] : "pm");
  if (!startAmpm) return null;
  return {
    start: [hour24(m[1], startAmpm), +(m[2] || 0)],
    end: m[4] ? [hour24(m[4], endAmpm), +(m[5] || 0)] : null
  };
}

function realUrl(href) {
  const tracked = /[?&]u=([^&]+)/.exec(href.replace(/&amp;/g, "&"));
  const url = tracked ? decodeURIComponent(tracked[1]) : href;
  return url.replace(/[?&]ss_source=.*$/, "");
}

export function parseSideroads(html, { emailDate }) {
  const out = [];
  const sent = emailDate || new Date();
  for (const piece of String(html).split(/<\/p>/i)) {
    // Only the paragraph itself; the image block above it has its own link.
    const chunk = piece.slice(Math.max(0, piece.search(/<p[\s>](?![\s\S]*<p[\s>])/i)));
    const link = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(chunk);
    if (!link) continue;
    const before = decode(chunk.slice(0, chunk.indexOf(link[0]))).split("\n").pop().trim();
    const head = SIDEROADS_HEADER.exec(before);
    if (!head) continue;
    const month = MONTHS[head[1].toLowerCase()];
    if (month === undefined) continue;

    // A newsletter sent in December can list January events.
    let year = sent.getFullYear();
    if (month < sent.getMonth() - 6) year += 1;

    const title = decode(link[2]);
    const rest = decode(chunk.slice(chunk.indexOf(link[0]) + link[0].length));
    const time = sideroadsTime(head[4]) || sideroadsTime(rest.split("\n")[0]);
    const start = time
      ? new Date(year, month, +head[2], ...time.start)
      : new Date(year, month, +head[2], 12, 0);
    const end = head[3]
      ? new Date(year, month, +head[3], time && time.end ? time.end[0] : 12, time && time.end ? time.end[1] : 0)
      : time && time.end ? new Date(year, month, +head[2], ...time.end) : null;
    const at = / at (.+)$/.exec(title);

    out.push({
      title,
      start,
      end: end && end > start ? end : null,
      allDay: !time,
      location: at ? at[1].trim() : "",
      description: "",                       // see the note above
      tagText: `${head[5] ? "free admission " : ""}${rest}`,
      url: realUrl(link[1]),
      dateConfidence: "high"
    });
  }
  return dedupe(out);
}

function dedupe(events) {
  const seen = new Map();
  for (const event of events) {
    const key = event.start.toISOString().slice(0, 10) + "|" +
                event.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!seen.has(key)) seen.set(key, event);
  }
  return [...seen.values()];
}

export const EMAIL_PARSERS = {
  "durham-tourism": parseDurhamTourism,
  "govstack-digest": parseGovstackDigest,
  "sideroads": parseSideroads,
  "generic": parseGenericNewsletter
};
