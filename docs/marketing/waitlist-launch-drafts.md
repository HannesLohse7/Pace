# Waitlist launch content — drafts (2026-09-02)

**Status (updated 2026-09-02, later same day): X Option B is live.** Posted to `@AX_halo12321` with the real waitlist link substituted for the `[link]` placeholder, after the user explicitly approved that exact option and confirmed they were logged into X in this app's own browser pane. Posted via that browser (`https://x.com`), not any API — there's no X/Twitter API integration in this project. Link-preview card rendered correctly from the OG tags already on the waitlist page. Instagram was explicitly deferred by the user (needs a real image; Viewmax has no active subscription to generate one, and there's no reliable upload path from this session's browser either — see below). TikTok and TouTube are still blocked on more than login — see the note the user already got in-chat: no TikTok posting tool exists at all, Viewmax can't generate video with 0 credits, and the connected vidIQ/YouTube account has 0 authorized channels plus no "upload new video" capability regardless.

Everything below Option B (and everything for LinkedIn/Reddit/Instagram/the welcome email) is still a draft — nothing else has been posted or sent. Per the project's own action rules, publishing or sending anything on the user's behalf needs explicit sign-off in chat, exact text approved first — this file is the thing to review, not a queue that fires on its own.

**One fact worth knowing before posting any of this: the waitlist has 0 signups as of 2026-09-02** (checked directly against `waitlist_signups`). Nothing below claims a signup count or says "athletes have already joined" — that would be false right now. Once real signups exist, the count line already live on the landing page (`<n> athletes already on the list`) is the honest place for that number to show up; don't backfill a number into any of these posts by hand.

Everything here is built from the landing page's own copy (`supabase/functions/waitlist/static-site/index.html`) and `docs/ROADMAP.md`'s Marketing section — not new positioning invented for this file. No launch date appears anywhere in the project, so nothing below implies one ("early access," not "launching in \_\_\_").

---

## Messaging foundation

**Positioning:** Pace is an AI endurance coach for *working adults* training for triathlon — not pros, not people with unlimited time. Its whole reason to exist is that a missed workout, a bad night's sleep, or a packed calendar shouldn't wreck the week's plan; Pace rebuilds around it instead of either ignoring it or guilt-tripping the athlete for it.

**Audience:** Adults training for Sprint/Olympic/70.3/Ironman-distance triathlon around a full-time job and a life outside the sport. Not beginners looking for "how to swim" content, and not the elite/pro training-log crowd — the specific gap is *adaptive* coaching for people whose training gets disrupted by ordinary life on a regular basis, which is most of this audience.

**The one differentiator to lead with:** most training-plan apps (and most human coaches, for that matter) hand you a fixed calendar and treat any deviation as a failure to log or explain away. Pace's plan changes *with* you — a missed session, illness, travel, or a packed week gets folded back into the plan with a real explanation, not a guilt trip or a rigid schedule that's already wrong by Tuesday.

**Voice:** direct, a little wry, respectful of the reader's time and intelligence — matches the landing page exactly ("instead of guilt-tripping you for it," "no spam, no lists sold, ever"). No exclamation-point hype, no fitness-influencer voice, no "🔥💪" emoji stacking. Confident about the problem being real; understated about the product, since it isn't in anyone's hands yet.

**Guardrails for anyone extending this:**
- Never claim a specific signup count, feature, or capability that isn't true today (check ROADMAP.md's Status section first — a lot of this app is still honest "coming soon" placeholders, and marketing copy shouldn't get ahead of the product).
- Never imply the app is available now — it's a waitlist for early access, full stop.
- "Founding Athletes" (first 500 signups get 3 months free + priority beta access) is the one concrete incentive that exists — reuse it rather than inventing a new one.

---

## Social posts

### X / Twitter (thread-friendly, 3 options — pick one, don't post all three back to back)

**Option A — the core insight:**
> Every triathlon plan I've used has the same flaw: it assumes nothing in my life ever goes wrong.
>
> One missed workout, one bad night of sleep, one packed week at work — and the plan's already lying to you.
>
> Building Pace to fix that. Waitlist's open. [link]

**Option B — direct/product-forward:**
> Pace is an AI endurance coach for triathletes who also have a job.
>
> Miss a session, get sick, travel for work — it rebuilds your week around it instead of pretending it didn't happen.
>
> First 500 on the waitlist get 3 months free + priority beta access. [link]

**Option C — short, quote-tweetable:**
> Your training plan shouldn't fall apart the first time your actual life shows up.
>
> That's the whole idea behind Pace. Waitlist's open: [link]

### Instagram / Threads caption

