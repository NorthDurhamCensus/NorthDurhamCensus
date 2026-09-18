/* ---------------------------------------------------------------------------
   Mail — send a listing, an event, a story or a correction
   ---------------------------------------------------------------------------
   Posts to config.formEndpoint (a form relay, so the project needs no server
   of its own). If that endpoint is empty or unreachable, the window falls back
   to opening the visitor's own mail client with the message pre-filled, so a
   submission is never simply lost.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var KINDS = [
    "A place for the census",
    "An event for the calendar",
    "A story of solidarity",
    "A correction to a listing",
    "Something else"
  ];

  function build(body, rec, options) {
    var cfg = window.NDC.config;

    var kind = el("select", { name: "kind", id: "mail-kind" },
      KINDS.map(function (k) { return el("option", { value: k, text: k }); }));
    if (options && options.subject) {
      var wanted = KINDS.indexOf(options.subject);
      if (wanted >= 0) kind.value = KINDS[wanted];
    }

    var name = el("input", { type: "text", name: "name", id: "mail-name", autocomplete: "name" });
    var from = el("input", { type: "email", name: "email", id: "mail-from", autocomplete: "email" });
    var place = el("input", { type: "text", name: "place", id: "mail-place", placeholder: "Name and rough location, if it's a place" });
    var message = el("textarea", { name: "message", id: "mail-message", rows: "7",
      placeholder: "What is it, where is it, when is it open, and how would someone reach it?" });

    var statusText = el("p", { class: "status-bar-field", text: "Ready" });
    var sendButton = el("button", { type: "submit", class: "default", text: "Send" });

    function mailtoFallback() {
      var subject = "[North Durham Census] " + kind.value;
      var lines = [
        "From: " + (name.value || "(no name given)") + (from.value ? " <" + from.value + ">" : ""),
        place.value ? "Place: " + place.value : null,
        "",
        message.value
      ].filter(function (line) { return line !== null; });
      window.location.href = "mailto:" + cfg.contactEmail +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    }

    function submit(event) {
      event.preventDefault();
      if (!message.value.trim()) {
        window.NDC.wm.alert("North Durham Census", "Please write a message before sending.", "info");
        message.focus();
        return;
      }

      var payload = {
        _subject: "[North Durham Census] " + kind.value,
        kind: kind.value,
        name: name.value,
        email: from.value,
        place: place.value,
        message: message.value
      };

      if (!cfg.formEndpoint) { mailtoFallback(); return; }

      sendButton.disabled = true;
      statusText.textContent = "Sending…";

      fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        statusText.textContent = "Sent — thank you";
        window.NDC.wm.alert("Message sent",
          "Thank you. A volunteer reads every submission and verifies it before it joins the census.", "mail");
        window.NDC.wm.close(rec);
      }).catch(function () {
        sendButton.disabled = false;
        statusText.textContent = "Could not send";
        window.NDC.wm.alert("Could not send",
          "The form could not be reached. Your mail program will open instead, with the message ready to send.", "info");
        mailtoFallback();
      });
    }

    var form = el("form", { class: "pad scroll", style: "flex:1 1 auto;", onsubmit: submit }, [
      el("p", { class: "hint", text: "Everything in the census is verified by a neighbour before it is listed. Tell us what you know." }),
      el("div", { class: "form-row" }, [el("label", { for: "mail-kind", text: "This is" }), kind]),
      el("div", { class: "form-row" }, [el("label", { for: "mail-place", text: "Place or event" }), place]),
      el("div", { class: "form-row" }, [el("label", { for: "mail-message", text: "Details" }), message]),
      el("div", { class: "form-row" }, [el("label", { for: "mail-name", text: "Your name (optional)" }), name]),
      el("div", { class: "form-row" }, [
        el("label", { for: "mail-from", text: "Your email (optional)" }), from,
        el("span", { class: "hint", text: "Only so we can ask a follow-up question." })
      ]),
      el("div", { class: "form-actions" }, [
        el("button", { type: "button", text: "Cancel", onclick: function () { window.NDC.wm.close(rec); } }),
        sendButton
      ])
    ]);

    U.append(body, [
      el("div", { class: "menu-strip" }, [
        el("button", { type: "button", text: "Email directly", onclick: mailtoFallback })
      ]),
      form,
      el("div", { class: "status-bar" }, [statusText, el("p", { class: "status-bar-field", text: "To: " + cfg.contactEmail })])
    ]);

    setTimeout(function () { message.focus(); }, 0);
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.mail = function (options) {
    return window.NDC.wm.open({
      id: "mail", title: "Send a Tip", icon: "mail",
      width: 470, height: 430,
      build: function (body, rec) { build(body, rec, options || {}); }
    });
  };
})();
