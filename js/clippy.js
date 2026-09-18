/* ---------------------------------------------------------------------------
   The assistant
   ---------------------------------------------------------------------------
   A paperclip, drawn here as SVG rather than borrowed, who points at things
   worth noticing in the census. Draggable, dismissible, and switched off in
   one click from the Control Panel.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var node = null, bubble = null, clip = null;
  var enabled = true;
  var lastIndex = -1;

  /* Lines are written once and reused; keep them short and local. */
  var LINES = [
    { text: "It looks like you're trying to find out what your township already has. Would you like some help?",
      action: { label: "Open the census", run: function () { window.NDC.apps.census(); } } },
    { text: "Five senses live in the body. Three don't. The census counts all eight anyway.",
      action: { label: "Show me", run: function () { window.NDC.apps.census(); } } },
    { text: "Every listing here was checked by a neighbour, on foot or by phone. None of it was scraped.",
      action: { label: "Add one", run: function () { window.NDC.apps.mail(); } } },
    { text: "Something on every week: markets, halls, trails. The calendar keeps the standing ones at the bottom.",
      action: { label: "Open the calendar", run: function () { window.NDC.apps.calendar(); } } },
    { text: "Conventional advocacy says look what we lack. This says look what we already have.",
      action: { label: "Read why", run: function () { window.NDC.apps.about(); } } },
    { text: "Hours change. Places close. If you spot one that's wrong, that correction is the most useful thing you could send us.",
      action: { label: "Send a correction", run: function () { window.NDC.apps.mail({ subject: "A correction to a listing" }); } } },
    { text: "Blackstock and Caesarea count too. The rural parts of North Durham are not an afterthought.",
      action: { label: "Browse by sense", run: function () { window.NDC.apps.census(); } } },
    { text: "You can change the wallpaper, and you can switch me off. I won't take it personally.",
      action: { label: "Control Panel", run: function () { window.NDC.apps.controlPanel(); } } }
  ];

  function clipSvg() {
    // Hand-drawn paperclip with eyes and brows, in the Win98 palette.
    return '<svg viewBox="0 0 56 68" role="img" aria-label="The assistant">' +
      '<g fill="none" stroke="#6f7782" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M18 20v30a10 10 0 0 0 20 0V16a7 7 0 0 0-14 0v33a4 4 0 0 0 8 0V22"/>' +
      '</g>' +
      '<g fill="none" stroke="#c8ccd4" stroke-width="1.6" stroke-linecap="round">' +
        '<path d="M18 20v30a10 10 0 0 0 20 0V16"/>' +
      '</g>' +
      '<g>' +
        '<ellipse cx="22" cy="27" rx="6.5" ry="7.5" fill="#fff" stroke="#3b4048" stroke-width="1.5"/>' +
        '<ellipse cx="35" cy="27" rx="6.5" ry="7.5" fill="#fff" stroke="#3b4048" stroke-width="1.5"/>' +
        '<circle class="pupil" cx="23.5" cy="28.5" r="2.6" fill="#101216"/>' +
        '<circle class="pupil" cx="36.5" cy="28.5" r="2.6" fill="#101216"/>' +
        '<path d="M16 18.5c3-2.5 7-2.5 10 0" stroke="#3b4048" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M31 18.5c3-2.5 7-2.5 10 0" stroke="#3b4048" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
  }

  function pick() {
    var index = lastIndex;
    if (LINES.length > 1) {
      while (index === lastIndex) index = Math.floor(Math.random() * LINES.length);
    } else { index = 0; }
    lastIndex = index;
    return LINES[index];
  }

  function render(line) {
    U.clear(bubble);
    var actions = [];
    if (line.action) {
      actions.push(el("button", {
        type: "button", class: "default", text: line.action.label,
        onclick: function () { line.action.run(); hide(); }
      }));
    }
    actions.push(el("button", { type: "button", text: "No thanks", onclick: hide }));

    U.append(bubble, [
      el("p", { text: line.text }),
      el("div", { class: "assistant-actions" }, actions)
    ]);
    bubble.hidden = false;
  }

  function hide() { if (bubble) bubble.hidden = true; }

  function say(line) {
    if (!enabled || !node) return;
    node.hidden = false;
    render(line || pick());
  }

  /* Let the clip be dragged around the desktop. */
  function draggable() {
    clip.addEventListener("pointerdown", function (event) {
      var startX = event.clientX, startY = event.clientY;
      var rect = node.getBoundingClientRect();
      var originRight = window.innerWidth - rect.right;
      var originBottom = window.innerHeight - rect.bottom;
      clip.setPointerCapture(event.pointerId);
      clip.style.cursor = "grabbing";

      function move(e) {
        node.style.right = Math.max(4, originRight - (e.clientX - startX)) + "px";
        node.style.bottom = Math.max(4, originBottom - (e.clientY - startY)) + "px";
      }
      function up(e) {
        clip.releasePointerCapture(e.pointerId);
        clip.style.cursor = "grab";
        clip.removeEventListener("pointermove", move);
        clip.removeEventListener("pointerup", up);
      }
      clip.addEventListener("pointermove", move);
      clip.addEventListener("pointerup", up);
      event.preventDefault();
    });
  }

  window.NDC.assistant = {
    init: function () {
      bubble = el("div", { class: "assistant-bubble", role: "status", hidden: "" });
      clip = el("div", { class: "assistant-clip bob", title: "Click for a suggestion", html: clipSvg() });
      clip.addEventListener("click", function () { bubble.hidden ? say() : hide(); });
      node = el("div", { id: "assistant" }, [bubble, clip]);
      document.body.appendChild(node);
      draggable();

      var tray = document.getElementById("tray-assistant");
      if (tray) tray.addEventListener("click", function () {
        if (!enabled) { window.NDC.settings.set("assistant", true); }
        say();
      });
    },
    setEnabled: function (value) {
      enabled = !!value;
      if (!node) return;
      node.hidden = !enabled;
      if (!enabled) hide();
      if (clip) clip.classList.toggle("bob", enabled && !window.NDC.settings.get("reduceMotion"));
    },
    say: say,
    hide: hide
  };
})();
