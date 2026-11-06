# Hosting options

**Status:** For decision. Nothing is set up yet. Checked against providers' own pages on 2026-11-06; prices and terms change, so recheck before signing up.

## What the host has to do

1. Serve the built site (plain HTML, images, fonts; about 15 pages).
2. Rebuild when the farm clicks Publish in Storyblok (a "build hook").
3. Send the contact and wait-list forms to the farm's email.
4. Apply the 253 redirects from old WordPress URLs (`public/_redirects`) as real 301s, so Google rankings carry over.
5. Allow a business site. The farm is a business, even without online sales.

**Expected usage:** a few thousand visits a month, roughly 0.5 MB per visit, so a few GB of traffic. Publishes depend on the editor: a busy week of updating animals, hours, or "closed today" notices could mean 10–30 publishes.

## Lock-in is low, whichever we pick

The site is plain static files built from the repo. Moving to another host is a few hours of work, not a rebuild. Only two parts are host-specific:

- **Forms:** written for Netlify Forms (one attribute on the form). Other hosts need a form service or a small script instead.
- **Redirects:** the `_redirects` file format works on Netlify and Cloudflare as-is. Vercel needs it converted, which our generator script can do.

## The options

### A. Netlify Free ($0)

- **Pros:** Forms built in and free; redirects work as-is; simplest setup; failed builds never replace the live site.
- **Cons:** 300 credits a month as a hard cap, and each publish costs 15. With traffic included, that's about **18 publishes a month**. When credits run out, **the whole site goes offline** ("Site not available") until the next month. You can't buy more on Free.
- **Verdict:** Too risky for a farm that updates often.

### B. Netlify Personal ($9/month)

- **Pros:** Everything in A. 1,000 credits a month (about 60 publishes). You can turn on auto top-up ($5 for 500 more credits) so the site never pauses.
- **Cons:** $108 a year. Publishing many times in one day still uses credits.
- **Verdict:** Lowest effort and lowest risk. **Recommended.**

### C. Cloudflare Pages or Workers ($0)

- **Pros:** Static traffic is free and unlimited. Builds are generous (3,000 build minutes a month on Workers; 500 builds a month on Pages), so publishing is effectively unlimited. Redirects work as-is (limit of 2,000; we have 253). Cloudflare can also host the domain's DNS.
- **Cons:** No built-in forms, so we'd add a small form handler or a third-party form service. Setup takes more steps. Cloudflare now steers new projects to Workers; I haven't confirmed that Workers has a simple build hook for Storyblok (Pages does).
- **Verdict:** Best if $0 matters more than about 2 extra hours of setup. **Runner-up.**

### D. Vercel Pro ($20/month)

- The free Hobby plan is for non-commercial personal use only, so a farm business needs Pro.
- No built-in forms, and redirects need converting.
- **Verdict:** Costs more than B and does less for this site. Not recommended.

### E. GitHub Pages ($0)

- No real 301 redirects (old links would 404 or use slow page-level redirects, which loses Google rankings). No forms. The terms bar sites "primarily directed at commercial transactions"; a brochure site is probably fine but sits in a gray area.
- **Verdict:** Not recommended.

## Comparison

| | Netlify Free | Netlify Personal | Cloudflare | Vercel Pro | GitHub Pages |
|---|---|---|---|---|---|
| Cost / year | $0 | $108 | $0 | $240 | $0 |
| Publishes a month | ~18, then offline | ~60, top-up available | Effectively unlimited | Plenty | Plenty |
| Forms | Built in | Built in | Add a service | Add a service | Add a service |
| Old-URL redirects | As-is | As-is | As-is | Convert | Not real 301s |
| Business use allowed | Yes | Yes | Yes | Pro only | Gray area |
| Setup effort | Low | Low | Medium | Medium | Medium |

## Risk register

Likelihood and impact: H high, M medium, L low.

| # | Risk | Applies to | L | I | Mitigation |
|---|---|---|---|---|---|
| R1 | Monthly credits run out and the site goes offline | Netlify Free | H | H | Don't use Free. On Personal, turn on auto top-up. |
| R2 | Host raises prices or changes terms | All | M | M | Site is portable (static files, our own repo). Switching is a few hours. Keep this doc current. |
| R3 | Forms tied to one host | Netlify | M | L | Forms are one component. Swap to a form service if we move. |
| R4 | Frequent "closed today" overrides use up publishes | Netlify | M | M | Option: have the status bar read the override live from Storyblok, so it changes without a rebuild. |
| R5 | Google rankings drop after the switch | All | M | H | Before changing DNS, test every old URL against the new site (we have the full list). Keep WordPress up until checked. |
| R6 | DNS change goes wrong; site down for a while | All | L | M | Lower DNS TTL a day ahead, switch at a quiet time, keep the old site ready to switch back. |
| R7 | Hosting account tied to one person's login | All | M | H | Sign up with a farm email, turn on 2-step login, add a second owner. |
| R8 | A broken update stops new publishes from going live | All | L | M | Failed builds keep the last good site live. Turn on email alerts for failed builds. |
| R9 | Business-use terms violated | Vercel Hobby, GitHub Pages | M | H | Don't use those plans. |
| R10 | Storyblok can't trigger a Cloudflare Workers rebuild easily | Cloudflare | M | M | Use Cloudflare Pages (has build hooks), or confirm Workers support before choosing. |
| R11 | Form spam reaches the farm inbox | All | M | L | Hidden spam-trap field is already in the forms; add a spam filter if needed. |

## Recommendation

**Netlify Personal ($9/month), with auto top-up on and alerts for failed builds.** It's the least work to set up and run, the forms and redirects already work, and the main risks (R1, R4) are handled by paying and topping up.

If $108 a year matters more than setup time, **Cloudflare Pages** is a good free choice; it needs a form service added first.

Since moving later is cheap, this isn't a one-way door. Whichever host we pick, set up the account under a farm email with a second owner (R7).

## Sources

- [Netlify pricing](https://www.netlify.com/pricing/), [credit-based plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [how credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)
- [Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan](https://vercel.com/docs/plans/hobby)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [static asset redirects](https://developers.cloudflare.com/workers/static-assets/redirects/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
