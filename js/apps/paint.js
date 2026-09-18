/* ---------------------------------------------------------------------------
   Paint
   ---------------------------------------------------------------------------
   JS Paint, by Isaiah Odhner, vendored into vendor/jspaint/ under its MIT
   licence. It is a whole application in its own right — far more program than
   anyone here would write — so it runs in an iframe and we only supply the
   window around it.

   Vendored rather than iframed from jspaint.app so the census does not depend
   on somebody else's uptime, and so it still works offline.
   See vendor/jspaint/NORTH-DURHAM-CENSUS-CHANGES.md for what was pruned.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  window.NDC.apps = window.NDC.apps || {};

  window.NDC.apps.paint = function () {
    return window.NDC.wm.open({
      id: "paint",
      title: "Paint",
      icon: "notepad",
      width: 720,
      height: 520,
      build: function (body) {
        var frame = el("iframe", {
          src: "vendor/jspaint/index.html",
          title: "Paint",
          style: "flex:1 1 auto;width:100%;border:0;display:block;background:#fff;",
          // It draws its own windows and dialogs; same-origin so it can use
          // localStorage for its palette and open files.
          allow: "clipboard-read; clipboard-write"
        });

        var note = el("p", { class: "status-bar-field",
                             text: "JS Paint by Isaiah Odhner — MIT licensed" });

        U.append(body, [
          frame,
          el("div", { class: "status-bar" }, note)
        ]);
      }
    });
  };
})();
