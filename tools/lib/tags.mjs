/* ---------------------------------------------------------------------------
   Tags
   ---------------------------------------------------------------------------
   The fixed list. Categories say what something IS; tags say who it suits
   and how to get in. Use only these (spelled exactly), so filters work.
   To add one, add it here and in CONTRIBUTING.md in the same change.

   The importer adds a tag only when the feed's own words say so plainly.
   It never guesses "Accessible" from silence.
   --------------------------------------------------------------------------- */

export const TAGS = [
  // Cost
  "Free",
  "Pay what you can",
  // Who it suits
  "Family-friendly",
  "Kids",
  "Youth",
  "Seniors",
  "19+",
  // Getting in
  "Accessible",
  "Drop-in",
  "Registration required",
  "Dog-friendly",
  "Other languages",
  // Ways to help
  "Volunteers needed"
];

const RULES = [
  // Only "free" that is about getting in. Not "feel free to bring greenery"
  // or "free popcorn".
  ["Free",                  /(\bno charge\b|\bno cost\b|\bfree of charge\b|\bfree (admission|entry|event|program|programs|workshop|class|classes|session|concert|show|screening|to attend|and open)\b|\bfree for (all|everyone|kids|children|families|members|the public)\b|\b(is|are|it's|fun is) free\b|\bfree[,!])/i],
  ["Pay what you can",      /\b(pay[- ]what[- ]you[- ]can|pwyc|by donation|donations? welcome)\b/i],
  // Not plain "family": a food bank serving 30 families, or "family doctors",
  // is not a family outing.
  ["Family-friendly",       /\b(family[- ]friendly|kid[- ]friendly|all ages|all-ages|for the whole family|families welcome|family (fun|day|event|skate|swim|night))\b/i],
  ["Kids",                  /\b(kids|children|child|toddlers?|preschool|ages? [0-9]{1,2} ?(to|-|–) ?1[0-2])\b/i],
  ["Youth",                 /\b(youth|teens?|teenagers?|ages? 1[2-8])\b/i],
  ["Seniors",               /\b(seniors?|older adults|55\+|60\+|65\+)\b/i],
  ["19+",                   /\b(19\+|adults only|licensed event|must be 19)\b/i],
  ["Accessible",            /\b(wheelchair[- ]accessible|accessible venue|barrier[- ]free|accessible entrance)\b/i],
  ["Drop-in",               /\b(drop[- ]in|no registration|no need to register)\b/i],
  ["Registration required", /\b(registration (is )?required|pre-?registration|register (in advance|online|by)|must register|tickets? required|space is limited)\b/i],
  ["Dog-friendly",          /\b(dog[- ]friendly|dogs (are )?welcome|leashed dogs)\b/i],
  ["Other languages",       /\b(en français|in french|french[- ]language|spanish|interpretation available|asl)\b/i],
  ["Volunteers needed",     /\b(volunteers? (needed|wanted)|looking for volunteers|call for volunteers)\b/i]
];

export function guessTags(event) {
  const text = `${event.title || ""} ${event.description || ""}`;
  const tags = RULES.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
  // "Drop-in" and "Registration required" contradict; trust registration.
  return tags.includes("Registration required") ? tags.filter(t => t !== "Drop-in") : tags;
}
