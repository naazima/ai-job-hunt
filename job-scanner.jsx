import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// Job Scanner — feeds Afreen's LinkedIn profile (translated into
// search terms) into a public Apify LinkedIn Jobs scraper via the
// Anthropic API + Apify MCP connector, and streams real listings back.
// ─────────────────────────────────────────────────────────────

const SEEDS = {
  appliedAI: {
    label: "Applied AI",
    lead: true,
    queries: [
      "Applied AI Engineer",
      "AI Engineer",
      "LLM Engineer",
      "Generative AI Engineer",
      "Machine Learning Engineer",
    ],
  },
  dataEng: {
    label: "Data Engineering",
    lead: false,
    queries: [
      "Data Engineer",
      "Analytics Engineer",
      "ETL Developer",
      "BI Data Engineer",
    ],
  },
};

const LOCATIONS = {
  remote: { label: "US · Remote", value: "United States", remote: true },
  atlanta: { label: "Atlanta · Hybrid/Onsite", value: "Atlanta, Georgia, United States", remote: false },
};

// Location rule: remote (US) roles are allowed anywhere; any non-remote
// (hybrid/onsite) role is only kept if it's in Atlanta, Georgia.
function passesLocation(job) {
  const loc = (job.location || "").toLowerCase();
  if (job.remote === true || loc.includes("remote")) return true;
  return loc.includes("atlanta") || loc.includes(", ga") || loc.includes("georgia");
}

// Robust parser: recovers complete {…} job objects even if the array
// was truncated mid-last-object by the response size limit.
function extractJobs(text) {
  const s = text.indexOf("[");
  const e = text.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) {
    try { const a = JSON.parse(text.slice(s, e + 1)); if (Array.isArray(a)) return a.filter(Boolean); } catch (_) {}
  }
  const out = [];
  let depth = 0, startIdx = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "{") { if (depth === 0) startIdx = i; depth++; }
    else if (c === "}") { depth--; if (depth === 0 && startIdx !== -1) { try { out.push(JSON.parse(text.slice(startIdx, i + 1))); } catch (_) {} startIdx = -1; } }
  }
  return out.filter((o) => o && o.title);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
