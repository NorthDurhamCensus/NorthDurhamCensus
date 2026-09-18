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
  // The address shown to visitors, and where the mail-app fallback writes to.
  contactEmail: "NorthDurhamCensus@outlook.com",

  // The Send a Tip window can post through either of two free relays, so the
  // project needs no server of its own. Set `provider` to whichever you use:
  //
  //   "formsubmit"  FormSubmit. No account. The destination address must
  //                 confirm once, by clicking a link it emails on the first
  //                 submission. Use the alias string it gives you afterwards
  //                 rather than the plain address, so the inbox is not sitting
  //                 in public source for scrapers to harvest.
  //
  //   "emailjs"     EmailJS. Needs a free account, already set up for this
  //                 project. Nothing identifying goes in the page, only IDs.
  //                 Free plan: 200 emails a month, and the domain allowlist is
  //                 a paid feature — so anyone who copies these IDs out of this
  //                 public repository could spend that quota. They cannot send
  //                 their own content: EmailJS only ever sends the template you
  //                 defined, to you. Worth knowing, not worth losing sleep over.
  //
  //   "mailto"      No relay at all. Opens the visitor's own mail program.
  //                 Always works, but many visitors have no mail app set up.
  //
  // Whichever is chosen, if the send fails the window falls back to "mailto"
  // so a submission is never simply lost.
  mail: {
    provider: "emailjs",

    formsubmit: {
      endpoint: "https://formsubmit.co/ajax/NorthDurhamCensus@outlook.com"
    },

    emailjs: {
      serviceId: "service_kyx39u5",
      templateId: "template_wv6adad",
      publicKey: "0EKjvlHHI958kjiPa",
      // The template in the EmailJS dashboard must use these variable names.
      // Any it does not use are simply ignored:
      //   {{kind}} {{place}} {{message}} {{from_name}} {{reply_to}} {{subject}}
      toName: "North Durham Census"
    }
  },

  // --- Winamp ---------------------------------------------------------------
  // Webamp ships no music, so the playlist is whatever is listed here. Files
  // must sit in this repository (or be served with permissive CORS headers),
  // and must be something we actually have the right to redistribute.
  //
  // `duration` is in seconds and is optional; Webamp reads the real length once
  // a track starts, it just makes the playlist look right before you press play.
  //
  // An empty list is fine: Winamp opens and you can drag an MP3 onto it.
  winamp: {
    tracks: [
      {
        url: "assets/audio/reaching-out.mp3",
        title: "Reaching Out",
        artist: "Kevin MacLeod",
        duration: 61
      }
      // Placeholder music. See assets/audio/README.md — a local recording would
      // suit a census of the senses far better than stock instrumental.
    ]
  },

  // --- Links ----------------------------------------------------------------
  repoUrl: "https://github.com/NorthDurhamCensus/NorthDurhamCensus",
  licenceUrl: "https://github.com/NorthDurhamCensus/NorthDurhamCensus/blob/main/LICENSE",

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
