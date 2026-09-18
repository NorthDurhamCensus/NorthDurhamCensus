/* ---------------------------------------------------------------------------
   Notepad — plain text files on the desktop
   ---------------------------------------------------------------------------
   READ_ME.txt and anything else we want to hand a visitor as plain text.
   Text lives in js/apps/notepad.js so the site still works opened straight
   from disk, with no server and no fetch().
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var FILES = {
    "READ_ME.txt": [
      "THE NORTH DURHAM CENSUS",
      "=======================",
      "",
      "A count of what actually counts.",
      "Scugog, Uxbridge and Brock Townships, Ontario.",
      "(An independent, volunteer project. Not affiliated with Statistics Canada.)",
      "",
      "",
      "WHAT THIS IS",
      "------------",
      "The official census counts people. This one counts what a place can",
      "taste, see, hear, make and share.",
      "",
      "Conventional advocacy says: look what we lack.",
      "This census says: look what we already have — and asks why it stays",
      "invisible, unsupported and unshared.",
      "",
      "",
      "THE EIGHT SENSES",
      "----------------",
      "  Taste ................ what we eat",
      "  Sight ................ what we see",
      "  Sound ................ what we hear",
      "  Touch ................ what we make & fix",
      "  Smell ................ fresh air & forests",
      "  Sense of Security .... housing, health & legal help",
      "  Sense of Belonging ... gathering places",
      "  Common Sense ......... practical help",
      "",
      "Five live in the body. Three do not. A place is lived through all eight.",
      "",
      "",
      "GETTING AROUND",
      "--------------",
      "  The Census ....... every listing, filed by sense. Start here.",
      "  Calendar ......... what is on, and what is on every week.",
      "  Stories .......... solidarity in North Durham, as reported.",
      "  Resources ........ organisations and tools worth knowing.",
      "  Send a Tip ....... add what you know. Everything is verified.",
      "  Control Panel .... change the wallpaper, text size and assistant.",
      "",
      "Double-click an icon, or use the Start menu. Windows drag by their",
      "title bar and resize from the bottom-right corner.",
      "",
      "",
      "HOW TO HELP",
      "-----------",
      "1. Open Send a Tip and add one place you already know about.",
      "2. Check a listing near you. Hours change; tell us when they do.",
      "3. Print the census and leave copies where people actually stand:",
      "   the library, the Legion, the market, the community centre.",
      "",
      "The map is not the destination. It is the opening move.",
      ""
    ].join("\n")
  };

  window.NDC.apps = window.NDC.apps || {};

  window.NDC.apps.notepad = function (filename) {
    var name = filename || "READ_ME.txt";
    var text = FILES[name] || "This file is empty.";

    return window.NDC.wm.open({
      id: "notepad:" + name,
      title: name + " — Notepad",
      icon: "notepad",
      width: 540, height: 420,
      build: function (body) {
        var area = el("textarea", { class: "notepad-text", spellcheck: "false", readonly: "readonly",
                                    "aria-label": name });
        area.value = text;
        U.append(body, [
          el("div", { class: "menu-strip" }, [
            el("button", { type: "button", text: "Open the census", onclick: function () { window.NDC.apps.census(); } }),
            el("button", { type: "button", text: "Send a tip", onclick: function () { window.NDC.apps.mail(); } })
          ]),
          area
        ]);
      }
    });
  };

  window.NDC.apps.notepadFiles = FILES;
})();
