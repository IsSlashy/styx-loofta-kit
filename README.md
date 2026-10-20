# Styx on Loofta: integration kit

This kit shows how to add Styx, a private way to pay, to Loofta's send card. It is a draft for Lisa at Loofta,
prepared by the Styx team on 2026-10-20.

Status, plainly:

- Styx runs on Solana devnet only, with test SOL. No real money moves.
- Styx has not had an external audit.
- The licence for using the Styx loader on loofta.com is still to be agreed between Loofta and Styx. Nothing in
  this kit grants one.

## What it does

When the sender turns on "Pay privately · Styx" in your card, a small Styx block appears inside the card, in
Loofta's colours. The sender pays from a private balance that Styx keeps for them on Loofta. The block makes a claim
link, and the sender shares it with the person they want to pay. That person opens the link on your claim page and
claims it into their own private balance on Loofta, or sends it on to their own wallet.

Your page never sees the user's balance, keys, words, Styx address or the link. It only learns a status:

| status | meaning |
| --- | --- |
| `sent` | the payment went through; the sender shares the link from the Styx block |
| `claimed` | the claim went through on your claim page |
| `cancelled` | the user stopped it in the Styx block |
| `refused` | Styx could not take the request (an unknown site, a bad amount, a damaged link) |
| `failed` | it did not go through |
| `closed` | the block was closed before any of the above |

On chain, a deposit into Styx is public. The private payment that follows is built not to show which deposit paid
it, nor its amount. On a quiet pool, the timing and the amount of a payment can still give it away, and styx.cash
sees the user's IP address.

## Try it first

A concept demo runs on its own address: https://styx-loofta-concept.vercel.app

It is a copy of Loofta's landing page with Styx as the private option. A line at the top says it is a concept demo,
not affiliated with Loofta, devnet only. It is not listed in search engines. See "How to test" below.

## What we need from you

1. The exact web origins of the pages that will show Styx, for example `https://www.loofta.com`. Today our list
   holds `https://www.loofta.com` only. Styx frames itself only for an exact origin: `https://loofta.com`,
   `https://pay.loofta.com` or a staging address each need their own line on our list. Tell us which ones.
2. Where your claim page will live. We expect `https://www.loofta.com/r`. Payment links will point there.
3. Where "Back to Loofta" should go after a claim. We expect `https://www.loofta.com/`.

## What to change on your site

### 1. Content security policy

Every page that shows Styx, and your claim page, must allow `https://styx.cash`:

```
script-src ... https://styx.cash;
frame-src  ... https://styx.cash;
child-src  ... https://styx.cash;
```

On 2026-10-18 the pages we looked at had none of these, so the Styx block cannot load there yet.

### 2. The send card

See `snippet/send-card.html`. In short:

```html
<script src="https://styx.cash/embed/v2/styx.js"
        integrity="sha384-YWAYXzMo8whQfNbI8L7GLMTJ7s3r5n6eHP6+dnT0CL57TrgB6hPnmbseOOoAYqHo"
        crossorigin="anonymous"></script>

<div id="styx-box"></div>

<script>
  var pay = Styx.payLink({ integrator: "loofta", amount: "0.01", container: document.getElementById("styx-box") });
  pay.then(function (o) { /* o.status: sent, cancelled, refused, failed or closed */ });
  // the user types another amount before paying: hand it to the same block
  amountField.addEventListener("input", function () { pay.setAmount(amountField.value); });
</script>
```

- Load the loader from `https://styx.cash/embed/v2/styx.js` with the `integrity` hash above. The hash is for loader
  version 2.1.0, the file served today. We will tell you the new hash when the loader changes.
- While Styx is on, hide your own Send button. The Styx block has its own "Pay privately" button, and it is the one
  that pays.
- The block takes the width of your container and a fixed height of 160 px. It only tells your page its height and
  the status.
- Amounts are in SOL. The smallest payment is 0.00225 SOL; the concept demo takes up to 10 SOL.
- Do not put `perspective`, `filter`, `opacity` below 1 or a 3D `transform` on the container or on any element
  around it. Chrome then reports the block as hidden, and its Pay button never wakes. The block says so to the user
  after two seconds and offers to pay on styx.cash instead.
