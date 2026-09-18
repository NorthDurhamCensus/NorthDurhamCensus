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

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sept: 8, sep: 8,
  oct: 9, nov: 10, dec: 11
};

/* ---------------------------------------------------------------------------
   Which events are ours
   ---------------------------------------------------------------------------
   The Durham Tourism newsletter covers the whole region, and most of it is
   Pickering, Ajax, Whitby, Oshawa and Bowmanville — not North Durham. Without
   this filter the census would quietly fill up with events an hour away.

   Matching is on place and venue names, because that is what the listings
   actually contain. Add to it freely; a missed venue means a missed event. */

const NORTH_DURHAM = [
  // Scugog
  "port perry", "scugog", "blackstock", "caesarea", "greenbank", "seagrave",
  "nestleton", "prince albert", "epsom", "utica", "manchester",
  // Uxbridge
  "uxbridge", "leaskdale", "goodwood", "sandford", "zephyr", "coppins corners",
  // Brock
  "beaverton", "cannington", "sunderland", "brock township", "wilfrid",
  // Venues that do not carry a place name in their title
  "bounty from the boonies", "the second wedge", "town hall 1873",
  "borelians", "onstage uxbridge", "music hall", "the boonies",
  "durham forest", "oak ridges moraine", "nonquon", "purple woods"
];

export function isNorthDurham(text) {
  const haystack = String(text).toLowerCase();
  return NORTH_DURHAM.some(place => haystack.includes(place));
}

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
  "generic": parseGenericNewsletter
};
