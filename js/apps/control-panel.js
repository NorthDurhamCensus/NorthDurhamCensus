/* ---------------------------------------------------------------------------
   Control Panel — Display, Accessibility and Assistant settings
   ---------------------------------------------------------------------------
   Everything here writes through NDC.settings, which persists to localStorage
   and applies immediately. Nothing leaves the visitor's own browser.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;
  var uid = 0;

  function checkbox(label, key, hint) {
    var id = "cp-" + (++uid);
    var input = el("input", {
      type: "checkbox", id: id,
      onchange: function () { window.NDC.settings.set(key, this.checked); }
    });
    input.checked = !!window.NDC.settings.get(key);
    return el("div", { class: "field-row", style: "display:block;margin-bottom:6px;" }, [
      el("div", { class: "field-row" }, [input, el("label", { for: id, text: label })]),
      hint ? el("div", { class: "hint", style: "margin-left:19px;", text: hint }) : null
    ]);
  }

  function displayTab() {
    var settings = window.NDC.settings;

    var swatches = settings.WALLPAPERS.map(function (paper) {
      var id = "cp-wp-" + paper.id;
      var input = el("input", {
        type: "radio", name: "wallpaper", id: id, value: paper.id,
        onchange: function () { settings.set("wallpaper", paper.id); }
      });
      input.checked = settings.get("wallpaper") === paper.id;
      return el("div", { class: "field-row" }, [
        input,
        el("label", { for: id }, [
          el("span", { class: "swatch", style: "background:" + paper.color, "aria-hidden": "true" }),
          document.createTextNode(paper.label)
        ])
      ]);
    });

    var patternSelect = el("select", {
      id: "cp-pattern",
      onchange: function () { settings.set("pattern", this.value); }
    }, Object.keys(settings.PATTERNS).map(function (key) {
      return el("option", { value: key, text: key === "none" ? "(None)" : key.charAt(0).toUpperCase() + key.slice(1) });
    }));
    patternSelect.value = settings.get("pattern");

    return el("div", { class: "pad scroll" }, [
      el("fieldset", {}, [
        el("legend", { text: "Wallpaper" }),
        el("div", {}, swatches)
      ]),
      el("fieldset", { style: "margin-top:10px;" }, [
        el("legend", { text: "Pattern" }),
        el("div", { class: "field-row" }, [el("label", { for: "cp-pattern", text: "Overlay:" }), patternSelect])
      ])
    ]);
  }

  function accessibilityTab() {
    return el("div", { class: "pad scroll" }, [
      el("fieldset", {}, [
        el("legend", { text: "Reading" }),
        checkbox("Larger text everywhere", "largeText", "Bumps the interface up a couple of points."),
        checkbox("Reduce motion", "reduceMotion", "Stops the assistant bobbing and other movement.")
      ]),
      el("fieldset", { style: "margin-top:10px;" }, [
        el("legend", { text: "Taskbar" }),
        checkbox("Show the clock", "showClock")
      ]),
      el("p", { class: "hint", style: "margin-top:10px;" },
        "Keyboard: Tab moves between icons and controls, Enter opens, Escape closes the front window.")
    ]);
  }

  function assistantTab() {
    return el("div", { class: "pad scroll" }, [
      el("fieldset", {}, [
        el("legend", { text: "Office Assistant" }),
        checkbox("Show the assistant", "assistant", "A paperclip with opinions about local abundance."),
        el("div", { class: "form-actions", style: "justify-content:flex-start;margin-top:6px;" }, [
          el("button", {
            type: "button", text: "Say something",
            onclick: function () { if (window.NDC.assistant) window.NDC.assistant.say(); }
          })
        ])
      ]),
      el("fieldset", { style: "margin-top:10px;" }, [
        el("legend", { text: "Stored settings" }),
        el("p", { class: "hint", text: "Your choices are saved in this browser only. Nothing is sent anywhere." }),
        el("div", { class: "form-actions", style: "justify-content:flex-start;" }, [
          el("button", {
            type: "button", text: "Reset to defaults",
            onclick: function () {
              window.NDC.settings.reset();
              window.NDC.wm.close(window.NDC.wm.list().filter(function (w) { return w.id === "control-panel"; })[0]);
              window.NDC.apps.controlPanel();
            }
          })
        ])
      ])
    ]);
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.controlPanel = function () {
    return window.NDC.wm.open({
      id: "control-panel", title: "Control Panel", icon: "settings",
      width: 400, height: 380,
      build: function (body) {
        var panels = {
          display: displayTab(),
          accessibility: accessibilityTab(),
          assistant: assistantTab()
        };

        var wrappers = {};
        Object.keys(panels).forEach(function (key) {
          wrappers[key] = el("div", { class: "window", role: "tabpanel", style: "flex:1 1 auto;min-height:0;display:flex;" },
            el("div", { class: "sunken-panel scroll", style: "margin:4px;flex:1 1 auto;" }, panels[key]));
          if (key !== "display") wrappers[key].hidden = true;
        });

        function select(which) {
          Object.keys(wrappers).forEach(function (key) { wrappers[key].hidden = key !== which; });
          Array.prototype.forEach.call(tabs.querySelectorAll("li"), function (li) {
            li.setAttribute("aria-selected", li.dataset.tab === which ? "true" : "false");
          });
        }

        var labels = { display: "Display", accessibility: "Accessibility", assistant: "Assistant" };
        var tabs = el("menu", { role: "tablist", style: "flex:0 0 auto;" },
          Object.keys(wrappers).map(function (key) {
            return el("li", {
              role: "tab", "aria-selected": key === "display" ? "true" : "false",
              dataset: { tab: key }, onclick: function () { select(key); }
            }, el("a", { href: "#", text: labels[key], onclick: function (e) { e.preventDefault(); } }));
          }));

        U.append(body, [tabs].concat(Object.keys(wrappers).map(function (k) { return wrappers[k]; })));
      }
    });
  };
})();
