/* ---------------------------------------------------------------------------
   Categories
   ---------------------------------------------------------------------------
   One list for stories, events and places, shared with the North of the
   Ridges site. Keep CATEGORIES in step with the News repo.

   Matched on the title first, because the title is what an event is and the
   description is where it wanders. Only a silent title looks wider. Order
   matters: the first rule that matches wins, so the narrow ones go first.
   --------------------------------------------------------------------------- */

export const CATEGORIES = [
  "Community",       // fairs, parades, fundraisers, clubs, halls, worship
  "Outdoors",        // trails, parks, conservation, nature, gardens
  "Arts & culture",  // music, theatre, galleries, heritage, books
  "Food & farms",    // markets, harvest suppers, farms, community gardens
  "Sports & rec",    // teams, arenas, fitness, indoor walking, cards and games
  "Learning",        // library programs, classes, workshops, talks, schools
  "Help & support",  // food banks, clinics, legal aid, housing, employment
  "Civic"            // council, public meetings, consultations, elections
];

const RULES = [
  ["Civic",          /\b(council|committee of the whole|public meeting|budget|consultation|open house|by-?law|election|mayor|planning)\b/i],
  ["Help & support", /\b(clinic|food bank|health|legal|housing|shelter|tax clinic|flu shot|vaccin\w*|counsel\w*|support group|crisis|warming centre|alzheimer|caregiver\w*|employment)\b/i],
  // Before Outdoors, so "Indoor Walking Trail" is not filed as a hike.
  ["Sports & rec",   /\b(indoor|arena|gym|run|race|5k|10k|ski|skate|skating|hockey|soccer|baseball|curling|golf|tournament|swim|cycling|bike|yoga|pickleball|fitness|euchre|bingo|cribbage)\b/i],
  ["Food & farms",   /\b(market|farmers?|farm|harvest|supper|dinner|breakfast|brunch|pancake|bbq|potluck|bake sale|maple|tasting|brewery|winery|agricultural)\b/i],
  ["Outdoors",       /\b(hike|hiking|walk|walking|trail|trails|forest|woods|conservation|nature|birding|garden|gardens|park|wetland|paddle|canoe|kayak|snowshoe|tree planting|clean-?up)\b/i],
  ["Arts & culture", /\b(concert|music|band|choir|singer|orchestra|open mic|karaoke|dance|theatre|theater|play|performance|recital|opera|fiddle|comedy|art|arts|gallery|exhibit|paint|photograph|film|movie|screening|museum|heritage|history|studio tour|craft|quilt|pottery|author|book|poetry|audition\w*|callbacks)\b/i],
  ["Learning",       /\b(library|class|classes|course|training|info session|seminar|lecture|talk|learn|learning|tutor|literacy|computer|how to|workshop|story ?time|webinar)\b/i],
  ["Community",      /\b(parade|festival|fair|fundrais\w*|legion|social|celebrat\w*|remembrance|santa|volunteer\w*|seniors|youth|club|worship|church|service|bia)\b/i]
];

export function guessCategory(event, fallback) {
  const title = event.title || "";
  for (const [category, pattern] of RULES) if (pattern.test(title)) return category;
  const wider = `${event.description || ""} ${event.location || ""}`;
  for (const [category, pattern] of RULES) if (pattern.test(wider)) return category;
  return CATEGORIES.includes(fallback) ? fallback : "Community";
}