> Training for a triathlon around a full-time job means your plan gets disrupted *constantly* — a late night at work, a rough sleep, a trip you can't move.
>
> Most training apps treat that as your failure to log around. Pace treats it as the normal shape of an adult's training week, and rebuilds the plan to match — with a real explanation for every change, not a guilt trip.
>
> Waitlist is open now. First 500 athletes get 3 months free at launch + priority beta access. Link in bio.
>
> #triathlon #triathlontraining #ironman #70point3 #endurancesport #trainingplan

### LinkedIn (slightly more measured register — this audience skews toward the "working professional" angle specifically)

> Most triathlon training plans are built for people whose lives don't get in the way of training. Most of the adults actually training for triathlon don't have that luxury.
>
> I'm building Pace: an AI endurance coach that adapts your week when a workout gets missed, sleep is bad, or your calendar is packed — instead of either ignoring it or treating it as a failure on your part.
>
> Waitlist is open for early access, including a founding-athlete cohort with free months at launch. [link]

### Reddit (r/triathlon — written to read as a genuine post from someone building the thing, not an ad; this community reacts badly to anything that smells like marketing copy, so tone matters more here than anywhere else)

> **Title: Built a waitlist for an AI training app that actually adapts when life gets in the way — curious what this sub thinks**
>
> Long-time lurker, training for [race distance] around a full-time job. The thing that's always bugged me about every plan/app I've tried (TrainingPeaks, various coach-in-an-app products) is that they treat any deviation — missed session, bad sleep, a brutal week at work — as something *I* failed to manage, rather than something the plan should just... account for.
>
> Been building something called Pace to fix that specifically — it's an AI coach that rebuilds your week around what actually happened instead of guilt-tripping you or leaving the plan stale. Explains *why* it changed something, not just that it did.
>
> It's pre-launch, waitlist only right now (first 500 get free months + early beta access), not trying to sell anyone anything today — genuinely curious whether "the plan should adapt to missed/disrupted sessions with a real explanation" resonates with how this sub trains, or whether I'm solving a problem that isn't actually widely felt. [link if allowed by sub rules — check before posting, some subs restrict self-promotion to specific threads/days]

**Note on Reddit specifically:** check r/triathlon's self-promotion rules before posting — a lot of subs restrict this to a weekly thread or require mod approval, and posting outside that gets removed (and can get an account flagged) regardless of how genuine the post reads.

---

## Waitlist welcome email

The landing page's fine print already promises *"We'll only email you about your Pace invite"* — implying at least one confirmation email — but no email template exists anywhere in the project yet. Draft below; needs an actual sending mechanism before it can go out (nothing in `supabase/functions/waitlist` sends email today, it only inserts the row — see `docs/API.md`/`docs/DATABASE.md` for what that function actually does).

**Subject:** You're #{{position}} on the Pace waitlist

**Body:**

> Hey,
>
> You're in — you're **#{{position}}** on the Pace waitlist.
>
> Pace is an AI endurance coach built for triathletes who also have a job, a family, and a life that doesn't pause for training. When something disrupts your week — a missed workout, bad sleep, a packed calendar — Pace rebuilds your plan around it and tells you exactly why, instead of leaving you with a schedule that's already wrong.
>
> {{#if founding_athlete}}
> You're one of our first 500 — a **Founding Athlete**. That means 3 months free when we launch, and priority access to the beta before anyone else.
> {{/if}}
>
> We'll only email you about your Pace invite — no spam, nothing sold, same as we said on the way in.
>
> Talk soon,
> The Pace team

**Implementation note:** `{{position}}` and `{{founding_athlete}}` (true when `position <= 500`) both come straight from `waitlist`'s own `POST` response shape (`{position, alreadyIn}` — see docs/API.md) — no new data to compute, just a sender to wire up (Resend, Postmark, Supabase's own SMTP integration, etc., none of which exist in this project yet).

---

## Founding-athlete milestone post (only fires once real, ready to use later)

For whenever the count actually crosses a meaningful threshold (100, 500, whatever the team wants to mark) — drafted now so it's ready, not meant to post until the real number backs it up:

> [N] athletes are now on the Pace waitlist. If you're one of the first 500, you're locked in as a Founding Athlete — 3 months free at launch, priority beta access. Still time to grab a spot: [link]

---

## What this round didn't cover, and why

- **App Store / Play Store listing copy** — deliberately skipped this round. The app isn't in either store yet and isn't close to a submittable build (see ROADMAP.md's milestone list) — writing store copy now would be copy for a listing that might not match the app by the time it's real. Worth doing once the app is closer to a submission, not before.
- **Paid ad copy** — no ad budget or channel decision anywhere in this project; drafting ad copy without knowing the channel (Meta vs. Google vs. Reddit ads all want different formats/lengths) would mostly be guessing. Flagging as a real next step once that decision exists, not drafting blind.
- **SEO/keyword-driven blog content** — `docs/ROADMAP.md`'s Marketing section already covers where SEO research stands (#17); long-form content built on top of that research is a bigger, separate effort than fits in this round alongside everything else that shipped today.
