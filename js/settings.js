/* ---------------------------------------------------------------------------
   Settings
   ---------------------------------------------------------------------------
   Every preference the Control Panel can change lives here. Values are kept in
   localStorage, so a visitor's choices survive a reload but never leave their
   own browser. If storage is unavailable the defaults simply apply each visit.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;

  var DEFAULTS = {
    wallpaper: "teal",
    pattern: "none",
    largeText: false,
    reduceMotion: false,
    assistant: true,
    showClock: true
  };

  var WALLPAPERS = [
    { id: "teal",     label: "Teal (classic)",   color: "#008080" },
    { id: "slate",    label: "Slate",            color: "#3a4a5a" },
    { id: "forest",   label: "Forest",           color: "#2d6a4f" },
    { id: "plum",     label: "Plum",             color: "#50395c" },
    { id: "charcoal", label: "Charcoal",         color: "#343a40" },
    { id: "wheat",    label: "Wheat",            color: "#b9a07a" }
  ];

  // Tiny repeating SVG patterns, inlined so nothing extra loads.
  var PATTERNS = {
    none: "none",
    weave: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 0h4v4H0zM4 4h4v4H4z' fill='%23ffffff' fill-opacity='.06'/%3E%3C/svg%3E\")",
    dots:  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='1' height='1' fill='%23ffffff' fill-opacity='.18'/%3E%3C/svg%3E\")",
    field: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath d='M0 15h16M15 0v16' stroke='%23ffffff' stroke-opacity='.08'/%3E%3C/svg%3E\")"
  };

  var current = null;

  function load() {
    var saved = U.store.read("settings", {}) || {};
    current = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      current[key] = saved[key] === undefined ? DEFAULTS[key] : saved[key];
    });
    return current;
  }

  function save() { U.store.write("settings", current); }

  function apply() {
    var paper = WALLPAPERS.filter(function (w) { return w.id === current.wallpaper; })[0] || WALLPAPERS[0];
    var root = document.documentElement;
    root.style.setProperty("--desktop-bg", paper.color);
    root.style.setProperty("--desktop-pattern", PATTERNS[current.pattern] || "none");
    document.body.classList.toggle("large-text", !!current.largeText);
    document.body.classList.toggle("reduce-motion", !!current.reduceMotion);

    var clock = document.getElementById("clock");
    if (clock) clock.hidden = !current.showClock;

    if (window.NDC.assistant) window.NDC.assistant.setEnabled(!!current.assistant);
  }

  window.NDC.settings = {
    WALLPAPERS: WALLPAPERS,
    PATTERNS: PATTERNS,
    DEFAULTS: DEFAULTS,
    init: function () {
      load();
      // Respect the visitor's OS-level motion preference unless they overrode it.
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
            U.store.read("settings", null) === null) {
          current.reduceMotion = true;
        }
      } catch (err) { /* older browser */ }
      apply();
    },
    get: function (key) { return key ? current[key] : current; },
    set: function (key, value) { current[key] = value; save(); apply(); },
    reset: function () { current = JSON.parse(JSON.stringify(DEFAULTS)); save(); apply(); }
  };
})();