- The `integrator` value for loofta.com is `loofta`. The concept demo uses its own, `loofta-concept`.

### 3. Your claim page, /r

See `snippet/r.html`. A payment link looks like `https://www.loofta.com/r#...`. Everything after the `#` is the
secret: like cash, whoever holds the link can claim it. Browsers never send that part to your server.

- Serve a page at `/r` that loads the loader first and calls `Styx.claimLink({ integrator: "loofta" })`.
- That page must load no analytics, tag manager or any other third-party script, and must not read
  `location.hash` itself. The loader reads the secret, removes it from the address bar and the history at once, and
  hands it to the Styx block.
- Send `Referrer-Policy: no-referrer`, `Cache-Control: no-store` and `X-Robots-Tag: noindex` on that page.

## How to test (devnet)

You need Phantom and some devnet SOL. Nothing here costs real money.

1. In Phantom, open Settings, then Developer Settings, and turn on Testnet Mode with Solana Devnet.
2. Get devnet SOL: copy your Phantom address and request 1 SOL at https://faucet.solana.com (choose Devnet). One
   try needs about 0.02 SOL. If the faucet refuses, ask us and we will send some.
3. Open https://styx-loofta-concept.vercel.app in a desktop browser with Phantom.
4. In the send card, type any handle (for example `@alice`), turn on "Pay privately · Styx" and type an amount in
   SOL, for example `0.01`.
5. The first time, the Styx block shows "Set up". Click it. A small styx.cash tab opens: choose Phantom, connect,
   and approve one signature. That signature moves no funds; it opens your private balance.
6. The same tab asks how much to add to your balance on "Loofta demo", with the least needed already filled in.
   Click the button and approve the deposit in Phantom. The tab shows a small rowing ferryman while the deposit is
   processed, then closes by itself. In our runs this took 2 to 4 minutes.
7. Back in the card, the Styx block shows the ferryman and "The funds show here a few minutes after they land".
   Wait there; do not top up again. In our runs this took 2 to 3 minutes.
8. When "Pay privately" wakes up, click it. After a few seconds the block shows the claim link. Click Copy.
9. To receive, open the link in another browser profile (with Phantom there too), or send it to a colleague. It
   opens on the demo's /r page. Click "Keep on Loofta demo" to claim it into that browser's private balance there.
   The ferryman shows while it claims. If the payment is very fresh, the block says it is still landing and tries
   again by itself; in our runs the claim was done within about 3 minutes.
10. Or click "Receive in my wallet" to send the amount on to your own Phantom wallet. That is a public withdrawal,
    so it first waits for other withdrawals, for at most 12 minutes, then leaves.

What may look odd but is expected:

- The styx.cash tab and the block follow your browser's language: English or French.
- The block names the site "Loofta demo" on the concept demo. On loofta.com it will say "Loofta".
- A second deposit from the same wallet within an hour is scheduled for later. This is on purpose: deposits spaced
  out are harder to match to payments.
- A very small link cannot be sent on to a wallet: once its fees are taken, too little is left. Only "Keep on Loofta
  demo" is offered then.

## What is in this kit

- `README.md`: this file.
- `snippet/send-card.html`: the send card with the Styx option, as small as it can be.
- `snippet/r.html`: the claim page.
- `demo/widget.js` and `demo/claim.js`: the code behind the concept demo's card and claim page, our own code, for
  reference. They expect the concept demo's markup.

Not in this kit, on purpose: the Styx loader file itself (load it from styx.cash with its hash, as above), any Styx
protocol code, keys or settings. The concept demo's copy of Loofta's own page is not here either; you have the real
one.

## Questions still open

- The licence under which Loofta may use the Styx loader (to be agreed; counsel on both sides).
- Loofta's own X sign-in for the optional "pay to an X account" mode: off for Loofta until Loofta registers its own
  X app with us.
- The look: the concept demo uses Loofta's orange, its dark page and its Manrope face, read from the public site.
  Tell us if Loofta wants other colours or a logo in the block.
