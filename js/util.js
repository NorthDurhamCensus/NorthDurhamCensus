/* Small helpers shared by every app. No dependencies, no build step. */
(function () {
  "use strict";
  window.NDC = window.NDC || {};

  var U = {};

  /** Create an element. `attrs` may include text, html, class, and any attribute. */
  U.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "class") node.className = value;
      else if (key === "dataset") Object.keys(value).forEach(function (d) { node.dataset[d] = value[d]; });
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value);
    });
    U.append(node, children);
    return node;
  };

  U.append = function (parent, children) {
    if (children === null || children === undefined) return parent;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      parent.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return parent;
  };

  U.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  /** Escape text for the few places we build HTML strings. */
  U.escape = function (value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  U.icon = function (name, size) {
    size = size || 16;
    return U.el("img", { src: "assets/icons/" + name + ".png", alt: "", width: size, height: size });
  };

  /** Look up a sense by name in config.senses. Returns a safe fallback. */
  U.sense = function (name) {
    var list = (window.NDC.config && window.NDC.config.senses) || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return { name: name || "Uncategorised", subtitle: "", color: "#808080" };
  };

  U.listings = function () { return (window.NDC.data && window.NDC.data.listings) || []; };
  U.events = function () { return (window.NDC.data && window.NDC.data.events) || []; };
  U.stories = function () { return (window.NDC.data && window.NDC.data.stories) || []; };
  U.resources = function () { return (window.NDC.data && window.NDC.data.resources) || { local: [], organizing: [] }; };

  /** "2026-07-11" -> Date at local noon (avoids timezone drift on date-only values). */
  U.parseDate = function (value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
    if (!m) { var d = new Date(value); return isNaN(d) ? null : d; }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  };

  U.MONTHS = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"];
  U.DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  U.formatDate = function (date) {
    if (!date) return "";
    return U.DAYS[date.getDay()] + ", " + U.MONTHS[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  };

  /** Read/write a small settings object in localStorage; never throws. */
  U.store = {
    read: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem("ndc." + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) { return fallback; }
    },
    write: function (key, value) {
      try { window.localStorage.setItem("ndc." + key, JSON.stringify(value)); } catch (err) { /* private mode */ }
    }
  };

  /** Keep a window's contents scrollable and links opening in a new tab. */
  U.externalLinks = function (root) {
    Array.prototype.forEach.call(root.querySelectorAll('a[href^="http"]'), function (a) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  };

  window.NDC.util = U;
})();
