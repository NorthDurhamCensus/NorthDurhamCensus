/* ---------------------------------------------------------------------------
   The Census — an Explorer window over the listings
   ---------------------------------------------------------------------------
   Left pane: a tree of the eight senses. Right pane: the listings in the
   selected sense, with a details panel underneath. Search filters everything.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  function bySense(name) {
    return U.listings().filter(function (item) { return item.category === name; });
  }

  function matches(item, query) {
    if (!query) return true;
    var haystack = [item.name, item.description, item.address, item.hours, item.contact,
                    item.category, (item.tags || []).join(" ")].join(" ").toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  function detailsFor(item) {
    var sense = U.sense(item.category);
    var rows = [];
    function row(label, value) {
      if (!value) return;
      rows.push(el("dt", { text: label }));
      rows.push(el("dd", { text: value }));
    }
    row("Sense", sense.name + " — " + sense.subtitle);
    row("Where", item.address);
    row("When", item.hours);
    row("Contact", item.contact);

    var tags = (item.tags || []).map(function (tag) { return el("span", { class: "tag", text: tag }); });

    return el("div", { class: "pad details scroll" }, [
      el("h2", {}, [
        el("span", { class: "swatch", style: "background:" + sense.color, "aria-hidden": "true" }),
        document.createTextNode(item.name)
      ]),
      el("p", { text: item.description || "" }),
      rows.length ? el("dl", {}, rows) : null,
      tags.length ? el("div", { style: "margin-top:8px;" }, tags) : null
    ]);
  }

  function build(body, rec) {
    var query = "";
    var selectedSense = null;     // null = show everything
    var selectedItem = null;

    var searchInput = el("input", {
      type: "search", placeholder: "Search the census…", "aria-label": "Search the census",
      oninput: function () { query = this.value.trim(); selectedItem = null; renderTree(); renderList(); }
    });

    var tree = el("ul", { class: "tree-view scroll", style: "height:100%;" });
    var listPanel = el("div", { class: "sunken-panel scroll" });
    var detailPanel = el("div", { class: "sunken-panel scroll", style: "flex:0 0 40%;min-height:70px;" });
    var status = el("p", { class: "status-bar-field", text: "" });
    var statusRight = el("p", { class: "status-bar-field", text: "" });

    function counted(name) {
      return bySense(name).filter(function (i) { return matches(i, query); }).length;
    }

    function renderTree() {
      U.clear(tree);
      var total = U.listings().filter(function (i) { return matches(i, query); }).length;

      var allBtn = el("a", {
        href: "#", text: "All senses (" + total + ")",
        onclick: function (e) { e.preventDefault(); selectedSense = null; selectedItem = null; renderTree(); renderList(); }
      });
      if (selectedSense === null) allBtn.style.cssText = "background:navy;color:#fff;";

      var children = (window.NDC.config.senses || []).map(function (sense) {
        var count = counted(sense.name);
        var link = el("a", {
          href: "#",
          onclick: function (e) { e.preventDefault(); selectedSense = sense.name; selectedItem = null; renderTree(); renderList(); },
          title: sense.subtitle
        }, [
          el("span", { class: "swatch", style: "background:" + sense.color, "aria-hidden": "true" }),
          document.createTextNode(sense.name + " "),
          el("span", { class: "sense-count", text: "(" + count + ")" })
        ]);
        if (selectedSense === sense.name) link.style.cssText = "background:navy;color:#fff;";
        return el("li", {}, link);
      });

      var details = el("details", { open: "" }, [
        el("summary", {}, allBtn),
        el("ul", {}, children)
      ]);
      tree.appendChild(el("li", {}, details));
    }

    function renderList() {
      U.clear(listPanel);
      var items = U.listings()
        .filter(function (item) { return !selectedSense || item.category === selectedSense; })
        .filter(function (item) { return matches(item, query); })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });

      if (!items.length) {
        listPanel.appendChild(el("div", { class: "pad" },
          el("p", { text: query ? "Nothing in the census matches “" + query + "” yet." : "No listings in this sense yet." })));
      } else {
        var rows = items.map(function (item) {
          var sense = U.sense(item.category);
          var tr = el("tr", {
            tabindex: "0",
            onclick: function () { select(item, tr); },
            onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(item, tr); } }
          }, [
            el("td", {}, [
              el("span", { class: "swatch", style: "background:" + sense.color, "aria-hidden": "true" }),
              document.createTextNode(item.name)
            ]),
            el("td", { text: item.category }),
            el("td", { text: item.address || "" })
          ]);
          if (selectedItem && selectedItem.id === item.id) tr.classList.add("highlighted");
          return tr;
        });

        listPanel.appendChild(el("table", { class: "listing-table interactive" }, [
          el("thead", {}, el("tr", {}, [
            el("th", { text: "Name" }), el("th", { text: "Sense" }), el("th", { text: "Where" })
          ])),
          el("tbody", {}, rows)
        ]));
      }

      status.textContent = items.length + " of " + U.listings().length + " listings";
      statusRight.textContent = selectedSense ? selectedSense + " — " + U.sense(selectedSense).subtitle
                                              : "All eight senses";
      renderDetails();
    }

    function select(item, tr) {
      selectedItem = item;
      Array.prototype.forEach.call(listPanel.querySelectorAll("tr"), function (r) { r.classList.remove("highlighted"); });
      if (tr) tr.classList.add("highlighted");
      renderDetails();
    }

    function renderDetails() {
      U.clear(detailPanel);
      if (!selectedItem) {
        detailPanel.appendChild(el("div", { class: "pad" },
          el("p", { class: "hint", text: "Select a listing to read the details." })));
        return;
      }
      detailPanel.appendChild(detailsFor(selectedItem));
    }

    U.append(body, [
      el("div", { class: "menu-strip" }, [
        el("button", { type: "button", text: "Add a listing", onclick: function () { window.NDC.apps.mail({ subject: "New listing for the census" }); } }),
        el("button", { type: "button", text: "Resources", onclick: function () { window.NDC.apps.resources(); } }),
        el("button", { type: "button", text: "About", onclick: function () { window.NDC.apps.about(); } })
      ]),
      el("div", { style: "display:flex;gap:6px;align-items:center;padding-bottom:4px;flex:0 0 auto;" }, [
        el("label", { for: "census-search", text: "Find:" }),
        searchInput
      ]),
      el("div", { class: "split" }, [
        el("div", { class: "pane-left", style: "display:flex;min-height:0;" }, tree),
        el("div", { class: "pane-right" }, [listPanel, detailPanel])
      ]),
      el("div", { class: "status-bar" }, [status, statusRight])
    ]);
    searchInput.id = "census-search";

    renderTree();
    renderList();
  }

  window.NDC.apps = window.NDC.apps || {};

  window.NDC.apps.census = function () {
    return window.NDC.wm.open({
      id: "census", title: "The Census", icon: "computer",
      width: 660, height: 440, build: build
    });
  };

  /* --- Resources folder ---------------------------------------------------- */

  window.NDC.apps.resources = function () {
    return window.NDC.wm.open({
      id: "resources", title: "Resources", icon: "folder",
      width: 520, height: 400,
      build: function (body) {
        var data = U.resources();

        function group(title, note, items) {
          return el("div", {}, [
            el("h3", { text: title }),
            note ? el("p", { class: "hint", text: note }) : null,
            el("ul", {}, (items || []).map(function (item) {
              return el("li", { style: "margin-bottom:6px;" }, [
                el("a", { href: item.url, text: item.name }),
                item.tag ? el("span", { class: "tag", style: "margin-left:6px;", text: item.tag }) : null,
                el("div", { text: item.description || "" })
              ]);
            }))
          ]);
        }

        U.append(body, el("div", { class: "sunken-panel scroll" },
          el("div", { class: "pad reader" }, [
            el("h2", { text: "Resources" }),
            el("p", { text: "Organisations and tools worth knowing about — inside North Durham and beyond." }),
            group("Local — North Durham", null, data.local),
            group("For organisers", "Tools and playbooks from further afield.", data.organizing),
            el("p", { class: "hint", style: "margin-top:12px;" }, [
              document.createTextNode("Know one we've missed? "),
              el("a", { href: "#", text: "Send it in.", onclick: function (e) { e.preventDefault(); window.NDC.apps.mail({ subject: "A resource you've missed" }); } })
            ])
          ])));
      }
    });
  };
})();
