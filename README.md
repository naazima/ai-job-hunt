# AI Job Hunt — a Claude + Apify job-search & outreach tool

Turn your professional profile into targeted job searches, pull real listings from LinkedIn
via a public Apify scraper, and generate tailored application materials — resume angle,
cover letter, and outreach notes — for each role.

Built as a Claude artifact (a single self-contained React app) plus a reusable prompt playbook.

> **Why this exists:** mass-applying with one generic resume doesn't work. This tool helps you
> run focused searches, keep the roles that actually fit, and write outreach that's genuinely
> tailored to each posting — at a pace you can sustain.

---

## What's in here

| File | What it is |
|---|---|
| `job-scanner.jsx` | The scanner app. Translates your profile into searches, runs a LinkedIn Jobs scraper through your own Apify account, and lists real roles you can save. |
| `docs/prompt-playbook.md` | Copy-paste prompts for running the whole workflow with Claude next time — from scanning to outreach. |
| `examples/sample-output.md` | A de-identified example of what the results look like. |

---

## How it works

1. Your profile (skills, target roles, location) becomes a set of search queries.
2. The scanner calls a **public LinkedIn Jobs scraper** on **your own Apify account**.
3. Real listings come back; you save the ones worth pursuing.
4. You hand the saved roles to Claude, which drafts a role-specific resume angle, cover letter,
   and short outreach notes for your approval.

It does **not** magically know "your matches," and it does **not** scrape your private LinkedIn
feed — LinkedIn's own recommendations aren't accessible to third-party tools. It runs honest,
keyword-based searches. It also never sends anything on your behalf; you do the final click.

---

## Setup

### Prerequisites
- A free/low-cost [Apify](https://apify.com) account (the scraper runs on their platform; small pay-per-use cost — the sample run here cost ~$0.05).
- Access to [Claude](https://claude.ai) with the **Apify connector** enabled (Settings → Connectors).

### Run it
The scanner is a Claude artifact. The simplest path:
1. Open Claude, connect Apify, and paste the contents of `job-scanner.jsx` (or the prompt in
   `docs/prompt-playbook.md` that recreates it).
2. Pick your lanes and location, click **Scan**, and save the roles you like.
3. Follow the outreach prompts in the playbook.

You can also adapt `job-scanner.jsx` into your own React project — it calls the Anthropic
Messages API with an Apify MCP server; swap in your own keys and hosting.

---

## ⚠️ Before you make your fork public

- **Never commit** your Apify token, Anthropic API key, or any scraped job data.
- The included `.gitignore` blocks common secret/data files — keep it.
- Scraped listings belong to their sources; don't redistribute datasets. Share the *tool*, not the *data*.
- Respect LinkedIn's and Apify's terms of use.

---

## License

MIT — see [LICENSE](LICENSE). Free to use, adapt, and share.

## Acknowledgements

Built with [Claude](https://claude.ai) and [Apify](https://apify.com). LinkedIn scraping via a
public community actor (`bebity/linkedin-jobs-scraper`).
