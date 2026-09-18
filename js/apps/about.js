/* ---------------------------------------------------------------------------
   About — why the census exists, and who made it
   ---------------------------------------------------------------------------
   Two tabs: the argument, and the credits. Copy carried over from the original
   Community Atlas site so nothing written in 2026 was lost in the move.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  function tabPanel(children) {
    return el("div", { class: "window", role: "tabpanel", style: "flex:1 1 auto;min-height:0;display:flex;" },
      el("div", { class: "sunken-panel scroll", style: "margin:4px;flex:1 1 auto;" },
        el("div", { class: "pad reader" }, children)));
  }

  function theArgument() {
    var cfg = window.NDC.config;
    return tabPanel([
      el("h2", { text: "A count of what actually counts" }),
      el("p", { text: "Many communities are taught to see only scarcity while real resources stay fragmented and invisible. The North Durham Census is built to make that invisibility impossible to maintain. The official census counts people; this one counts what a place can taste, see, hear, make and share." }),
      el("p", { text: "North Durham is full of hidden abundance: the makerspace inside the library, the farmer at the Saturday market, the Legion hall open to everyone, the conservation trail ten minutes from your door. Most residents have no idea how much is already here." }),

      el("h3", { text: "Why organise a map by the senses?" }),
      el("p", { text: "Because that is how a place is actually lived. You don't experience your township as a list of service categories. You taste it at the market, hear it at the music hall, touch it at the makerspace, smell it on the trail. And some senses don't live in the body at all: a sense of security, a sense of belonging, plain common sense. The census counts all eight." }),
      el("ul", {}, (cfg.senses || []).map(function (sense) {
        return el("li", {}, [
          el("span", { class: "swatch", style: "background:" + sense.color, "aria-hidden": "true" }),
          el("strong", { text: sense.name }),
          document.createTextNode(" — " + sense.subtitle)
        ]);
      })),

      el("h3", { text: "What a visible census does" }),
      el("p", { text: "By making these fragments visible in one shareable census, you alter what people believe is possible where they live. Instead of beginning with a demand to institutions, you begin by changing what people believe already exists." }),
      el("p", { text: "A community that sees only scarcity behaves one way. A community that sees itself as resourced, connected and capable begins to self-organise. The census is an epiphany device: it makes cooperation imaginable, then practical." }),
      el("p", { text: "Once people use the census to solve daily problems, they become more available for deeper work — housing advocacy, protecting public space, cooperative enterprise rooted in a place they can see themselves in." }),
      el("p", {}, el("strong", { text: "The map is not the destination. It is the opening move." })),

      el("h3", { text: "What's still missing" }),
      el("p", { text: "The census doesn't pretend North Durham has everything it needs. Naming what is absent is part of the work too — not as complaint, but as coordinate." }),

      el("h3", { text: "How it gets made" }),
      el("p", { text: "Walk the townships with a notebook. Gather addresses, hours, names, categories. Verify each listing by visit, call or message, never by scraping the internet. Drive out to Blackstock and Caesarea: the rural parts of North Durham are not an afterthought." }),
      el("p", { text: "Print a run of zines and leave copies in the library, the Legion, the community centre, the farmers' market. Post the digital version in local groups and on community boards. Update monthly, so the census becomes a living civic ritual." }),
      el("p", {}, el("em", { text: "What would happen if North Durham stopped introducing itself through problems and began introducing itself through latent power?" }))
    ]);
  }

  function theCredits() {
    var cfg = window.NDC.config;
    return tabPanel([
      el("h2", { text: cfg.siteName }),
      el("p", { text: cfg.tagline }),
      el("p", { text: cfg.townships }),
      el("p", { class: "hint", text: cfg.disclaimer }),

      el("h3", { text: "Who makes it" }),
      el("p", { text: "Neighbours. Listings are gathered and verified by local volunteers, on foot and by phone. If you live here, you are already qualified to contribute." }),

      el("h3", { text: "The code" }),
      el("p", {}, [
        document.createTextNode("Open source, and deliberately simple: plain HTML, CSS and JavaScript with no build step, so anyone who can edit a text file can improve it. "),
        el("a", { href: cfg.repoUrl, text: "The repository is here." })
      ]),

      el("h3", { text: "Built with" }),
      el("ul", {}, [
        el("li", {}, [el("a", { href: "https://jdan.github.io/98.css/", text: "98.css" }), document.createTextNode(" by Jordan Scales — window chrome (MIT).")]),
        el("li", {}, [el("a", { href: "https://github.com/React95/React95", text: "React95 icon set" }), document.createTextNode(" — the desktop icons (MIT).")]),
        el("li", {}, [el("a", { href: "https://opendata.durham.ca", text: "Durham Region Open Data" }), document.createTextNode(" — trails, parks, libraries and community halls.")]),
        el("li", {}, [el("a", { href: "https://www.openstreetmap.org/copyright", text: "OpenStreetMap contributors" }), document.createTextNode(" — map data.")])
      ]),

      el("h3", { text: "Counted so far" }),
      el("ul", {}, [
        el("li", { text: U.listings().length + " listings across " + (cfg.senses || []).length + " senses" }),
        el("li", { text: U.events().length + " events" }),
        el("li", { text: U.stories().length + (U.stories().length === 1 ? " story" : " stories") })
      ]),

      el("p", { class: "hint", text: "Something wrong, or missing? Open Send a Tip and tell us. It is the fastest way to help." })
    ]);
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.about = function () {
    return window.NDC.wm.open({
      id: "about", title: "About the Census", icon: "info",
      width: 560, height: 430,
      build: function (body) {
        var panels = { argument: theArgument(), credits: theCredits() };
        panels.credits.hidden = true;

        function select(which) {
          Object.keys(panels).forEach(function (key) { panels[key].hidden = key !== which; });
          Array.prototype.forEach.call(tabs.querySelectorAll("li"), function (li) {
            li.setAttribute("aria-selected", li.dataset.tab === which ? "true" : "false");
          });
        }

        var tabs = el("menu", { role: "tablist", style: "flex:0 0 auto;" }, [
          el("li", { role: "tab", "aria-selected": "true", dataset: { tab: "argument" },
                     onclick: function () { select("argument"); } },
             el("a", { href: "#", text: "Why", onclick: function (e) { e.preventDefault(); } })),
          el("li", { role: "tab", "aria-selected": "false", dataset: { tab: "credits" },
                     onclick: function () { select("credits"); } },
             el("a", { href: "#", text: "Credits", onclick: function (e) { e.preventDefault(); } }))
        ]);

        U.append(body, [tabs, panels.argument, panels.credits]);
        U.externalLinks(body);
      }
    });
  };
})();
