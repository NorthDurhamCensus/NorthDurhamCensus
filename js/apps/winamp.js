/* ---------------------------------------------------------------------------
   Winamp
   ---------------------------------------------------------------------------
   Webamp, by Jordan Eldredge, vendored into vendor/webamp/ under its MIT
   licence. Webamp draws its own windows — the player, the equaliser and the
   playlist — so it is given a layer of the desktop to float on rather than
   being squeezed inside one of ours, which is also how the real thing behaved.

   The bundle is an ES module and nearly a megabyte, so it is loaded only when
   somebody actually opens it, not on every visit.

   Tracks come from config.js (`mail` aside, see `winamp.tracks`). Webamp ships
   no music of its own.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var instance = null;      // the live Webamp, if it has been opened
  var layer = null;         // the div it floats in
  var loading = false;

  function tracks() {
    var list = (window.NDC.config.winamp && window.NDC.config.winamp.tracks) || [];
    return list.map(function (track) {
      return {
        url: track.url,
        duration: track.duration,
        metaData: { artist: track.artist || "", title: track.title || "" }
      };
    });
  }

  function close() {
    if (instance) {
      try { instance.dispose(); } catch (err) { /* already gone */ }
      instance = null;
    }
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    layer = null;
    removeTaskButton();
  }

  /* Webamp is not one of our windows, so it needs its own taskbar button. */
  var taskItem = null;
  function addTaskButton() {
    var list = document.getElementById("task-buttons");
    if (!list || taskItem) return;
    var button = el("button", {
      type: "button", class: "active", title: "Winamp",
      onclick: function () {
        if (!layer) return;
        var hidden = layer.style.display === "none";
        layer.style.display = hidden ? "" : "none";
        button.classList.toggle("active", hidden);
      }
    }, [U.icon("chat-16"), el("span", { text: "Winamp" })]);
    taskItem = el("li", {}, button);
    list.appendChild(taskItem);
  }
  function removeTaskButton() {
    if (taskItem && taskItem.parentNode) taskItem.parentNode.removeChild(taskItem);
    taskItem = null;
  }

  function open() {
    if (instance) {                       // already running — bring it forward
      if (layer) { layer.style.display = ""; }
      return;
    }
    if (loading) return;
    loading = true;

    var waiting = window.NDC.wm.open({
      title: "Winamp", icon: "chat", width: 320, height: 150, resizable: false,
      build: function (body) {
        U.append(body, el("div", { class: "pad" }, [
          el("p", { text: "Starting Winamp…" }),
          el("p", { class: "hint", text: "About a megabyte, and only loaded the first time you open it." })
        ]));
      }
    });

    layer = el("div", { id: "winamp-layer" });
    document.body.appendChild(layer);

    import("../../vendor/webamp/webamp.bundle.min.mjs").then(function (mod) {
      var Webamp = mod.default || mod;
      if (!Webamp.browserIsSupported || !Webamp.browserIsSupported()) {
        throw new Error("This browser cannot run Webamp");
      }

      instance = new Webamp({
        initialTracks: tracks(),
        // Leave the bundled skin alone: it is Nullsoft's, not Webamp's to relicense,
        // and swapping it is a one-line change here if that ever matters.
        enableHotkeys: false
      });

      instance.onClose(function () { close(); });

      return instance.renderInto(layer);
    }).then(function () {
      window.NDC.wm.close(waiting);
      addTaskButton();
      loading = false;
    }).catch(function (error) {
      loading = false;
      if (window.console) window.console.warn("Winamp failed to start:", error);
      window.NDC.wm.close(waiting);
      close();
      window.NDC.wm.alert("Winamp",
        "Winamp could not start. It needs a modern browser, and the player file must be present in vendor/webamp/.",
        "info");
    });
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.winamp = open;
})();
