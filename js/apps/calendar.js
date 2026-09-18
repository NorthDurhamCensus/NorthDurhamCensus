/* ---------------------------------------------------------------------------
   Calendar — community events, month by month
   ---------------------------------------------------------------------------
   Two tiers, kept visibly apart:
     Census    events a neighbour verified (data/events.js) — solid colour.
     Imported  events pulled from calendars other organisations publish
               (data/events-imported.js) — outlined, with the source named.
   The View buttons switch between them. One-off events land on their date;
   anything with a `recurring` note is also listed below the grid.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  function build(body) {
    var today = new Date();
    var selectedDate = null;
    var tier = U.store.read("calendarTier", "all");   // all | verified | imported

    /* Every read of the calendar's events goes through here, so the View
       buttons apply everywhere at once. */
    function events() {
      if (tier === "verified") return U.eventsVerified();
      if (tier === "imported") return U.eventsImported();
      return U.events();
    }

    /* Open on this month if anything is on, otherwise on the next month that
       has something, so the calendar is never a blank grid on first open. */
    function openingMonth() {
      var thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      var dates = events().map(function (ev) { return U.parseDate(ev.date); })
                            .filter(Boolean)
                            .sort(function (a, b) { return a - b; });
      if (!dates.length) return thisMonth;
      var hasThisMonth = dates.some(function (d) {
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
      });
      if (hasThisMonth) return thisMonth;
      var upcoming = dates.filter(function (d) { return d >= today; })[0];
      var target = upcoming || dates[dates.length - 1];
      return new Date(target.getFullYear(), target.getMonth(), 1);
    }

    var view = openingMonth();

    /* --- The View switch ---------------------------------------------------
       Three radio buttons rather than a checkbox, because "both" is a real and
       useful choice, not the absence of a filter. */

    var tierBar = el("div", { class: "tier-bar", role: "radiogroup", "aria-label": "Which events to show" });

    function buildTierBar() {
      U.clear(tierBar);
      var counts = {
        all: U.events().length,
        verified: U.eventsVerified().length,
        imported: U.eventsImported().length
      };
      var options = [
        { id: "all", label: "Everything", hint: "Both tiers together" },
        { id: "verified", label: "The Census", hint: "Checked by a neighbour" },
        { id: "imported", label: "Imported", hint: "Pulled from other calendars, not yet checked" }
      ];

      tierBar.appendChild(el("span", { class: "tier-label", text: "View:" }));
      options.forEach(function (option) {
        var id = "cal-tier-" + option.id;
        var input = el("input", {
          type: "radio", name: "cal-tier", id: id, title: option.hint,
          onchange: function () {
            tier = option.id;
            U.store.write("calendarTier", tier);
            selectedDate = null;
            render();
          }
        });
        input.checked = tier === option.id;
        tierBar.appendChild(el("span", { class: "tier-option" }, [
          input,
          el("label", { for: id, title: option.hint,
                        text: option.label + " (" + counts[option.id] + ")" })
        ]));
      });
    }
    buildTierBar();

    var heading = el("strong", { text: "" });
    var grid = el("div", { class: "sunken-panel scroll", style: "flex:1 1 auto;" });
    var detail = el("div", { class: "sunken-panel scroll", style: "flex:0 0 32%;min-height:76px;" });
    var status = el("p", { class: "status-bar-field", text: "" });

    function eventsOn(date) {
      return events().filter(function (ev) {
        var d = U.parseDate(ev.date);
        return d && d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
      });
    }

    function shift(months) {
      view = new Date(view.getFullYear(), view.getMonth() + months, 1);
      selectedDate = null;
      render();
    }

    function render() {
      heading.textContent = U.MONTHS[view.getMonth()] + " " + view.getFullYear();
      U.clear(grid);

      var firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
      var start = new Date(view.getFullYear(), view.getMonth(), 1 - firstDay, 12);

      var headRow = el("tr", {}, U.DAYS.map(function (d) { return el("th", { text: d, scope: "col" }); }));
      var rows = [];
      var cursor = new Date(start);

      for (var week = 0; week < 6; week++) {
        var cells = [];
        for (var day = 0; day < 7; day++) {
          var date = new Date(cursor);
          var inMonth = date.getMonth() === view.getMonth();
          var dayEvents = eventsOn(date);

          var cell = el("td", {
            class: (inMonth ? "" : "other-month ") +
                   (date.toDateString() === today.toDateString() ? "today" : "")
          }, [el("span", { class: "cal-day-num", text: String(date.getDate()) })]);

          // A festival day can carry fifteen events. Show a few and offer the
          // rest, so one busy Saturday doesn't stretch the whole month grid.
          var MAX_PER_DAY = 3;
          var shown = dayEvents.slice(0, MAX_PER_DAY);
          var hidden = dayEvents.length - shown.length;

          shown.forEach(function (ev) {
            var sense = U.sense(ev.category);
            // Verified events are filled in; imported ones are outlined, so you
            // can tell at a glance which the census stands behind.
            var style = ev.imported
              ? "color:" + sense.color + ";box-shadow:inset 0 0 0 1px " + sense.color + ";"
              : "background:" + sense.color + ";";
            cell.appendChild(el("span", {
              class: "cal-dot" + (ev.imported ? " imported" : ""),
              text: ev.title,
              title: ev.title + (ev.imported ? "  (via " + ev.source.name + ")" : ""),
              style: style,
              onclick: (function (d) { return function () { selectedDate = d; renderDetail(); }; })(new Date(date))
            }));
          });

          if (hidden > 0) {
            cell.appendChild(el("span", {
              class: "cal-more",
              text: "+" + hidden + " more",
              title: "See all " + dayEvents.length + " events on this day",
              onclick: (function (d) { return function () { selectedDate = d; renderDetail(); }; })(new Date(date))
            }));
          }

          if (dayEvents.length) {
            cell.style.cursor = "pointer";
            cell.addEventListener("click", (function (d) { return function () { selectedDate = d; renderDetail(); }; })(new Date(date)));
          }
          cells.push(cell);
          cursor.setDate(cursor.getDate() + 1);
        }
        rows.push(el("tr", {}, cells));
        if (cursor.getMonth() !== view.getMonth() && week >= 4) break;
      }

      grid.appendChild(el("table", { class: "cal-grid" }, [
        el("thead", {}, headRow), el("tbody", {}, rows)
      ]));

      var monthCount = events().filter(function (ev) {
        var d = U.parseDate(ev.date);
        return d && d.getFullYear() === view.getFullYear() && d.getMonth() === view.getMonth();
      }).length;
      var isThisMonth = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
      status.textContent = monthCount + (monthCount === 1 ? " event" : " events") +
                           (isThisMonth ? " this month" : " in " + U.MONTHS[view.getMonth()]) + " · " +
                           events().length + " in the calendar";
      renderDetail();
    }

    function renderDetail() {
      U.clear(detail);
      // A weekly market may appear once per occurrence in the data; list it once here.
      var seen = {};
      var recurring = events().filter(function (ev) {
        if (!ev.recurring) return false;
        var key = ev.title + "|" + ev.recurring;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      });

      if (!selectedDate) {
        detail.appendChild(el("div", { class: "pad" }, [
          el("h3", { text: "Standing events", style: "margin-top:0;" }),
          recurring.length
            ? el("ul", {}, recurring.map(function (ev) {
                return el("li", {}, [
                  el("strong", { text: ev.title }),
                  document.createTextNode(" — " + (ev.recurring || ""))
                ]);
              }))
            : el("p", { class: "hint", text: "Nothing recurring listed yet." }),
          el("p", { class: "hint", text: "Click a day with an event to read the details." })
        ]));
        return;
      }

      var list = eventsOn(selectedDate);
      detail.appendChild(el("div", { class: "pad" }, [
        el("h3", { text: U.formatDate(selectedDate), style: "margin-top:0;" }),
        list.length ? el("div", {}, list.map(function (ev) {
          var sense = U.sense(ev.category);
          return el("div", { style: "margin-bottom:10px;" }, [
            el("h4", { style: "margin:0 0 3px;font-size:12px;" }, [
              el("span", { class: "swatch", style: "background:" + sense.color, "aria-hidden": "true" }),
              document.createTextNode(ev.title)
            ]),
            ev.time ? el("div", { text: ev.time }) : null,
            ev.location ? el("div", { text: ev.location }) : null,
            ev.description ? el("p", { text: ev.description, style: "margin:4px 0;" }) : null,
            ev.recurring ? el("div", { class: "hint", text: "Repeats: " + ev.recurring }) : null,
            ev.url ? el("a", { href: ev.url, text: "More information" }) : null,
            // Say plainly where an imported event came from, and whether we are
            // sure of its date. Nobody local has checked it.
            ev.imported ? el("div", { class: "provenance" }, [
              document.createTextNode("Imported from "),
              ev.source && ev.source.page
                ? el("a", { href: ev.source.page, text: ev.source.name })
                : el("span", { text: (ev.source && ev.source.name) || "another calendar" }),
              document.createTextNode(". Not yet checked by a neighbour. "),
              ev.dateConfidence
                ? el("strong", { text: "The date was read from the description and may be wrong." })
                : null
            ]) : null
          ]);
        })) : el("p", { class: "hint", text: "Nothing listed on this day." })
      ]));
      U.externalLinks(detail);
    }

    U.append(body, [
      el("div", { class: "menu-strip" }, [
        el("button", { type: "button", text: "◀ Previous", onclick: function () { shift(-1); } }),
        el("button", { type: "button", text: "Today", onclick: function () { view = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate = null; render(); } }),
        el("button", { type: "button", text: "Next ▶", onclick: function () { shift(1); } }),
        el("button", { type: "button", text: "Add an event", onclick: function () { window.NDC.apps.mail({ subject: "An event for the calendar" }); } })
      ]),
      tierBar,
      el("div", { style: "text-align:center;padding:2px 0 5px;flex:0 0 auto;" }, heading),
      grid,
      el("div", { style: "height:3px;flex:0 0 auto;" }),
      detail,
      el("div", { class: "status-bar" }, status)
    ]);

    render();
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.calendar = function () {
    return window.NDC.wm.open({
      id: "calendar", title: "Calendar", icon: "calendar",
      width: 640, height: 520, build: build
    });
  };
})();
