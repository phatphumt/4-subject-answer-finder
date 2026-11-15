(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  // Service workers need a real origin; skip when the page is opened as a file.
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // Offline support is optional: never let registration break the page.
    });
  });
})();
