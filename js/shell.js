/* ---------------------------------------------------------------------------
   Shell — desktop icons, Start menu, taskbar clock
   ---------------------------------------------------------------------------
   PROGRAMS is the single list that feeds the desktop and the Start menu.
   Add an entry there and it appears in both.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var PROGRAMS = [
    { id: "readme",   label: "READ_ME.txt",   icon: "notepad",  desktop: true,  run: function () { window.NDC.apps.notepad("READ_ME.txt"); } },
    { id: "census",   label: "The Census",    icon: "computer", desktop: true,  run: function () { window.NDC.apps.census(); } },
    { id: "calendar", label: "Calendar",      icon: "calendar", desktop: true,  run: function () { window.NDC.apps.calendar(); } },
    { id: "stories",  label: "Stories",       icon: "book",     desktop: true,  run: function () { window.NDC.apps.stories(); } },
    { id: "resources",label: "Resources",     icon: "folder",   desktop: true,  run: function () { window.NDC.apps.resources(); } },
    { id: "mail",     label: "Send a Tip",    icon: "mail",     desktop: true,  run: function () { window.NDC.apps.mail(); } },
    { id: "about",    label: "About",         icon: "info",     desktop: true,  run: function () { window.NDC.apps.about(); } }
  ];

  /* --- Desktop icons -------------------------------------------------------- */

  function renderDesktopIcons() {
    var host = document.getElementById("desktop-icons");
    U.clear(host);

    PROGRAMS.filter(function (p) { return p.desktop; }).forEach(function (program) {
      var button = el("button", {
        type: "button", class: "desktop-icon", dataset: { program: program.id },
        onclick: function () { selectOnly(button); },
        ondblclick: function () { program.run(); },
        onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); program.run(); } }
      }, [U.icon(program.icon, 32), el("span", { text: program.label })]);

      // Single tap opens on touch devices, where there is no double-click.
      var touched = false;
      button.addEventListener("touchend", function () { touched = true; program.run(); });
      button.addEventListener("click", function () { if (touched) { touched = false; } });

      host.appendChild(el("li", {}, button));
    });
  }

  function selectOnly(button) {
    Array.prototype.forEach.call(document.querySelectorAll(".desktop-icon"), function (b) {
      b.classList.toggle("selected", b === button);
    });
  }

  /* --- Start menu ----------------------------------------------------------- */

  function startItem(label, icon, onClick, iconSize) {
    return el("button", { type: "button", class: "start-item", onclick: onClick },
      [U.icon(icon, iconSize || 24), el("span", { text: label })]);
  }

  function renderStartMenu() {
    var menu = document.getElementById("start-menu");
    var button = document.getElementById("start-button");
    U.clear(menu);

    function closeMenu() {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      Array.prototype.forEach.call(menu.querySelectorAll(".submenu"), function (s) { s.hidden = true; });
      Array.prototype.forEach.call(menu.querySelectorAll('[aria-expanded="true"]'), function (s) {
        s.setAttribute("aria-expanded", "false");
      });
    }

    function run(fn) { return function () { fn(); closeMenu(); }; }

    function submenuItem(label, icon, items) {
      var list = el("ul", { class: "submenu", role: "menu", hidden: "" },
        items.map(function (item) {
          return el("li", { role: "none" }, startItem(item.label, item.icon, run(item.run), 16));
        }));
      var trigger = el("button", {
        type: "button", class: "start-item has-submenu", "aria-haspopup": "true", "aria-expanded": "false",
        onclick: function () {
          var open = list.hidden;
          Array.prototype.forEach.call(menu.querySelectorAll(".submenu"), function (s) { s.hidden = true; });
          list.hidden = !open;
          this.setAttribute("aria-expanded", String(open));
        }
      }, [U.icon(icon, 24), el("span", { text: label })]);

      var li = el("li", { role: "none" }, [trigger, list]);
      li.addEventListener("mouseenter", function () {
        Array.prototype.forEach.call(menu.querySelectorAll(".submenu"), function (s) { s.hidden = true; });
        list.hidden = false;
      });
      return li;
    }

    var programs = PROGRAMS.map(function (p) { return { label: p.label, icon: p.icon, run: p.run }; });

    var items = [
      submenuItem("Programs", "folder-open", programs),
      submenuItem("Settings", "settings", [
        { label: "Control Panel", icon: "settings", run: function () { window.NDC.apps.controlPanel(); } },
        { label: "Show the assistant", icon: "question", run: function () { window.NDC.settings.set("assistant", true); window.NDC.assistant.say(); } },
        { label: "Reset to defaults", icon: "doc-settings", run: function () { window.NDC.settings.reset(); } }
      ]),
      el("li", { role: "none" }, startItem("Find a place…", "globe", run(function () {
        window.NDC.apps.census();
        setTimeout(function () {
          var input = document.getElementById("census-search");
          if (input) input.focus();
        }, 60);
      }))),
      el("li", { role: "none" }, startItem("Help & README", "book", run(function () { window.NDC.apps.notepad("READ_ME.txt"); }))),
      el("li", { class: "separator", role: "separator" }),
      el("li", { role: "none" }, startItem("Send a Tip…", "mail", run(function () { window.NDC.apps.mail(); }))),
      el("li", { role: "none" }, startItem("Close all windows", "recycle", run(function () {
        window.NDC.wm.list().forEach(function (w) { window.NDC.wm.close(w); });
      })))
    ];

    menu.appendChild(el("div", { class: "start-banner", "aria-hidden": "true", text: "North Durham" }));
    menu.appendChild(el("ul", { class: "start-list", role: "none" }, items));

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", function (event) {
      if (!menu.hidden && !menu.contains(event.target) && event.target !== button) closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) { closeMenu(); button.focus(); }
    });
  }

  /* --- Clock ---------------------------------------------------------------- */

  function startClock() {
    var clock = document.getElementById("clock");
    function tick() {
      var now = new Date();
      var hours = now.getHours();
      var suffix = hours >= 12 ? "PM" : "AM";
      var display = ((hours % 12) || 12) + ":" + String(now.getMinutes()).padStart(2, "0") + " " + suffix;
      clock.textContent = display;
      clock.title = U.formatDate(now);
    }
    tick();
    setInterval(tick, 15000);
    clock.addEventListener("click", function () { window.NDC.apps.calendar(); });
  }

  /* --- Desktop background click deselects ----------------------------------- */

  function wireDesktop() {
    var desktop = document.getElementById("desktop");
    desktop.addEventListener("pointerdown", function (event) {
      if (event.target === desktop || event.target.id === "desktop-icons") selectOnly(null);
    });
  }

  window.NDC.shell = {
    PROGRAMS: PROGRAMS,
    init: function () {
      renderDesktopIcons();
      renderStartMenu();
      startClock();
      wireDesktop();
    }
  };
})();
