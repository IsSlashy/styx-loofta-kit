/*
 * The concept demo's claim page (/r). Runs right after the Styx loader, before anything else on the page: the loader
 * reads the link's secret after the "#", wipes it from the address bar and the history, and frames the claim. This
 * page is told a status only.
 */
(function () {
  "use strict";
  var BASE = document.currentScript.getAttribute("data-styx");
  var TEXT = {
    claimed: "Claimed. It is in your Styx balance on Loofta.",
    cancelled: "Stopped in the Styx window.",
    refused: "No claim link here: open the link you were sent.",
    failed: "It did not go through.",
    closed: "The Styx window was closed. Open the link again to claim.",
  };
  var claim = Styx.claimLink({ base: BASE, integrator: "loofta-concept" });
  claim.then(function (o) {
    function show() {
      var s = document.querySelector("[data-testid=styx-status]");
      s.setAttribute("data-status", o.status);
      s.textContent = TEXT[o.status] || "";
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
    else show();
  });
})();
