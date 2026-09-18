/* ---------------------------------------------------------------------------
   Stories — a Notepad-style reader for stories of solidarity
   ---------------------------------------------------------------------------
   Reads data/stories.js. Left: the list of stories. Right: the one you picked,
   set in a reading column with its source and a link out to the full piece.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  function build(body) {
    var stories = U.stories();
    var index = 0;

    var list = el("ul", { class: "tree-view scroll", style: "height:100%;" });
    var reader = el("div", { class: "sunken-panel scroll" });
    var status = el("p", { class: "status-bar-field", text: "" });

    function renderList() {
      U.clear(list);
      if (!stories.length) {
        list.appendChild(el("li", { class: "hint", text: "No stories yet." }));
        return;
      }
      stories.forEach(function (story, i) {
        var link = el("a", {
          href: "#", text: story.title,
          onclick: function (e) { e.preventDefault(); index = i; renderList(); renderStory(); }
        });
        if (i === index) link.style.cssText = "background:navy;color:#fff;";
        list.appendChild(el("li", {}, link));
      });
    }

    function renderStory() {
      U.clear(reader);
      var story = stories[index];
      if (!story) {
        reader.appendChild(el("div", { class: "pad" }, [
          el("p", { text: "No stories have been added to the census yet." }),
          el("p", { class: "hint", text: "Heard one worth keeping? Send it in from the Mail window." })
        ]));
        status.textContent = "0 stories";
        return;
      }

      reader.appendChild(el("article", { class: "pad reader" }, [
        el("h2", { text: story.title }),
        el("p", { class: "hint", text: [story.source, story.date].filter(Boolean).join(" · ") }),
        el("blockquote", { text: story.excerpt || "" }),
        story.body ? el("div", {}, String(story.body).split(/\n\n+/).map(function (para) {
          return el("p", { text: para });
        })) : null,
        story.url ? el("p", {}, el("a", { href: story.url, text: "Read the full story →" })) : null
      ]));
      U.externalLinks(reader);
      status.textContent = "Story " + (index + 1) + " of " + stories.length;
    }

    U.append(body, [
      el("div", { class: "menu-strip" }, [
        el("button", {
          type: "button", text: "◀ Previous",
          onclick: function () { if (index > 0) { index--; renderList(); renderStory(); } }
        }),
        el("button", {
          type: "button", text: "Next ▶",
          onclick: function () { if (index < stories.length - 1) { index++; renderList(); renderStory(); } }
        }),
        el("button", {
          type: "button", text: "Send us a story",
          onclick: function () { window.NDC.apps.mail({ subject: "A story of solidarity" }); }
        })
      ]),
      el("div", { class: "split" }, [
        el("div", { class: "pane-left", style: "display:flex;min-height:0;" }, list),
        el("div", { class: "pane-right" }, reader)
      ]),
      el("div", { class: "status-bar" }, status)
    ]);

    renderList();
    renderStory();
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.stories = function () {
    return window.NDC.wm.open({
      id: "stories", title: "Stories", icon: "book",
      width: 600, height: 420, build: build
    });
  };
})();
