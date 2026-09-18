/* ---------------------------------------------------------------------------
   Minesweeper
   ---------------------------------------------------------------------------
   Written from scratch rather than borrowed, for two reasons: the well-known
   browser Minesweepers are either not open source or carry Microsoft's original
   sprites, and the whole board here is drawn with CSS bevels and text, so there
   is no artwork to license.

   The three behaviours that separate a real Minesweeper from a grid of buttons:

     First click is never a mine.  Mines are laid *after* the first click, with
                                   the clicked cell and its neighbours excluded,
                                   so the game always opens onto a clearing.
     Chording.                     Click both buttons on a revealed number whose
                                   flags already match it, and the rest of its
                                   neighbours open at once.
     The face reacts.              It gasps while the mouse is down.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var U = window.NDC.util;
  var el = U.el;

  var LEVELS = {
    beginner:     { cols: 9,  rows: 9,  mines: 10, label: "Beginner" },
    intermediate: { cols: 16, rows: 16, mines: 40, label: "Intermediate" },
    expert:       { cols: 30, rows: 16, mines: 99, label: "Expert" }
  };

  function build(body, rec) {
    var level = U.store.read("minesweeperLevel", "beginner");
    if (!LEVELS[level]) level = "beginner";

    var cols, rows, mineCount;
    var cells;             // { mine, revealed, flagged, near, node }
    var started, dead, won;
    var revealedCount, flagCount;
    var timer = null, seconds = 0;

    var grid = el("div", { class: "ms-grid" });
    var mineDisplay = el("div", { class: "ms-led", "aria-label": "Mines remaining" });
    var timeDisplay = el("div", { class: "ms-led", "aria-label": "Seconds elapsed" });
    var face = el("button", { class: "ms-face", type: "button", "aria-label": "New game",
                              onclick: function () { reset(); } });
    var status = el("p", { class: "status-bar-field", text: "" });

    /* --- Board ------------------------------------------------------------ */

    function reset(newLevel) {
      if (newLevel) {
        level = newLevel;
        U.store.write("minesweeperLevel", level);
      }
      var spec = LEVELS[level];
      cols = spec.cols; rows = spec.rows; mineCount = spec.mines;

      started = false; dead = false; won = false;
      revealedCount = 0; flagCount = 0;
      stopTimer(); seconds = 0;

      cells = [];
      U.clear(grid);
      grid.style.gridTemplateColumns = "repeat(" + cols + ", 16px)";

      for (var i = 0; i < cols * rows; i++) {
        var node = el("button", {
          class: "ms-cell", type: "button", dataset: { i: String(i) },
          "aria-label": "Covered square"
        });
        cells.push({ mine: false, revealed: false, flagged: false, near: 0, node: node });
        grid.appendChild(node);
      }

      setFace("smile");
      paintCounters();
      status.textContent = LEVELS[level].label + " — " + mineCount + " mines";
      // The window is sized to the board, so a level change resizes it.
      fitWindow();
    }

    /** Lay the mines, keeping the first click and its neighbours clear. */
    function layMines(safeIndex) {
      var forbidden = {};
      forbidden[safeIndex] = true;
      neighbours(safeIndex).forEach(function (n) { forbidden[n] = true; });

      var spots = [];
      for (var i = 0; i < cells.length; i++) if (!forbidden[i]) spots.push(i);

      // Fisher–Yates, then take the first `mineCount`.
      for (var j = spots.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = spots[j]; spots[j] = spots[k]; spots[k] = tmp;
      }
      spots.slice(0, Math.min(mineCount, spots.length)).forEach(function (i) {
        cells[i].mine = true;
      });

      cells.forEach(function (cell, i) {
        cell.near = neighbours(i).filter(function (n) { return cells[n].mine; }).length;
      });
    }

    function neighbours(index) {
      var x = index % cols, y = Math.floor(index / cols), out = [];
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          out.push(ny * cols + nx);
        }
      }
      return out;
    }

    /* --- Revealing -------------------------------------------------------- */

    function reveal(index) {
      var cell = cells[index];
      if (!cell || cell.revealed || cell.flagged || dead || won) return;

      if (!started) { started = true; layMines(index); startTimer(); }

      if (cell.mine) { cell.revealed = true; lose(index); return; }

      // Iterative flood fill: recursion can blow the stack on Expert.
      var queue = [index];
      while (queue.length) {
        var i = queue.pop();
        var c = cells[i];
        if (c.revealed || c.flagged || c.mine) continue;
        c.revealed = true;
        revealedCount += 1;
        paintCell(i);
        if (c.near === 0) neighbours(i).forEach(function (n) { queue.push(n); });
      }
      checkWin();
    }

    /** Both buttons on a satisfied number: open its remaining neighbours. */
    function chord(index) {
      var cell = cells[index];
      if (!cell || !cell.revealed || !cell.near || dead || won) return;
      var around = neighbours(index);
      var flagged = around.filter(function (n) { return cells[n].flagged; }).length;
      if (flagged !== cell.near) return;
      around.forEach(function (n) { if (!cells[n].flagged) reveal(n); });
    }

    function toggleFlag(index) {
      var cell = cells[index];
      if (!cell || cell.revealed || dead || won) return;
      cell.flagged = !cell.flagged;
      flagCount += cell.flagged ? 1 : -1;
      paintCell(index);
      paintCounters();
    }

    function lose(hitIndex) {
      dead = true;
      stopTimer();
      setFace("dead");
      cells.forEach(function (cell, i) {
        if (cell.mine && !cell.flagged) { cell.revealed = true; paintCell(i); }
        if (cell.flagged && !cell.mine) { cell.node.classList.add("wrong"); }
      });
      cells[hitIndex].node.classList.add("boom");
      status.textContent = "Bad luck. Click the face to start again.";
    }

    function checkWin() {
      if (revealedCount < cells.length - mineCount) return;
      won = true;
      stopTimer();
      setFace("cool");
      cells.forEach(function (cell, i) {
        if (cell.mine && !cell.flagged) { cell.flagged = true; flagCount += 1; paintCell(i); }
      });
      paintCounters();
      status.textContent = "Swept in " + seconds + " seconds.";
    }

    /* --- Painting --------------------------------------------------------- */

    function paintCell(index) {
      var cell = cells[index];
      var node = cell.node;
      node.className = "ms-cell";
      node.textContent = "";

      if (cell.revealed) {
        node.classList.add("revealed");
        if (cell.mine) {
          node.classList.add("mine");
          node.setAttribute("aria-label", "Mine");
        } else if (cell.near) {
          node.textContent = String(cell.near);
          node.classList.add("n" + cell.near);
          node.setAttribute("aria-label", cell.near + " nearby");
        } else {
          node.setAttribute("aria-label", "Empty");
        }
      } else if (cell.flagged) {
        node.classList.add("flagged");
        node.setAttribute("aria-label", "Flagged");
      } else {
        node.setAttribute("aria-label", "Covered square");
      }
    }

    function paintCounters() {
      var left = mineCount - flagCount;
      mineDisplay.textContent = (left < 0 ? "-" : "") +
        String(Math.min(Math.abs(left), 999)).padStart(left < 0 ? 2 : 3, "0");
      timeDisplay.textContent = String(Math.min(seconds, 999)).padStart(3, "0");
    }

    function setFace(mood) {
      face.className = "ms-face " + mood;
      face.textContent = { smile: "☺", worried: "😮", dead: "☹", cool: "😎" }[mood] || "☺";
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        seconds += 1;
        paintCounters();
        if (seconds >= 999) stopTimer();
      }, 1000);
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    /** Resize the window to hug the board. */
    function fitWindow() {
      if (rec.maximized) return;
      var width = cols * 16 + 34;
      var height = rows * 16 + 132;
      var max = rec.node.parentNode;
      rec.node.style.width = Math.min(width, max.clientWidth - 16) + "px";
      rec.node.style.height = Math.min(height, max.clientHeight - 16) + "px";
    }

    /* --- Input ------------------------------------------------------------ */
    /* Chording needs both buttons, so the raw button bitmask is what matters
       rather than which single button generated the event. */

    var buttonsDown = 0;

    grid.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    grid.addEventListener("mousedown", function (e) {
      var node = e.target.closest(".ms-cell");
      if (!node || dead || won) return;
      buttonsDown = e.buttons;
      if (e.button === 2 && e.buttons === 2) {
        toggleFlag(Number(node.dataset.i));
      } else {
        setFace("worried");
      }
      e.preventDefault();
    });

    grid.addEventListener("mouseup", function (e) {
      var node = e.target.closest(".ms-cell");
      if (!node || dead || won) { buttonsDown = 0; return; }
      var index = Number(node.dataset.i);
      var both = buttonsDown === 3;
      buttonsDown = 0;

      if (both) chord(index);
      else if (e.button === 0) reveal(index);

      if (!dead && !won) setFace("smile");
    });

    document.addEventListener("mouseup", function () { buttonsDown = 0; });

    // Touch: tap reveals, long press flags.
    var pressTimer = null;
    grid.addEventListener("touchstart", function (e) {
      var node = e.target.closest(".ms-cell");
      if (!node) return;
      var index = Number(node.dataset.i);
      pressTimer = setTimeout(function () {
        pressTimer = null;
        toggleFlag(index);
      }, 450);
    }, { passive: true });

    grid.addEventListener("touchend", function (e) {
      var node = e.target.closest(".ms-cell");
      if (pressTimer) {
        clearTimeout(pressTimer); pressTimer = null;
        if (node) { reveal(Number(node.dataset.i)); e.preventDefault(); }
      }
    });

    // Keyboard: Enter reveals, F flags.
    grid.addEventListener("keydown", function (e) {
      var node = e.target.closest(".ms-cell");
      if (!node) return;
      var index = Number(node.dataset.i);
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(index); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFlag(index); }
    });

    /* --- Assemble --------------------------------------------------------- */

    var levelButtons = Object.keys(LEVELS).map(function (key) {
      return el("button", {
        type: "button", text: LEVELS[key].label,
        onclick: function () { reset(key); }
      });
    });

    U.append(body, [
      el("div", { class: "menu-strip" }, levelButtons.concat([
        el("button", { type: "button", text: "New game", onclick: function () { reset(); } })
      ])),
      el("div", { class: "ms-shell" }, [
        el("div", { class: "ms-head" }, [mineDisplay, face, timeDisplay]),
        el("div", { class: "ms-board" }, grid)
      ]),
      el("div", { class: "status-bar" }, status)
    ]);

    rec.onClose = function () { stopTimer(); };
    reset();
  }

  window.NDC.apps = window.NDC.apps || {};
  window.NDC.apps.minesweeper = function () {
    return window.NDC.wm.open({
      id: "minesweeper", title: "Minesweeper", icon: "bulb",
      width: 200, height: 280,
      build: build
    });
  };
})();
