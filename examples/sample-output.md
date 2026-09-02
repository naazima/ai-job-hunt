# Sample output (de-identified)

What a scan looks like after the location rule is applied. Company names below are illustrative.

**Search:** Applied AI · US-remote + Atlanta, GA
**Actor:** `bebity/linkedin-jobs-scraper` · 25 rows returned · ~$0.05

Roles kept after the rule (US-remote anywhere OR Atlanta onsite/hybrid):

| Role | Company | Location | Why it fit |
|---|---|---|---|
| Senior AI Engineer (Remote) | Retailer Co. | Atlanta, GA | Agentic AI + RAG, production focus, local |
| Sr AI/ML Engineer (Remote) | Health Co. | Remote – US | LLM workflows, RAG, evaluation frameworks |
| LLM / GenAI Engineer | AI Startup | Remote – US | Production RAG, agentic workflows |

Roles dropped: onsite positions in other metros (correctly filtered out by the location rule).

---

For each kept role, the workflow then produces:
- the apply URL,
- which resume version to lead with,
- a one-page tailored cover letter,
- a short LinkedIn note to a hiring manager or recruiter.

No credentials, tokens, or raw scraped datasets are included in this repo.
