/* ---------------------------------------------------------------------------
   Is this event actually in North Durham?
   ---------------------------------------------------------------------------
   Several good feeds are regional or provincial: Durham Tourism covers the
   whole region, Lake Simcoe Region Conservation Authority covers a watershed
   that reaches Barrie, Ontario Conservation Areas covers the province. Without
   a filter the census quietly fills up with events an hour or more away, and
   stops being a census of North Durham at all.

   Matching is on place and venue names, because that is what listings actually
   contain. Both lists are meant to be extended: a missing venue means a missed
   event, and a missing exclusion means a Pickering event on a Port Perry page.

   Sources local enough not to need this — the Township of Uxbridge, Scugog
   Arts — simply do not set `filterToNorthDurham` and are kept whole.
   --------------------------------------------------------------------------- */

/** Places and venues that mean "this is ours". */
export const NORTH_DURHAM = [
  // Scugog Township
  "port perry", "scugog", "blackstock", "caesarea", "greenbank", "seagrave",
  "nestleton", "prince albert", "epsom", "utica", "manchester", "sonya",

  // Uxbridge Township
  "uxbridge", "leaskdale", "goodwood", "sandford", "zephyr", "udora",
  "siloam", "coppins corners",

  // Brock Township
  "beaverton", "cannington", "sunderland", "brock township", "wilfrid",
  "gamebridge", "thorah",

  // Venues and landmarks that carry no place name of their own
  "bounty from the boonies", "the second wedge", "town hall 1873",
  "borelians", "onstage uxbridge", "uxbridge music hall", "the boonies",
  "scugog arts", "kent farndale", "blue heron books", "the cosmos",
  "durham forest", "oak ridges moraine", "nonquon", "purple woods",
  "glen major", "walker woods", "secord forest", "brock tract",
  "lake scugog", "beaver river", "trent-severn", "pefferlaw"
];

/**
 * Places that are Durham Region or the wider watershed but NOT North Durham.
 * Checked first, because "Uxbridge Road, Pickering" should not count and a
 * listing naming both towns belongs to whichever it is actually held in.
 */
export const NOT_NORTH_DURHAM = [
  // South Durham
  "pickering", "ajax", "whitby", "oshawa", "bowmanville", "clarington",
  "courtice", "newcastle", "orono", "brooklin", "ashburn",
  // Lake Simcoe watershed, outside Durham
  "barrie", "newmarket", "aurora", "bradford", "keswick", "sutton",
  "georgina", "innisfil", "orillia", "holland landing", "east gwillimbury",
  // Kawartha and Peterborough
  "lindsay", "peterborough", "bobcaygeon", "fenelon", "omemee", "cobourg",
  "port hope", "northumberland",
  // Further afield
  "toronto", "markham", "stouffville", "richmond hill", "vaughan", "mississauga"
];

/** Decide on one string: names here, names elsewhere, or says nothing. */
function verdict(text) {
  const haystack = String(text || "").toLowerCase();
  const here = NORTH_DURHAM.some(place => haystack.includes(place));
  const elsewhere = NOT_NORTH_DURHAM.some(place => haystack.includes(place));
  if (here && !elsewhere) return true;
  if (elsewhere && !here) return false;
  if (here && elsewhere) {
    // Both named. Whichever comes first usually is the location: feeds write
    // "Uxbridge - Glasgow Tract" and "Pickering - Seaton Trail", putting the
    // town at the front. Trailing mentions tend to be directions or a partner
    // organisation rather than the venue.
    const firstHere = Math.min(...NORTH_DURHAM
      .map(p => haystack.indexOf(p)).filter(i => i !== -1));
    const firstElsewhere = Math.min(...NOT_NORTH_DURHAM
      .map(p => haystack.indexOf(p)).filter(i => i !== -1));
    return firstHere < firstElsewhere;
  }
  return null;   // says nothing either way
}

/**
 * True when an event belongs to Scugog, Uxbridge or Brock.
 *
 * The title is what an event is; the description wanders off into directions,
 * sponsors and other towns. So the title decides whenever it names a place at
 * all, and only a silent title sends us to the description.
 *
 * An event that names nowhere is excluded. On a regional feed, silence is far
 * more likely to mean "elsewhere" than "here".
 */
export function isNorthDurham(title, extra) {
  const fromTitle = verdict(title);
  if (fromTitle !== null) return fromTitle;

  const fromRest = verdict(extra);
  return fromRest === true;
}

/** Which township, for the record. Returns "" when it cannot tell. */
export function township(text) {
  const haystack = String(text).toLowerCase();
  const map = {
    Scugog: ["port perry", "scugog", "blackstock", "caesarea", "greenbank",
             "seagrave", "nestleton", "prince albert", "epsom", "utica"],
    Uxbridge: ["uxbridge", "leaskdale", "goodwood", "sandford", "zephyr",
               "udora", "siloam", "glen major", "walker woods"],
    Brock: ["beaverton", "cannington", "sunderland", "wilfrid", "gamebridge",
            "thorah", "pefferlaw"]
  };
  for (const [name, places] of Object.entries(map)) {
    if (places.some(place => haystack.includes(place))) return name;
  }
  return "";
}
