/* ---------------------------------------------------------------------------
   Window manager
   ---------------------------------------------------------------------------
   Opens, drags, resizes, stacks, minimises, maximises and closes windows, and
   keeps the taskbar buttons in step. Apps never touch the DOM chrome directly —
   they call NDC.wm.open({...}) and fill in the body they are handed.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var host = null;
  var taskList = null;
  var windows = [];       // open window records, in creation order
  var zTop = 100;
  var active = null;
  var cascade = 0;

  function bounds() {
    return { w: host.clientWidth, h: host.clientHeight };
  }

  /** Default size and position for a new window, kept inside the desktop. */
  function place(opts) {
    var area = bounds();
    var w = Math.min(opts.width || 520, Math.max(240, area.w - 16));
    var h = Math.min(opts.height || 360, Math.max(160, area.h - 16));
    var offset = (cascade % 6) * 22;
    cascade += 1;
    var x = Math.min(Math.max(8, (opts.x !== undefined ? opts.x : 28 + offset)), Math.max(8, area.w - w - 8));
    var y = Math.min(Math.max(8, (opts.y !== undefined ? opts.y : 18 + offset)), Math.max(8, area.h - h - 8));
    // Phones: open near-full-screen, there is no room to cascade.
    if (area.w < 560) { w = area.w - 8; h = area.h - 8; x = 4; y = 4; }
    return { x: x, y: y, w: w, h: h };
  }

  function focus(rec) {
    if (active === rec) { return; }
    if (active) {
      active.node.classList.add("inactive-window");
      active.titleBar.classList.add("inactive");
      if (active.taskButton) active.taskButton.classList.remove("active");
    }
    active = rec;
    zTop += 1;
    rec.node.style.zIndex = String(zTop);
    rec.node.classList.remove("inactive-window");
    rec.titleBar.classList.remove("inactive");
    if (rec.taskButton) rec.taskButton.classList.add("active");
  }

  function makeTaskButton(rec) {
    var label = el("span", { text: rec.title });
    var button = el("button", {
      type: "button",
      title: rec.title,
      onclick: function () {
        if (rec.minimized) { restore(rec); }
        else if (active === rec) { minimize(rec); }
        else { focus(rec); }
      }
    }, [rec.icon ? U.icon(rec.icon + "-16") : null, label]);
    // Fall back to the 32px icon if no 16px version shipped.
    var img = button.querySelector("img");
    if (img) img.addEventListener("error", function () { img.src = "assets/icons/" + rec.icon + ".png"; }, { once: true });
    rec.taskLabel = label;
    taskList.appendChild(el("li", {}, button));
    return button;
  }

  function minimize(rec) {
    rec.minimized = true;
    rec.node.classList.add("minimized");
    if (rec.taskButton) rec.taskButton.classList.remove("active");
    if (active === rec) active = null;
  }

  function restore(rec) {
    rec.minimized = false;
    rec.node.classList.remove("minimized");
    focus(rec);
  }

  function toggleMaximize(rec) {
    rec.maximized = !rec.maximized;
    rec.node.classList.toggle("maximized", rec.maximized);
    rec.maxButton.setAttribute("aria-label", rec.maximized ? "Restore" : "Maximize");
    focus(rec);
    if (rec.onResize) rec.onResize();
  }

  function close(rec) {
    if (rec.onClose && rec.onClose() === false) return;
    if (rec.node.parentNode) rec.node.parentNode.removeChild(rec.node);
    if (rec.taskButton && rec.taskButton.parentNode) {
      rec.taskButton.parentNode.parentNode.removeChild(rec.taskButton.parentNode);
    }
    windows = windows.filter(function (w) { return w !== rec; });
    if (active === rec) {
      active = null;
      var next = windows.filter(function (w) { return !w.minimized; }).pop();
      if (next) focus(next);
    }
  }

  /** Pointer-based drag: works for mouse, touch and pen with one code path. */
  function draggable(handle, rec) {
    handle.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button")) return;      // title-bar controls
      if (rec.maximized) return;
      focus(rec);
      var startX = event.clientX, startY = event.clientY;
      var originX = rec.node.offsetLeft, originY = rec.node.offsetTop;
      handle.setPointerCapture(event.pointerId);

      function move(e) {
        var area = bounds();
        var x = originX + (e.clientX - startX);
        var y = originY + (e.clientY - startY);
        // Keep at least a sliver of title bar reachable.
        x = Math.min(Math.max(8 - rec.node.offsetWidth + 60, x), area.w - 60);
        y = Math.min(Math.max(0, y), area.h - 24);
        rec.node.style.left = x + "px";
        rec.node.style.top = y + "px";
      }
      function up(e) {
        handle.releasePointerCapture(e.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
      event.preventDefault();
    });
  }

  function resizable(handle, rec) {
    handle.addEventListener("pointerdown", function (event) {
      if (rec.maximized) return;
      focus(rec);
      var startX = event.clientX, startY = event.clientY;
      var startW = rec.node.offsetWidth, startH = rec.node.offsetHeight;
      handle.setPointerCapture(event.pointerId);

      function move(e) {
        var area = bounds();
        var w = Math.min(Math.max(220, startW + (e.clientX - startX)), area.w - rec.node.offsetLeft);
        var h = Math.min(Math.max(140, startH + (e.clientY - startY)), area.h - rec.node.offsetTop);
        rec.node.style.width = w + "px";
        rec.node.style.height = h + "px";
        if (rec.onResize) rec.onResize();
      }
      function up(e) {
        handle.releasePointerCapture(e.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
      event.preventDefault();
    });
  }

  var wm = {
    init: function (windowHost, taskbarList) {
      host = windowHost;
      taskList = taskbarList;
      window.addEventListener("resize", function () {
        var area = bounds();
        windows.forEach(function (rec) {
          rec.node.style.left = Math.min(rec.node.offsetLeft, Math.max(8, area.w - 80)) + "px";
          rec.node.style.top = Math.min(rec.node.offsetTop, Math.max(0, area.h - 24)) + "px";
          if (rec.onResize) rec.onResize();
        });
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && active && active.closeOnEscape !== false) close(active);
      });
    },

    /**
     * open({ id, title, icon, width, height, resizable, build(body, rec) })
     * `id` makes a window a singleton: opening it again focuses the existing one.
     */
    open: function (opts) {
      if (opts.id) {
        var existing = windows.filter(function (w) { return w.id === opts.id; })[0];
        if (existing) { restore(existing); return existing; }
      }

      var rec = {
        id: opts.id || null,
        title: opts.title || "Window",
        icon: opts.icon || "notepad",
        minimized: false,
        maximized: false,
        onClose: opts.onClose || null,
        onResize: opts.onResize || null,
        closeOnEscape: opts.closeOnEscape !== false
      };

      var spot = place(opts);

      var titleImg = U.icon(rec.icon + "-16");
      titleImg.addEventListener("error", function () { titleImg.src = "assets/icons/" + rec.icon + ".png"; }, { once: true });

      var minButton = el("button", { type: "button", "aria-label": "Minimize", onclick: function () { minimize(rec); } });
      var maxButton = el("button", { type: "button", "aria-label": "Maximize", onclick: function () { toggleMaximize(rec); } });
      var closeButton = el("button", { type: "button", "aria-label": "Close", onclick: function () { close(rec); } });
      if (opts.resizable === false) maxButton.disabled = true;

      var titleBar = el("div", { class: "title-bar" }, [
        el("div", { class: "title-bar-text" }, [titleImg, el("span", { text: rec.title })]),
        el("div", { class: "title-bar-controls" }, [minButton, maxButton, closeButton])
      ]);

      var body = el("div", { class: "window-body" });

      var node = el("div", {
        class: "window",
        role: "dialog",
        "aria-label": rec.title,
        style: "left:" + spot.x + "px;top:" + spot.y + "px;width:" + spot.w + "px;height:" + spot.h + "px;"
      }, [titleBar, body]);

      rec.node = node;
      rec.body = body;
      rec.titleBar = titleBar;
      rec.maxButton = maxButton;

      if (opts.resizable !== false) {
        var handle = el("div", { class: "resize-handle", "aria-hidden": "true" });
        node.appendChild(handle);
        resizable(handle, rec);
      }

      node.addEventListener("pointerdown", function () { focus(rec); }, true);
      draggable(titleBar, rec);
      titleBar.addEventListener("dblclick", function (e) {
        if (!e.target.closest("button") && opts.resizable !== false) toggleMaximize(rec);
      });

      host.appendChild(node);
      windows.push(rec);
      rec.taskButton = makeTaskButton(rec);
      focus(rec);

      if (typeof opts.build === "function") opts.build(body, rec);
      U.externalLinks(body);
      if (bounds().w < 560 && opts.resizable !== false) toggleMaximize(rec);

      return rec;
    },

    /** A small modal-looking message box, Win98 style. */
    alert: function (title, message, icon) {
      return wm.open({
        title: title,
        icon: icon || "info",
        width: 340,
        height: 160,
        resizable: false,
        build: function (body, rec) {
          U.append(body, [
            el("div", { class: "pad", style: "display:flex;gap:10px;align-items:flex-start;flex:1 1 auto;" }, [
              U.icon(icon || "info", 32),
              el("div", {}, el("p", { text: message }))
            ]),
            el("div", { class: "form-actions", style: "padding:0 10px 8px;" },
              el("button", { type: "button", class: "default", text: "OK", onclick: function () { wm.close(rec); } }))
          ]);
          var ok = body.querySelector("button");
          if (ok) setTimeout(function () { ok.focus(); }, 0);
        }
      });
    },

    close: close,
    focus: focus,
    list: function () { return windows.slice(); },
    minimizeAll: function () { windows.forEach(minimize); }
  };

  window.NDC.wm = wm;
})();
