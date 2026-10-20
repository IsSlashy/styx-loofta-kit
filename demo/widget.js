/*
 * The concept demo's hero card: Loofta's send widget with Styx as its private option. Our own code, nothing third
 * party. With "Pay privately · Styx" on, Loofta's Send button goes and the Styx frame sits inline under the option
 * (Styx.payLink with a container, sdkux-2026-10-17): the frame's own "Pay <amount> SOL privately" is the button that
 * pays, behind its confirm; the link, its Copy and its Share stay in the frame. Another amount typed here is handed to
 * the same frame (setAmount) before the payment. This page is told a status only, and the frame's height. The handle only names who the sender means to share the link with; it never leaves this page.
 */
(function () {
  "use strict";
  var BASE = document.currentScript.getAttribute("data-styx");
  var INTEGRATOR = "loofta-concept";
  var $ = function (s) { return document.querySelector(s); };
  var toggle = $("[data-testid=styx-toggle]");
  var send = $("[data-testid=demo-send]");
  var box = $("[data-testid=styx-inline]");
  var status = $("[data-testid=styx-status]");
  var amount = $("#hero-amount");
  var recipient = $("#hero-recipient");
  var sizer = $("[data-demo=sizer]");
  var dollar = $("[data-demo=dollar]");
  var token = $("[data-demo=token]");
  var foot = $("[data-demo=foot]");
  var FOOT = foot.textContent;
  var TOKEN = token.textContent;
  var LOCK = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  LOCK.setAttribute("viewBox", "0 0 24 24");
  LOCK.setAttribute("aria-hidden", "true");
  LOCK.setAttribute("class", "styx-token-lock");
  LOCK.innerHTML = '<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"></path>';
  var SOL = /^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/;
  var TEXT = {
    sent: "Sent. Share the link",
    cancelled: "Stopped.",
    refused: "Styx could not take this request.",
    failed: "It did not go through.",
  };
  // the amount the frame now on the card was told, and its handle (close() ends it)
  var on = false;
  var frame = null;
  var framed = "";
  var usd = amount.value;
  var sol = "0.01";

  function handle() {
    return recipient.value.trim();
  }
  function validSol(v) {
    return SOL.test(v) && Number(v) > 0 && Number(v) <= 10;
  }
  function say(o) {
    status.setAttribute("data-status", o);
    var h = handle();
    status.textContent = o === "sent" ? TEXT.sent + (h ? " with " + h : "") + "." : TEXT[o] || "";
  }
  function unmount() {
    if (frame) frame.close();
    frame = null;
    framed = "";
  }
  /** one frame for the card; another amount before the payment is an update of it */
  function mount() {
    var v = amount.value.trim();
    if (!on || !validSol(v) || frame) return;
    var mine = Styx.payLink({ base: BASE, integrator: INTEGRATOR, amount: v, container: box });
    frame = mine;
    framed = v;
    mine.then(function (o) {
      // a frame this page closed itself (another amount, Styx off) says nothing
      if (frame !== mine) return;
      if (o.status === "closed") {
        // "Done" in the frame: a fresh one takes its place, for the next payment
        frame = null;
        framed = "";
        mount();
      } else say(o.status);
    });
  }
  function render() {
    var h = handle();
    var v = amount.value.trim();
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    box.hidden = !on || !validSol(v);
    // with Styx on, the Styx frame's own button pays: Loofta's Send goes
    send.hidden = on;
    dollar.style.display = on ? "none" : "";
    // with Styx on, the token is SOL and locked: no other token is offered
    token.textContent = on ? "SOL · Solana devnet" : TOKEN;
    if (on) token.insertBefore(LOCK.cloneNode(true), token.firstChild);
    token.title = on ? "Locked to SOL with Styx" : "";
    amount.setAttribute("aria-label", on ? "Amount in SOL" : "Amount in USD");
    amount.setAttribute("inputmode", on ? "decimal" : "numeric");
    sizer.textContent = amount.value || "0";
    // Loofta's own line stays; the Styx block says the rest
    foot.textContent = on && !validSol(v) ? "Enter an amount in SOL, up to 10." : FOOT;
    if (!on) {
      // only the Styx option runs in this concept demo
      send.disabled = true;
      send.textContent = h ? "Concept demo: turn on Pay privately · Styx" : "Enter a handle";
    }
  }

  toggle.addEventListener("click", function () {
    if (on) sol = amount.value;
    else usd = amount.value;
    on = !on;
    amount.value = on ? sol : usd;
    status.textContent = "";
    status.removeAttribute("data-status");
    if (!on) unmount();
    render();
    mount();
  });
  amount.addEventListener("input", function () {
    status.textContent = "";
    status.removeAttribute("data-status");
    render();
    var v = amount.value.trim();
    // an amount that is not one yet hides the frame (render); it waits for a valid one
    if (!on || !validSol(v)) return;
    if (!frame) return mount();
    // the loader hands it over once the typing stops; the frame proves again and wakes its button a second later
    if (framed !== v) frame.setAmount(v);
    framed = v;
  });
  recipient.addEventListener("input", render);
  render();
})();
