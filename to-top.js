(function () {
  "use strict";

  var button = document.getElementById("to-top");
  if (!button) return;

  var threshold = 240;

  function sync() {
    button.hidden = window.scrollY < threshold;
  }

  button.addEventListener("click", function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.hidden = true;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", sync, { passive: true });
  sync();
})();
