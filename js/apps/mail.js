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

    /* --- The two relays -----------------------------------------------------
       Each returns a promise. Neither needs a server of our own, and neither
       is trusted to succeed: the caller falls back to the visitor's mail app.
       Which one runs is set by `mail.provider` in config.js. */

    function sendViaFormSubmit(settings, fields) {
      return fetch(settings.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: fields.subject,
          _template: "table",
          kind: fields.kind,
          place: fields.place,
          message: fields.message,
          name: fields.name,
          email: fields.email
        })
      }).then(function (response) {
        if (!response.ok) throw new Error("FormSubmit returned HTTP " + response.status);
      });
    }

    function sendViaEmailJs(settings, fields) {
      if (!settings.publicKey || !settings.templateId) {
        return Promise.reject(new Error("EmailJS is selected but templateId or publicKey is blank in config.js"));
      }
      return fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: settings.serviceId,
          template_id: settings.templateId,
          user_id: settings.publicKey,
          template_params: {
            // These names must match the variables in the EmailJS template.
            to_name: settings.toName || "North Durham Census",
            subject: fields.subject,
            kind: fields.kind,
            place: fields.place,
            message: fields.message,
            from_name: fields.name || "(no name given)",
            reply_to: fields.email || cfg.contactEmail,
            // EmailJS's own starter template uses {{name}} and {{time}}, so
            // send those as well. It means an untouched default template still
            // produces a readable email, and nothing here is wasted if the
            // template is later rewritten to use the fuller set above.
            name: fields.name || "(no name given)",
            time: new Date().toLocaleString("en-CA", {
              dateStyle: "full", timeStyle: "short"
            })
          }
        })
      }).then(function (response) {
        // EmailJS answers with plain text, so surface it when it complains.
        if (!response.ok) {
          return response.text().then(function (body) {
            throw new Error("EmailJS said: " + (body || response.status));
          });
        }
      });
    }

    function submit(event) {
      event.preventDefault();
      if (!message.value.trim()) {
        window.NDC.wm.alert("North Durham Census", "Please write a message before sending.", "info");
        message.focus();
        return;
      }

      var fields = {
        subject: "[North Durham Census] " + kind.value,
        kind: kind.value,
        place: place.value,
        message: message.value,
        name: name.value,
        email: from.value
      };

      // Older configs set formEndpoint at the top level; honour them.
      var mail = cfg.mail || {};
      var provider = mail.provider || (cfg.formEndpoint ? "formsubmit" : "mailto");
      if (!mail.formsubmit && cfg.formEndpoint) {
        mail.formsubmit = { endpoint: cfg.formEndpoint };
      }

      var send;
      if (provider === "emailjs") send = sendViaEmailJs(mail.emailjs || {}, fields);
      else if (provider === "formsubmit") send = sendViaFormSubmit(mail.formsubmit || {}, fields);
      else { mailtoFallback(); return; }

      sendButton.disabled = true;
      statusText.textContent = "Sending…";

      send.then(function () {
        statusText.textContent = "Sent — thank you";
        window.NDC.wm.alert("Message sent",
          "Thank you. A volunteer reads every submission and verifies it before it joins the census.", "mail");
        window.NDC.wm.close(rec);
      }).catch(function (error) {
        sendButton.disabled = false;
        statusText.textContent = "Could not send";
        // Worth logging: the relay's own message says whether it is an unconfirmed
        // address, a spent quota or a misconfigured template.
        if (window.console) window.console.warn("North Durham Census — send failed:", error);
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