.js-root {
  --paper:#F4F4F2; --surface:#FFFFFF; --ink:#17181C; --muted:#6B6F76;
  --line:#E3E3E0; --accent:#4C3BCF; --accent-ink:#3A2CA8; --live:#0E9F6E;
  --lead:#B45309; --shadow: 0 1px 2px rgba(23,24,28,.04);
  font-family:'IBM Plex Sans', system-ui, sans-serif;
  color:var(--ink); background:var(--paper);
  min-height:100%; width:100%; line-height:1.5;
}
.js-wrap { max-width: 920px; margin:0 auto; padding: 28px 20px 64px; }
.js-h1 { font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:30px; letter-spacing:-.02em; margin:0; }
.js-sub { color:var(--muted); font-size:14px; margin:6px 0 0; max-width:60ch; }
.js-panel { background:var(--surface); border:1px solid var(--line); border-radius:10px; box-shadow:var(--shadow); }
.js-console { padding:20px; margin-top:22px; }
.js-row { display:flex; flex-wrap:wrap; gap:22px; align-items:flex-start; }
.js-field-label { font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:600; color:var(--muted); margin:0 0 8px; }
.js-chips { display:flex; flex-wrap:wrap; gap:8px; }
.js-chip {
  font-family:'IBM Plex Sans',sans-serif; font-size:13px; font-weight:500;
  padding:7px 13px; border-radius:999px; border:1px solid var(--line);
  background:var(--surface); color:var(--muted); cursor:pointer;
  transition: background .12s, color .12s, border-color .12s;
  display:inline-flex; align-items:center; gap:7px;
}
.js-chip:hover { border-color:#C9C9C4; }
.js-chip[data-on="true"] { background:var(--ink); color:#fff; border-color:var(--ink); }
.js-chip .lead-tag { font-size:10px; font-weight:600; color:var(--lead); letter-spacing:.03em; }
.js-chip[data-on="true"] .lead-tag { color:#FBBF24; }
.js-seedline { font-family:'IBM Plex Mono', monospace; font-size:11.5px; color:var(--muted); margin:10px 0 0; word-spacing:2px; }
.js-actionbar { display:flex; align-items:center; gap:16px; margin-top:22px; padding-top:18px; border-top:1px solid var(--line); flex-wrap:wrap; }
.js-scan {
  font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px;
  color:#fff; background:var(--accent); border:1px solid var(--accent-ink);
  padding:12px 22px; border-radius:8px; cursor:pointer;
  transition: background .12s, transform .05s;
}
.js-scan:hover:not(:disabled) { background:var(--accent-ink); }
.js-scan:active:not(:disabled) { transform: translateY(1px); }
.js-scan:disabled { opacity:.55; cursor:progress; }
.js-counter { font-family:'Space Grotesk',sans-serif; display:flex; align-items:baseline; gap:8px; }
.js-counter b { font-size:28px; font-weight:700; letter-spacing:-.02em; line-height:1; }
.js-counter span { font-size:13px; color:var(--muted); }
.js-status { font-size:13px; color:var(--muted); display:flex; align-items:center; gap:8px; }
.js-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); animation: js-pulse 1s infinite ease-in-out; }
@keyframes js-pulse { 0%,100%{opacity:.35;} 50%{opacity:1;} }
.js-error { margin-top:16px; border:1px solid #F0C9C0; background:#FDF3F1; color:#8A2C17; border-radius:8px; padding:12px 14px; font-size:13.5px; }
.js-error b { font-family:'Space Grotesk',sans-serif; }
.js-results { margin-top:30px; }
.js-results-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:14px; }
.js-results-head h2 { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; margin:0; }
.js-export { font-size:13px; font-weight:500; color:var(--accent-ink); background:none; border:none; cursor:pointer; padding:4px 2px; }
.js-export:disabled { color:var(--muted); cursor:default; }
.js-job { display:flex; gap:14px; padding:16px 18px; border:1px solid var(--line); border-radius:10px; background:var(--surface); box-shadow:var(--shadow); margin-bottom:10px; }
.js-job[data-saved="true"] { border-color:var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.js-job-main { flex:1; min-width:0; }
.js-job-title { font-family:'Space Grotesk',sans-serif; font-size:15.5px; font-weight:600; margin:0; }
.js-job-title a { color:var(--ink); text-decoration:none; }
.js-job-title a:hover { text-decoration:underline; }
.js-job-co { font-size:13.5px; color:var(--ink); margin:3px 0 0; }
.js-job-meta { display:flex; flex-wrap:wrap; gap:6px 10px; margin:9px 0 0; font-size:12px; color:var(--muted); align-items:center; }
.js-tag { padding:2px 8px; border-radius:5px; background:#F1F1EE; font-weight:500; }
.js-tag.remote { background:#E6F6EF; color:var(--live); }
.js-tag.lane { background:#EEEBFB; color:var(--accent-ink); }
.js-job-snip { font-size:13px; color:var(--muted); margin:9px 0 0; }
.js-save {
  align-self:flex-start; font-family:'Space Grotesk',sans-serif; font-size:12.5px; font-weight:600;
  border:1px solid var(--line); background:var(--surface); color:var(--muted);
  border-radius:7px; padding:7px 12px; cursor:pointer; white-space:nowrap;
}
.js-save[data-saved="true"] { background:var(--accent); color:#fff; border-color:var(--accent); }
.js-empty { text-align:center; color:var(--muted); font-size:14px; padding:40px 20px; border:1px dashed var(--line); border-radius:10px; }
.js-foot { margin-top:28px; font-size:12.5px; color:var(--muted); line-height:1.6; }
.js-raw { margin-top:12px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--muted); white-space:pre-wrap; max-height:180px; overflow:auto; background:#FAFAF9; border:1px solid var(--line); border-radius:6px; padding:10px; }
@media (max-width:560px){ .js-job{flex-direction:column;} .js-save{align-self:stretch; text-align:center;} }
`;

export default function JobScanner() {
  const [lanes, setLanes] = useState({ appliedAI: true, dataEng: true });
  const [locs, setLocs] = useState({ remote: true, atlanta: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState({}); // url -> job
  const [copied, setCopied] = useState(false);

  const activeQueries = useMemo(() => {
    const q = [];
    Object.entries(lanes).forEach(([k, on]) => { if (on) q.push(...SEEDS[k].queries.map((t) => ({ lane: SEEDS[k].label, title: t }))); });
    return q;
  }, [lanes]);

  const activeLocs = useMemo(
    () => Object.entries(locs).filter(([, on]) => on).map(([k]) => LOCATIONS[k]),
    [locs]
  );

  const canScan = activeQueries.length > 0 && activeLocs.length > 0 && !loading;
  const savedCount = Object.keys(saved).length;

  async function runScan() {
    setLoading(true); setError(null); setRaw(null); setCopied(false);

    const laneList = Object.entries(lanes).filter(([, on]) => on).map(([k]) => SEEDS[k].label).join(" and ");
    const titleList = activeQueries.map((q) => q.title).join(", ");
    const locList = activeLocs.map((l) => l.value + (l.remote ? " (remote)" : " (hybrid/onsite)")).join("; ");

    const system =
      "You are a job-search assistant with access to Apify tools via MCP. " +
      "Use the public actor bebity/linkedin-jobs-scraper to fetch REAL, current LinkedIn job postings. " +
      "Its input schema is exactly: " +
      '{"title": <one search phrase>, "location": <one location string>, "rows": 25, "publishedAt": "r2592000"}. ' +
      "You MUST pass a real title and location taken from the caller's message — NEVER call the actor with empty input {}. " +
      "If several titles are listed, combine the 2-3 most representative into one title phrase and run the actor once (twice at most for different locations). " +
      "From the returned dataset, select the strongest matches and return ONLY minified JSON — no prose, no code fences, no line breaks: " +
      'a JSON array of at most 6 objects, each exactly {"title":string,"company":string,"location":string,"remote":boolean,"posted":string,"url":string,"lane":string,"snippet":string}. ' +
      "snippet under 12 words. Do NOT include descriptions, HTML, or any other field. Never invent postings. " +
      "LOCATION RULE: only include a role if it is remote (anywhere in the US) OR located in Atlanta, Georgia. " +
      "Exclude any onsite or hybrid role that is not in Atlanta.";

    const userMsg =
      `Candidate lanes (priority order): ${laneList}.\n` +
      `Search these job titles: ${titleList}.\n` +
      `Locations to cover: ${locList}.\n` +
      `Return up to 10 of the best, most recent matches as the JSON array described.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system,
          messages: [{ role: "user", content: userMsg }],
          mcp_servers: [{ type: "url", url: "https://mcp.apify.com", name: "apify" }],
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`API responded ${resp.status}. ${t.slice(0, 200)}`);
      }

      const data = await resp.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      if (!text) throw new Error("The scraper returned no text output.");

      const parsed = extractJobs(text).filter(passesLocation);
      if (!parsed.length) { setRaw(text); throw new Error("No roles matched your location rule (US-remote, or Atlanta for onsite/hybrid). Try a single lane, then run again."); }

      // Merge, dedupe by url (or title+company if url missing)
      setJobs((prev) => {
        const seen = new Set(prev.map((j) => (j.url || j.title + j.company)));
        const fresh = parsed.filter((j) => !seen.has(j.url || j.title + j.company));
        return [...fresh, ...prev];
      });
    } catch (e) {
      setError(e.message || "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSave(job) {
    const key = job.url || job.title + job.company;
    setSaved((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = job;
      return next;
    });
  }

  function copySaved() {
    const list = Object.values(saved);
    if (!list.length) return;
    const txt = list.map((j, i) =>
      `${i + 1}. ${j.title} — ${j.company}\n   ${j.location}${j.remote ? " (remote)" : ""} | posted ${j.posted || "—"} | lane: ${j.lane || "—"}\n   ${j.url || ""}`
    ).join("\n\n");
    navigator.clipboard.writeText(
      `SAVED ROLES (${list.length}) — from LinkedIn via Apify\n\n${txt}\n\n(Paste these back into the chat and I'll draft tailored intros + pick the resume angle for each, for your approval.)`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  return (
    <div className="js-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="js-wrap">
        <header>
          <h1 className="js-h1">Job Scanner</h1>
          <p className="js-sub">
            Your LinkedIn profile, translated into targeted searches and run through a public
            LinkedIn Jobs scraper on your Apify account. Save the ones worth pursuing, then hand them back for tailored outreach.
          </p>
        </header>

        <section className="js-panel js-console">
          <div className="js-row">
            <div style={{ flex: "1 1 240px" }}>
              <p className="js-field-label">Lanes</p>
              <div className="js-chips">
                {Object.entries(SEEDS).map(([k, s]) => (
                  <button key={k} className="js-chip" data-on={lanes[k]}
                    onClick={() => setLanes((p) => ({ ...p, [k]: !p[k] }))}>
                    {s.label}{s.lead && <span className="lead-tag">LEADS</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: "1 1 240px" }}>
              <p className="js-field-label">Location</p>
              <div className="js-chips">
                {Object.entries(LOCATIONS).map(([k, l]) => (
                  <button key={k} className="js-chip" data-on={locs[k]}
                    onClick={() => setLocs((p) => ({ ...p, [k]: !p[k] }))}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="js-seedline">
            searching · {activeQueries.map((q) => q.title).join("  ·  ") || "no titles selected"}
          </p>

          <div className="js-actionbar">
            <button className="js-scan" onClick={runScan} disabled={!canScan}>
              {loading ? "Scanning…" : jobs.length ? "Scan again" : "Scan LinkedIn"}
            </button>
            {loading ? (
              <span className="js-status"><span className="js-dot" />Running the Apify actor — this can take a minute.</span>
            ) : (
              <div className="js-counter"><b>{jobs.length}</b><span>{jobs.length === 1 ? "role found" : "roles found"}</span></div>
            )}
          </div>

          {error && (
            <div className="js-error">
              <b>Scan didn't complete.</b> {error} Try narrowing to a single lane or location, then run it again.
              {raw && <div className="js-raw">{raw}</div>}
            </div>
          )}
        </section>

        <section className="js-results">
          <div className="js-results-head">
            <h2>Results {savedCount > 0 && <span style={{ color: "var(--accent-ink)", fontWeight: 500 }}>· {savedCount} saved</span>}</h2>
            <button className="js-export" onClick={copySaved} disabled={savedCount === 0}>
              {copied ? "Copied ✓" : "Copy saved for outreach"}
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="js-empty">No roles yet. Pick your lanes and locations above, then run a scan.</div>
          ) : (
            jobs.map((j, i) => {
              const key = j.url || j.title + j.company;
              const isSaved = !!saved[key];
              return (
                <article key={key + i} className="js-job" data-saved={isSaved}>
                  <div className="js-job-main">
                    <h3 className="js-job-title">
                      {j.url ? <a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a> : j.title}
                    </h3>
                    <p className="js-job-co">{j.company}</p>
                    <div className="js-job-meta">
                      {j.lane && <span className="js-tag lane">{j.lane}</span>}
                      {j.remote && <span className="js-tag remote">Remote</span>}
                      <span>{j.location}</span>
                      {j.posted && <span>· {j.posted}</span>}
                    </div>
                    {j.snippet && <p className="js-job-snip">{j.snippet}</p>}
                  </div>
                  <button className="js-save" data-saved={isSaved} onClick={() => toggleSave(j)}>
                    {isSaved ? "Saved ✓" : "Save"}
                  </button>
                </article>
              );
            })
          )}
        </section>

        <p className="js-foot">
          Listings come live from a public LinkedIn scraper via Apify — results and freshness depend on the actor and your Apify credits.
          Nothing is emailed from here. When you've saved a batch, hit <b>Copy saved for outreach</b> and paste them back to me:
          I'll draft a genuinely tailored intro per role, pick the right resume angle, and bring each to you for approval before anything sends.
        </p>
      </div>
    </div>
  );
}
