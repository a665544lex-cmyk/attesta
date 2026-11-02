import React, { useState } from "react";
import { LuPlay, LuPlus } from "react-icons/lu";
import { data, framework, frameworkCoverage, run, system, findingsFor, formatDateTime } from "../data";
import { Seal, Sev, go, useToast } from "../ui";
import { FindingList } from "./Runs";

function RiskPill({ tier, label }: { tier: string; label: string }) {
  const cls = tier === "high" ? "pill-gap" : tier === "limited" ? "pill-partial" : tier === "minimal" ? "pill-met" : "pill-none";
  return <span className={`pill ${cls}`}>{label}</span>;
}

export function Systems() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI systems</h1>
          <p>Every AI system you test, what kind it is, and which rules apply to it.</p>
        </div>
        <a className="btn btn-primary" href="#/systems/new"><LuPlus /> Add AI system</a>
      </div>
      <section className="panel">
        <ul className="rows">
          {data.systems.map((s) => {
            const last = s.lastRun ? run(s.lastRun) : undefined;
            return (
              <li key={s.id}>
                <div className="row-main">
                  <a href={`#/systems/${s.id}`}>{s.name}</a>
                  <p>{s.typeLabel}. {s.model}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {s.frameworks.length
                      ? s.frameworks.map((f) => <span key={f} className="tag">{framework(f).short}</span>)
                      : <a href={`#/systems/new`} className="small">Finish setup to see which rules apply</a>}
                  </div>
                </div>
                <div className="row-side" style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <RiskPill tier={s.riskTier} label={s.riskLabel} />
                  <span>{last ? `Tested ${formatDateTime(last.started)}` : "Not tested yet"}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export function SystemDetail({ id }: { id: string }) {
  const s = system(id);
  const toast = useToast();
  const [tab, setTab] = useState<"rules" | "findings" | "runs">("rules");
  if (!s) return <div className="empty"><h3>This AI system doesn't exist</h3><a href="#/systems">Back to AI systems</a></div>;
  const runs = data.runs.filter((r) => r.systemId === id);
  const findings = findingsFor(id);

  return (
    <>
      <div className="crumb"><a href="#/systems">AI systems</a></div>
      <div className="page-head">
        <div>
          <h1>{s.name}</h1>
          <p>{s.description}</p>
        </div>
        <div className="actions">
          {s.status === "setup" ? (
            <a className="btn btn-primary" href="#/systems/new">Finish setup</a>
          ) : (
            <button className="btn btn-primary" onClick={() => { toast("Test run queued on the production runner"); go("/runs/run-1043"); }}>
              <LuPlay /> Start test run
            </button>
          )}
        </div>
      </div>

      <section className={`verdict ${s.riskTier === "high" ? "high" : ""}`} style={{ marginBottom: 24 }}>
        <strong>{s.riskLabel}.</strong> {s.riskReason}
        <div className="small muted" style={{ marginTop: 6 }}>
          {s.typeLabel}, {s.model}. Owner: {s.owner}.{s.personalData ? " Processes personal data." : ""}
        </div>
      </section>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "rules"} onClick={() => setTab("rules")}>Rules that apply</button>
        <button role="tab" aria-selected={tab === "findings"} onClick={() => setTab("findings")}>Findings ({findings.length})</button>
        <button role="tab" aria-selected={tab === "runs"} onClick={() => setTab("runs")}>Test runs ({runs.length})</button>
      </div>

      {tab === "rules" && (
        s.frameworks.length ? (
          <div className="seals">
            {s.frameworks.map((f) => (
              <a key={f} className="seal" href={`#/reports/${f}/${s.id}`}>
                <Seal label={framework(f).short} score={frameworkCoverage(s.id, f).score} />
                <span className="seal-name">{framework(f).name}</span>
                <span className="seal-note">Open report</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="panel empty">
            <h3>No rules assigned yet</h3>
            <p>Answer the classification questions and we'll work out which laws and standards apply.</p>
            <p style={{ marginTop: 14 }}><a className="btn btn-primary" href="#/systems/new">Classify this system</a></p>
          </div>
        )
      )}

      {tab === "findings" && (
        <section className="panel">
          {findings.length ? <FindingList findings={findings} /> : <div className="empty"><h3>No findings yet</h3><p>Findings appear here after the first test run.</p></div>}
        </section>
      )}

      {tab === "runs" && (
        <section className="panel">
          {runs.length ? (
            <ul className="rows">
              {runs.map((r) => (
                <li key={r.id}>
                  <div className="row-main">
                    <a href={`#/runs/${r.id}`}>{formatDateTime(r.started)}</a>
                    <p>{r.trigger}. {r.engines.join(", ")}</p>
                  </div>
                  <div className="row-side">{r.status === "running" ? `${r.progress}% done` : `${r.failed} failed`}</div>
                </li>
              ))}
            </ul>
          ) : <div className="empty"><h3>No test runs yet</h3><p>Connect a runner and start the first run.</p></div>}
        </section>
      )}
    </>
  );
}

/* ---------- Add AI system wizard ---------- */

const USES = [
  { id: "credit", label: "Credit, insurance pricing or essential services", tier: "high" },
  { id: "hr", label: "Hiring, promotion or managing workers", tier: "high" },
  { id: "education", label: "Admissions, exams or grading", tier: "high" },
  { id: "chat", label: "Talks to customers or the public", tier: "limited" },
  { id: "content", label: "Generates images, audio or text for publication", tier: "limited" },
  { id: "internal", label: "Internal tool with no decisions about people", tier: "minimal" },
];

const STEP_NAMES = ["Describe", "Classify", "Rules and tests", "Connect runner"];

export function AddSystem() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Document intake agent");
  const [kind, setKind] = useState("agent");
  const [desc, setDesc] = useState(system("sys-intake")!.description);
  const [uses, setUses] = useState<string[]>(["credit"]);
  const [personal, setPersonal] = useState("yes");
  const [product, setProduct] = useState("no");

  const tier = uses.some((u) => USES.find((x) => x.id === u)!.tier === "high")
    ? "high" : uses.some((u) => USES.find((x) => x.id === u)!.tier === "limited") ? "limited" : "minimal";

  const rules = [
    { id: "eu-ai-act", why: tier === "high" ? "High-risk use listed in Annex III" : tier === "limited" ? "Transparency duties for systems that interact with people" : "Minimal risk: voluntary codes, AI literacy" },
    ...(personal === "yes" ? [{ id: "gdpr", why: "It processes personal data" }] : []),
    ...(product === "yes" ? [{ id: "cra", why: "Sold to customers as software" }] : []),
    { id: "nis2", why: `${data.organization.name} is an important entity in ${data.organization.sector.toLowerCase()}` },
    { id: "iso42001", why: "Recommended for audit readiness" },
    ...(kind !== "ml" ? [{ id: "owasp-llm", why: "LLM-based, so the LLM security risks apply" }] : [{ id: "nist-ai-rmf", why: "Measurement practices for ML models" }]),
  ];

  const tests = kind === "ml"
    ? ["AI Verify fairness metrics", "SHAP explanations", "Robustness to input changes", "Performance drift (Veritas)"]
    : ["Moonshot benchmarks: hallucination, harmful content, data disclosure", "Moonshot and Giskard red-teaming mapped to OWASP LLM Top 10",
       ...(kind === "agent" ? ["Agent tool-misuse and excessive agency tests"] : []), "SBOM and dependency scan (Syft, Trivy)"];

  const toggleUse = (id: string) => setUses((u) => (u.includes(id) ? u.filter((x) => x !== id) : [...u, id]));

  return (
    <>
      <div className="crumb"><a href="#/systems">AI systems</a></div>
      <div className="page-head"><div><h1>Add an AI system</h1><p>Four short steps. You can change any answer later.</p></div></div>

      <ol className="steps" aria-label="Progress">
        {STEP_NAMES.map((n, i) => (
          <li key={n} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>{n}</li>
        ))}
      </ol>

      <section className="panel panel-pad" style={{ maxWidth: 760 }}>
        {step === 0 && (
          <>
            <div className="field">
              <label htmlFor="n">Name</label>
              <input id="n" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <fieldset>
              <legend>What kind of AI system is it?</legend>
              <div className="choices">
                {[
                  ["llm", "LLM application", "A chatbot or assistant built on a language model"],
                  ["agent", "AI agent", "An LLM that can call tools or APIs and take actions"],
                  ["ml", "Classic machine-learning model", "Scoring, classification or prediction from tabular or image data"],
                ].map(([v, b, t]) => (
                  <label key={v} className="choice">
                    <input type="radio" name="kind" checked={kind === v} onChange={() => setKind(v)} />
                    <div><b>{b}</b><span>{t}</span></div>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="d">What does it do?</label>
              <textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <span className="hint">Plain words are best. This text goes into the technical documentation section of your reports.</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset>
              <legend>What is it used for? Pick all that apply.</legend>
              <div className="choices">
                {USES.map((u) => (
                  <label key={u.id} className="choice">
                    <input type="checkbox" checked={uses.includes(u.id)} onChange={() => toggleUse(u.id)} />
                    <div><b>{u.label}</b></div>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Does it process personal data?</legend>
              <div className="choices">
                {["yes", "no"].map((v) => (
                  <label key={v} className="choice"><input type="radio" name="pd" checked={personal === v} onChange={() => setPersonal(v)} /><div><b>{v === "yes" ? "Yes" : "No"}</b></div></label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Do you sell it to other companies as a product?</legend>
              <div className="choices">
                {["yes", "no"].map((v) => (
                  <label key={v} className="choice"><input type="radio" name="pr" checked={product === v} onChange={() => setProduct(v)} /><div><b>{v === "yes" ? "Yes" : "No, we use it ourselves"}</b></div></label>
                ))}
              </div>
            </fieldset>
            <div className={`verdict ${tier === "high" ? "high" : ""}`}>
              <strong>{tier === "high" ? "High risk" : tier === "limited" ? "Limited risk" : "Minimal risk"} under the EU AI Act.</strong>{" "}
              {tier === "high" ? "The full set of requirements in Articles 9 to 15 applies, plus a conformity assessment before use."
                : tier === "limited" ? "People must be told they're dealing with AI (Article 50)."
                : "No mandatory requirements beyond AI literacy, but testing still helps."}
              <div className="small muted" style={{ marginTop: 6 }}>This is a first assessment to guide your testing, not legal advice.</div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Rules that apply</h2>
            <p className="muted small" style={{ marginBottom: 12 }}>Each one becomes a separate report.</p>
            <ul className="rows" style={{ border: "1px solid var(--rule)", borderRadius: 10, marginBottom: 22 }}>
              {rules.map((r) => (
                <li key={r.id}><div className="row-main"><b>{framework(r.id).name}</b><p>{r.why}</p></div></li>
              ))}
            </ul>
            <h2 style={{ marginBottom: 6 }}>Tests we'll run</h2>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 4 }}>
              {tests.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="small muted" style={{ marginTop: 14 }}>
              Some requirements can't be tested automatically, such as your incident process. We'll add short questionnaires for those.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Connect it to a runner</h2>
            <p className="muted" style={{ marginBottom: 16 }}>
              Tests run inside your own infrastructure. Your model and data stay with you; only results come back.
            </p>
            <fieldset>
              <legend>Which runner should test it?</legend>
              <div className="choices">
                {data.runners.map((r, i) => (
                  <label key={r.id} className="choice">
                    <input type="radio" name="runner" defaultChecked={i === 0} />
                    <div><b>{r.name}</b><span>{r.location}</span></div>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="ep">Model endpoint the runner should call</label>
              <input id="ep" type="text" defaultValue="https://intake-agent.internal.northwind.ro/v1/chat" />
              <span className="hint">The runner reaches this inside your network. We never see it from outside.</span>
            </div>
          </>
        )}

        <div className="actions" style={{ marginTop: 8, justifyContent: "space-between" }}>
          <button className="btn btn-quiet" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={step === 1 && uses.length === 0}>Continue</button>
          ) : (
            <button className="btn btn-primary" onClick={() => { toast(`${name} added. First test run scheduled.`); go("/systems"); }}>Add AI system</button>
          )}
        </div>
      </section>
    </>
  );
}
