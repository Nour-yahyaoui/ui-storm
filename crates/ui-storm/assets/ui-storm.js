/*
 * ui-storm — progressive enhancement, 3 KB, no dependencies.
 *
 * Everything here adds behaviour that HTML cannot express declaratively. None
 * of it adds content: with this file blocked, every panel, dialog body and
 * label is still in the document and still readable. That is the contract the
 * `<noscript>` rule in the page head exists to keep.
 */
(function () {
  "use strict";

  var lastTrigger = null;

  function forEach(list, callback) {
    Array.prototype.forEach.call(list, callback);
  }

  /* ------------------------------------------------------------------ dialog
   * <dialog> already gives us the focus trap, Escape, inert background and the
   * top layer. We only open it, close it, and put focus back where it was.
   */
  function setupDialog(trigger) {
    var id = trigger.getAttribute("data-ui-dialog-open");
    var dialog = id ? document.getElementById(id) : null;
    if (!dialog || typeof dialog.showModal !== "function") {
      return;
    }

    trigger.addEventListener("click", function () {
      lastTrigger = trigger;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "open");
      }
    });

    /* A click on the <dialog> element itself is a click on the backdrop: the
     * panel is a child, so it swallows its own clicks. */
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog && typeof dialog.close === "function") {
        dialog.close();
      }
    });

    dialog.addEventListener("close", function () {
      if (lastTrigger && document.contains(lastTrigger)) {
        lastTrigger.focus();
      }
      lastTrigger = null;
    });

    forEach(dialog.querySelectorAll("[data-ui-dialog-close]"), function (button) {
      button.addEventListener("click", function () {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      });
    });
  }

  /* -------------------------------------------------------------------- tabs
   * Roving tabindex with automatic activation, and arrow keys that follow the
   * reading direction: in RTL, ArrowRight moves to the previous tab, which is
   * what a user of an RTL interface expects from "the arrow that goes back".
   */
  function setupTabs(root) {
    var list = root.querySelector("[role='tablist']");
    if (!list) {
      return;
    }

    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
    if (!tabs.length) {
      return;
    }

    var panels = tabs.map(function (tab) {
      var id = tab.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    });
    var vertical = list.getAttribute("aria-orientation") === "vertical";

    function currentIndex() {
      for (var i = 0; i < tabs.length; i += 1) {
        if (tabs[i].getAttribute("aria-selected") === "true") {
          return i;
        }
      }
      return 0;
    }

    function select(index, moveFocus) {
      for (var i = 0; i < tabs.length; i += 1) {
        var selected = i === index;
        tabs[i].setAttribute("aria-selected", selected ? "true" : "false");
        tabs[i].tabIndex = selected ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !selected;
        }
      }
      if (moveFocus) {
        tabs[index].focus();
      }
    }

    function isRtl() {
      return window.getComputedStyle(root).direction === "rtl";
    }

    list.addEventListener("keydown", function (event) {
      var index = currentIndex();
      var step;

      switch (event.key) {
        case "Home":
          step = -index;
          break;
        case "End":
          step = tabs.length - 1 - index;
          break;
        case "ArrowRight":
          if (vertical) return;
          step = isRtl() ? -1 : 1;
          break;
        case "ArrowLeft":
          if (vertical) return;
          step = isRtl() ? 1 : -1;
          break;
        case "ArrowDown":
          if (!vertical) return;
          step = 1;
          break;
        case "ArrowUp":
          if (!vertical) return;
          step = -1;
          break;
        default:
          return;
      }

      event.preventDefault();
      select((index + step + tabs.length) % tabs.length, true);
    });

    forEach(tabs, function (tab, index) {
      tab.addEventListener("click", function () {
        select(index, false);
      });
    });
  }

  /* --------------------------------------------------------------- checkbox
   * `indeterminate` has no HTML attribute; the DOM flag is the only honest way
   * to express it, and the platform then reports "mixed" by itself.
   */
  function setupIndeterminate(input) {
    input.indeterminate = true;
  }

  function boot() {
    forEach(document.querySelectorAll("[data-ui-dialog-open]"), setupDialog);
    forEach(document.querySelectorAll("[data-ui-tabs]"), setupTabs);
    forEach(
      document.querySelectorAll("[data-ui-indeterminate='true']"),
      setupIndeterminate
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
