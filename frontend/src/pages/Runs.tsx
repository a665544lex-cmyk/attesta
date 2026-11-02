import React, { useEffect, useState } from "react";
import { data, framework, owaspCategory, run as getRun, system, formatDateTime, type Finding } from "../data";
import { Sev, useToast } from "../ui";

export function FindingList({ findings }: { findings: Finding[] }) {
  return (
    <div>
      {findings.map((f) => (
        <article key={f.id} className="finding">
          <div className="finding-head">
            <Sev s={f.severity} />
            {f.owasp && <span className="tag">{f.owasp} {owaspCategory(f.owasp).name}</span>}
            <span className="small muted">Found by {f.engine}: {f.attack}</span>
          </div>
          <h3>{f.title}</h3>
          {f.prompt && (
            <div className="exchange">
              <div className="q"><b>Test input</b>{f.prompt}</div>
              <div className="a"><b>System answered</b>{f.response}</div>
            </div>
          )}
          <p className="small" style={{ margin: "8px 0" }}>{f.why}</p>
          <p className="fix"><b>How to fix:</b> {f.fix}</p>
          <p className="small muted" style={{ marginTop: 8 }}>
            Evidence for: {f.maps.map((m) => {
              const [fw, req] = m.split(":");
              const r = data.requirements[fw]?.find((x) => x.id === req);
              return `${framework(fw).short} ${r?.ref ?? req}`;
            }).join(", ")}
          </p>
        </article>
      ))}
    </div>
  );
}

export function Runs() {
  const toast = useToast();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Test runs</h1>
          <p>Each run executes inside your infrastructure. Only results and short example answers come back.</p>
        </div>
        <button className="btn btn-primary" onClick={() => toast("Choose an AI system to test from its page")}>Start a test run</button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Started</th><th>AI system</th><th>Why it ran</th><th>Engines</th><th className="num">Result</th></tr>
            </thead>
            <tbody>
              {[...data.runs].sort((a, b) => b.started.localeCompare(a.started)).map((r) => (
                <tr key={r.id}>
                  <td><a href={`#/runs/${r.id}`}>{formatDateTime(r.started)}</a></td>
                  <td>{system(r.systemId)!.name}</td>
                  <td className="muted">{r.trigger}</td>
                  <td className="muted">{r.engines.join(", ")}</td>
                  <td className="num">
                    {r.status === "running" ? <span className="pill pill-none">Running, {r.progress}%</span>
                      : r.failed === 0 ? <span className="pill pill-met">All passed</span>
                      : <span className={`pill ${r.failed > 50 ? "pill-gap" : "pill-partial"}`}>{r.failed} failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LiveProgress({ start }: { start: number }) {
  const [p, setP] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setP((v) => (v >= 99 ? 99 : v + 1)), 900);
    return () => clearInterval(t);
  }, []);
  const stages = ["Fetching test plan", "Benchmarks", "Red-teaming", "Scoring answers", "Uploading results"];
  const stage = Math.min(stages.length - 1, Math.floor((p / 100) * stages.length));
  return (
    <section className="panel panel-pad">
      <h2 style={{ marginBottom: 10 }}>{stages[stage]}</h2>
      <div className="progress"><span style={{ width: `${p}%` }} /></div>
      <p className="small muted" style={{ marginTop: 8 }}>{p}% done. Results appear here as soon as the runner uploads them.</p>
      <ol className="steps" style={{ marginTop: 20, marginBottom: 0 }}>
        {stages.map((s, i) => <li key={s} className={i < stage ? "done" : i === stage ? "current" : ""}>{s}</li>)}
      </ol>
    </section>
  );
}

export function RunDetail({ id }: { id: string }) {
  const r = getRun(id);
  if (!r) return <div className="empty"><h3>This test run doesn't exist</h3><a href="#/runs">Back to test runs</a></div>;
  const s = system(r.systemId)!;
  const findings = data.findings.filter((f) => f.runId === id);

  return (
    <>
      <div className="crumb"><a href="#/runs">Test runs</a></div>
      <div className="page-head">
        <div>
          <h1>{s.name}</h1>
          <p>{formatDateTime(r.started)}. {r.trigger}. Ran on {data.runners.find((x) => x.id === r.runner)?.name.toLowerCase()} using {r.engines.join(", ")}.</p>
        </div>
        <a className="btn btn-quiet" href={`#/systems/${s.id}`}>View AI system</a>
      </div>

      {r.status === "running" ? <LiveProgress start={r.progress ?? 0} /> : (
        <>
          <section className="panel panel-pad">
            <div className="stats">
              {r.attacks > 0 && <div className="stat"><strong>{r.attacks.toLocaleString("en-GB")}</strong><span>test inputs sent</span></div>}
              <div className="stat"><strong>{r.passed.toLocaleString("en-GB")}</strong><span>passed</span></div>
              <div className="stat"><strong style={{ color: r.failed ? "var(--gap)" : undefined }}>{r.failed}</strong><span>failed</span></div>
              <div className="stat"><strong>{r.durationMin} min</strong><span>duration</span></div>
              {r.judgeCostEur > 0 && <div className="stat"><strong>€{r.judgeCostEur.toFixed(2)}</strong><span>scoring cost</span></div>}
            </div>
          </section>

          {r.owasp && r.owasp.length > 0 && (
            <section className="section">
              <h2>Results by OWASP LLM risk</h2>
              <div className="owasp">
                {r.owasp.map((o) => {
                  const c = owaspCategory(o.id);
                  const cls = o.tested === 0 ? "" : o.worst === "high" ? "bad" : o.failed ? "warn" : "";
                  return (
                    <div key={o.id} className={`owasp-cell ${cls}`}>
                      <div className="code">{o.id}</div>
                      <h3>{c.name}</h3>
                      <p>{c.plain}</p>
                      <div className="result">
                        {o.tested === 0 ? <span className="pill pill-none">Not tested yet</span>
                          : o.failed === 0 ? <span className="pill pill-met">All {o.tested} resisted</span>
                          : <span className={`pill ${o.worst === "high" ? "pill-gap" : "pill-partial"}`}>{o.failed} of {o.tested} failed</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {r.owasp.some((o) => o.tested === 0) && (
                <p className="small muted" style={{ marginTop: 10 }}>
                  Data and model poisoning can't be tested from outside. Answer the data provenance questions in Evidence to cover it.
                </p>
              )}
            </section>
          )}

          {r.mlTests && (
            <section className="section">
              <h2>AI Verify tests</h2>
              <div className="panel table-wrap">
                <table>
                  <thead><tr><th>Test</th><th>Plugin</th><th>What we found</th><th className="num">Result</th></tr></thead>
                  <tbody>
                    {r.mlTests.map((t) => (
                      <tr key={t.name}>
                        <td><b>{t.name}</b></td>
                        <td className="muted">{t.plugin}</td>
                        <td>{t.detail}</td>
                        <td className="num"><span className={`pill ${t.result === "pass" ? "pill-met" : t.result === "warn" ? "pill-partial" : "pill-gap"}`}>{t.result === "pass" ? "Passed" : t.result === "warn" ? "Check" : "Failed"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="section">
            <h2>Findings</h2>
            <div className="panel">
              {findings.length ? <FindingList findings={findings} /> : <div className="empty"><h3>No findings in this run</h3></div>}
            </div>
          </section>
        </>
      )}
    </>
  );
}
