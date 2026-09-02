# Prompt Playbook

Copy-paste prompts for running the whole job-hunt workflow with Claude. Do this inside a
**Project** (so Claude keeps your resume/profile in context) with the **Apify connector** enabled.

---

## 0. One-time setup
- Put your resume / LinkedIn profile export in the Project files.
- Enable the Apify connector in Claude (Settings → Connectors).

---

## 1. Kick off a scan

> Using my profile in the project files, build (or reopen) the job-scanner artifact.
> Translate my background into search terms for these lanes: **[Applied AI, Data Engineering]**.
> Location rule: **US-remote anywhere, plus onsite/hybrid only in [Atlanta, GA]**.
> Use the public Apify actor `bebity/linkedin-jobs-scraper`. One lane + one location per scan is most reliable.

**Tip:** if a scan errors or returns junk, narrow to a single lane and single location, then run again.

---

## 2. Get the full detail (for good outreach)

The in-app cards are a preview. For tailored outreach you want full descriptions:

> In my Apify run, click **Export → JSON → all fields → download**, then I'll upload it here.
> Rank all rows against my profile, apply my location rule, and flag genuine fits vs. title-only matches.

---

## 3. Prioritize which to reach out to first, connected to a real person

> From the ranked list, pick the roles where the posting names a **hiring manager or team member**
> (or where I can reach a decision-maker on LinkedIn), and sort those to the top —
> those are higher-yield than a black-hole application. For each, tell me who to contact and why.

*(See "Pulling jobs connected to hiring managers" below for how to make this reliable.)*

---

## 4. Generate application materials per role

> For the top **[3]** roles: give me, for each — the apply link, the resume angle to lead with,
> a tailored one-page cover letter (PDF), and a short LinkedIn note (≤300 chars) to the hiring
> manager or a recruiter. Tie each to specifics in that posting. Bring them to me for approval;
> don't send anything.

---

## 5. Quick-and-easy-apply pass (for the volume roles)

> For any **Easy Apply / high-volume** roles that fit but don't warrant a custom letter,
> give me a single reusable 2-3 sentence application blurb I can paste, plus which resume version
> to attach. Keep it honest and generic enough to reuse, specific enough to not read as spam.

---

## Pulling jobs "connected to hiring managers"

LinkedIn scrapers reliably return the **company** and **apply URL**, but the individual
hiring manager is only *sometimes* in the data. To bias toward roles you can reach a human on:

1. **Prefer postings with a named poster.** Some actors expose a `posterFullName` /
   `posterProfileUrl` field — ask Claude to keep only rows where that's present.
2. **Use the job page's "Meet the hiring team" panel.** LinkedIn often shows the hiring manager
   there even when the scraper doesn't capture it — and frequently lets you message them free.
3. **Filter to smaller companies / startups** for scans where reaching a decision-maker matters —
   they're far more reachable than a Fortune 500 ATS.
4. **Second-degree connections first.** Roles where you share a connection convert best; ask
   Claude to help you draft a warm intro request.

> Prompt: *"From this export, keep only roles where a hiring manager or poster is identifiable,
> or where the company is small enough (< ~1,000 employees) that outreach is realistic. For each,
> give me the person to contact and a tailored note."*

---

## Quick and easy apply

- **Easy Apply roles:** fastest to fire off — use the reusable blurb from step 5 + the right resume.
- **External-apply roles (ATS):** upload a **PDF** resume (safer for layout) and paste the cover letter.
- Keep one **AI-forward** resume and one **Data-Engineering** resume version; pick per role.
- Always send the human note (LinkedIn) *and* submit the application — the note is the differentiator.

---

## Guardrails (keep these)
- Never let the tool send messages for you — you do the final click.
- Don't commit secrets or scraped data to git.
- Keep outreach genuinely tailored; volume-spam hurts your brand more than it helps.
