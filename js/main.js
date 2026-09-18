/* ---------------------------------------------------------------------------
   Boot
   ---------------------------------------------------------------------------
   Starts the shell in order, then opens the README the first time someone
   visits so the desktop is never a blank teal field with no instructions.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  function boot() {
    var U = window.NDC.util;

    window.NDC.settings.init();
    window.NDC.wm.init(document.getElementById("windows"), document.getElementById("task-buttons"));
    window.NDC.assistant.init();
    window.NDC.settings.setAssistantReady && window.NDC.settings.setAssistantReady();
    window.NDC.assistant.setEnabled(!!window.NDC.settings.get("assistant"));
    window.NDC.shell.init();

    // First visit: open the README and let the assistant introduce itself.
    var seen = U.store.read("seen", false);
    if (!seen) {
      window.NDC.apps.notepad("READ_ME.txt");
      U.store.write("seen", true);
      if (window.NDC.settings.get("assistant")) {
        setTimeout(function () { window.NDC.assistant.say(); }, 1400);
      }
    } else {
      window.NDC.apps.census();
    }

    // Deep links: index.html#calendar opens straight into an app.
    var target = (window.location.hash || "").replace("#", "");
    var program = window.NDC.shell.PROGRAMS.filter(function (p) { return p.id === target; })[0];
    if (program) program.run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
