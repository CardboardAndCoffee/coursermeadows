# 1. Static site + headless CMS, retire WordPress entirely

**Status:** Accepted (from the project handoff)

The old site is WordPress + WooCommerce + Beaver Builder on the Storefront theme. The online store is closed, and the site is now a brochure: hours, what's in the farm store, animals, and husbandry writing, with "call to reserve" instead of checkout.

We rebuild as a statically generated site that reads its content from a hosted headless CMS, and retire WordPress fully rather than slimming it down.

**Why:** no server or plugins to patch, fast pages (Lighthouse 90+ on mobile is a launch requirement), and a CMS that a non-technical editor can use without touching layout.

**Consequences:** content changes need a rebuild, triggered by a CMS publish webhook (about a minute). Anything time-sensitive that must change *without* a publish, like the open/closed indicator flipping at opening time, has to be computed in the browser. Forms need a hosted replacement for Ninja Forms.
