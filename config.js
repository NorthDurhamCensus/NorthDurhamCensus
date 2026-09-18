/* ---------------------------------------------------------------------------
   North Durham Census — site configuration
   ---------------------------------------------------------------------------
   This is the one file most people will ever need to edit. Everything here
   controls text, contact details and which icons appear on the desktop.
   It is plain JavaScript, but you only need to change the bits inside quotes.
   --------------------------------------------------------------------------- */

window.NDC = window.NDC || {};

window.NDC.config = {
  // --- Identity -------------------------------------------------------------
  siteName: "North Durham Census",
  tagline: "A count of what actually counts.",
  townships: "Scugog, Uxbridge & Brock Townships, Ontario",
  disclaimer: "An independent, volunteer-run project. Not affiliated with Statistics Canada.",

  // --- Where submissions and tips go ---------------------------------------
  // formEndpoint posts the Mail window straight to the inbox below, with no
  // server of our own. Swap the address to change where mail lands.
  // Set formEndpoint to "" to fall back to opening the visitor's own mail app.
  contactEmail: "jodijanwin@gmail.com",
  formEndpoint: "https://formsubmit.co/ajax/jodijanwin@gmail.com",

  // --- Links ----------------------------------------------------------------
  repoUrl: "https://github.com/NorthDurhamCensus",
  licenceUrl: "https://github.com/NorthDurhamCensus",

  // --- The eight senses -----------------------------------------------------
  // Order here is the order folders appear in. `subtitle` is the plain-language
  // explanation shown under each one. `color` tints the file list.
  senses: [
    { name: "Taste",              subtitle: "what we eat",                     color: "#DB5644" },
    { name: "Sight",              subtitle: "what we see",                     color: "#3175B9" },
    { name: "Sound",              subtitle: "what we hear",                    color: "#6D54A5" },
    { name: "Touch",              subtitle: "what we make & fix",              color: "#E78931" },
    { name: "Smell",              subtitle: "fresh air & forests",             color: "#7CB663" },
    { name: "Sense of Security",  subtitle: "housing, health & legal help",    color: "#29899E" },
    { name: "Sense of Belonging", subtitle: "gathering places",                color: "#C74B9E" },
    { name: "Common Sense",       subtitle: "practical help",                  color: "#A88C73" }
  ]
};
