/* ---------------------------------------------------------------------------
   Calendar — community events, month by month
   ---------------------------------------------------------------------------
   Reads data/events.js. One-off events land on their date; anything with a
   `recurring` note is also listed in the standing-events panel below the grid.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  function build(body) {
    var today = new Date();
    var selectedDate = null;

    /* Open on this month if anything is on, otherwise on the next month that
       has something, so the calendar is never a blank grid on first open. */
    function openingMonth() {
      var thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      var dates = U.events().map(function (ev) { return U.parseDate(ev.date); })
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

    var heading = el("strong", { text: "" });
    var grid = el("div", { class: "sunken-panel scroll", style: "flex:1 1 auto;" });
    var detail = el("div", { class: "sunken-panel scroll", style: "flex:0 0 32%;min-height:76px;" });
    var status = el("p", { class: "status-bar-field", text: "" });

    function eventsOn(date) {
      return U.events().filter(function (ev) {
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

          dayEvents.forEach(function (ev) {
            var sense = U.sense(ev.category);
            cell.appendChild(el("span", {
              class: "cal-dot", text: ev.title, title: ev.title,
              style: "background:" + sense.color,
              onclick: (function (d) { return function () { selectedDate = d; renderDetail(); }; })(new Date(date))
            }));
          });

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

      var monthCount = U.events().filter(function (ev) {
        var d = U.parseDate(ev.date);
        return d && d.getFullYear() === view.getFullYear() && d.getMonth() === view.getMonth();
      }).length;
      var isThisMonth = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
      status.textContent = monthCount + (monthCount === 1 ? " event" : " events") +
                           (isThisMonth ? " this month" : " in " + U.MONTHS[view.getMonth()]) + " · " +
                           U.events().length + " in the calendar";
      renderDetail();
    }

    function renderDetail() {
      U.clear(detail);
      // A weekly market may appear once per occurrence in the data; list it once here.
      var seen = {};
      var recurring = U.events().filter(function (ev) {
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
            ev.url ? el("a", { href: ev.url, text: "More information" }) : null
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
