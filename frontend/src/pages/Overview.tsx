import React from "react";
import { LuPlay, LuPlus } from "react-icons/lu";
import { data, framework, orgCoverage, system, formatDateTime } from "../data";
import { Seal, Sev } from "../ui";

function TrendChart() {
  const pts = data.history["sys-support"];
  const max = Math.max(...pts.map((p) => p.failed));
  const W = 420, H = 140, pad = 26;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.failed)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Failed attacks fell from 164 to 79 over five weekly runs">
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="var(--rule)" />
      <path d={path} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={p.date}>
          <circle cx={x(i)} cy={y(p.failed)} r="4" fill="#fff" stroke="var(--blue)" strokeWidth="2" />
          <text x={x(i)} y={y(p.failed) - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--abyss)">{p.failed}</text>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11.5" fill="var(--slate)">{p.date}</text>
        </g>
      ))}
    </svg>
  );
}

export function Overview() {
  const sevRank = { high: 0, medium: 1, low: 2 };
  const top = [...data.findings].sort((a, b) => sevRank[a.severity] - sevRank[b.severity]).slice(0, 5);
  const running = data.runs.find((r) => r.status === "running");
  const due = [...data.questionnaires].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const tested = data.systems.filter((s) => s.lastRun).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{data.organization.name}</h1>
          <p>
            {data.systems.length} AI systems registered, {tested} tested. Here's how ready you are for each law and
            standard that applies to them.
          </p>
        </div>
        <div className="actions">
          <a className="btn btn-quiet" href="#/systems/new"><LuPlus /> Add AI system</a>
          <a className="btn btn-primary" href="#/runs"><LuPlay /> Run tests</a>
        </div>
      </div>

      <section className="seal-band" aria-labelledby="where">
        <div className="seal-band-head">
          <h2 id="where">Where you stand</h2>
          <p>Share of requirements covered by evidence, across all systems each one applies to.</p>
        </div>
        <div className="seals">
          {data.frameworks.map((f) => {
            const c = orgCoverage(f.id);
            return (
              <a key={f.id} className="seal" href={`#/reports/${f.id}`}>
                <Seal label={f.short} score={c.score} />
                <span className="seal-name">{f.name}</span>
                <span className="seal-note">{c.gap ? `${c.gap} gap${c.gap > 1 ? "s" : ""} to close` : c.systems ? "No gaps" : "Not assessed"}</span>
              </a>
            );
          })}
        </div>
      </section>

      <div className="grid-2 section">
        <section className="panel" aria-labelledby="fix">
          <div className="panel-head">
            <h2 id="fix">Fix these first</h2>
            <p>From the latest test runs</p>
          </div>
          <ul className="rows">
            {top.map((f) => {
              const s = system(f.systemId)!;
              return (
                <li key={f.id}>
                  <Sev s={f.severity} />
                  <div className="row-main">
                    <a href={`#/runs/${f.runId}`}>{f.title}</a>
                    <p>{s.name}{f.owasp ? `, ${f.owasp}` : ""}. Affects {[...new Set(f.maps.map((m) => framework(m.split(":")[0]).short))].join(", ")}.</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
          {running && (
            <section className="panel panel-pad" aria-labelledby="now">
              <h2 id="now" style={{ marginBottom: 6 }}>Running now</h2>
              <p className="muted small" style={{ marginBottom: 12 }}>
                {system(running.systemId)!.name}, started {formatDateTime(running.started)}
              </p>
              <div className="progress"><span style={{ width: `${running.progress}%` }} /></div>
              <p className="small" style={{ marginTop: 8 }}>
                {running.progress}% done. <a href={`#/runs/${running.id}`}>Watch progress</a>
              </p>
            </section>
          )}

          <section className="panel panel-pad" aria-labelledby="trend">
            <h2 id="trend">Customer support assistant is getting safer</h2>
            <p className="muted small" style={{ margin: "4px 0 10px" }}>Failed attacks per weekly run, out of 1,860</p>
            <TrendChart />
          </section>

          <section className="panel" aria-labelledby="due">
            <div className="panel-head"><h2 id="due">Questions waiting for you</h2></div>
            <ul className="rows">
              {due.map((q) => (
                <li key={q.id}>
                  <div className="row-main">
                    <a href="#/evidence">{q.title}</a>
                    <p>{q.answered} of {q.total} answered, for {framework(q.framework).short}</p>
                  </div>
                  <div className="row-side">Due {new Date(q.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
