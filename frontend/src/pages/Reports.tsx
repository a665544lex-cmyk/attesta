import React from "react";
import { LuDownload, LuShare2 } from "react-icons/lu";
import {
  data, framework, frameworkCoverage, owaspCategory, requirementFindings, run, system, findingsFor,
  formatDate, type Status,
} from "../data";
import { CoverageBar, Seal, StatusPill, useToast } from "../ui";
import { FindingList } from "./Runs";

declare const __PREVIEW__: boolean;

export function Reports() {
  const systems = data.systems.filter((s) => s.frameworks.length);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>A separate report for every law and standard, for each AI system it applies to. Open one to see each requirement and the evidence behind it.</p>
        </div>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Law or standard</th>{systems.map((s) => <th key={s.id}>{s.name}</th>)}</tr>
          </thead>
          <tbody>
            {data.frameworks.map((f) => (
              <tr key={f.id}>
                <td><a href={`#/reports/${f.id}`}><b>{f.name}</b></a><div className="small muted" style={{ maxWidth: 340 }}>{f.about}</div></td>
                {systems.map((s) => {
                  if (!s.frameworks.includes(f.id)) return <td key={s.id} className="muted small">Doesn't apply</td>;
                  const c = frameworkCoverage(s.id, f.id);
                  return (
                    <td key={s.id} style={{ minWidth: 170 }}>
                      <a href={`#/reports/${f.id}/${s.id}`}><b>{c.score ?? "–"}%</b> covered</a>
                      <div style={{ margin: "6px 0 4px" }}><CoverageBar c={c} /></div>
                      <span className="small muted">{c.gap === 0 ? "No gaps" : `${c.gap} gap${c.gap === 1 ? "" : "s"}`}, {c.partial} partial</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function FrameworkReports({ fw }: { fw: string }) {
  const f = framework(fw);
  if (!f) return null;
  const systems = data.systems.filter((s) => s.frameworks.includes(fw));
  return (
    <>
      <div className="crumb"><a href="#/reports">Reports</a></div>
      <div className="page-head"><div><h1>{f.name}</h1><p>{f.about}</p></div></div>
      <div className="seals">
        {systems.map((s) => (
          <a key={s.id} className="seal" href={`#/reports/${fw}/${s.id}`}>
            <Seal label={f.short} score={frameworkCoverage(s.id, fw).score} />
            <span className="seal-name">{s.name}</span>
            <span className="seal-note">Open report</span>
          </a>
        ))}
      </div>
    </>
  );
}

interface Row { id: string; ref: string; title: string; plain: string; status: Status; evidence: string }

function rowsFor(fw: string, sys: string): Row[] {
  if (fw === "owasp-llm") {
    const r = run(system(sys)!.lastRun!);
    return (r?.owasp ?? []).map((o) => {
      const c = owaspCategory(o.id);
      const status: Status = o.tested === 0 ? "not_tested" : o.failed === 0 ? "met" : o.worst === "high" ? "gap" : "partial";
      return { id: o.id, ref: o.id, title: c.name, plain: c.plain, status, evidence: o.tested ? `${o.tested - o.failed} of ${o.tested} attacks resisted` : "Needs questionnaire" };
    });
  }
  const statuses = data.assessments[sys]?.[fw] ?? {};
  return (data.requirements[fw] ?? []).map((req) => {
    const status = (statuses[req.id] ?? "not_tested") as Status;
    const n = requirementFindings(sys, fw, req.id).length;
    const evidence = n ? `${n} finding${n > 1 ? "s" : ""} from tests` : status === "met" ? "Tests and questionnaire" : status === "not_tested" ? "Nothing collected yet" : "Questionnaire answers";
    return { ...req, status, evidence };
  });
}

export function ReportDetail({ fw, sys }: { fw: string; sys: string }) {
  const toast = useToast();
  const f = framework(fw);
  const s = system(sys);
  if (!f || !s || !s.frameworks.includes(fw)) {
    return <div className="empty"><h3>This report doesn't exist</h3><a href="#/reports">Back to reports</a></div>;
  }
  const c = frameworkCoverage(sys, fw);
  const rows = rowsFor(fw, sys);
  const findings = findingsFor(sys, fw);
  const last = s.lastRun ? run(s.lastRun) : undefined;
  const order: Record<string, number> = { gap: 0, partial: 1, not_tested: 2, met: 3 };
  const toFix = rows.filter((r) => r.status === "gap" || r.status === "partial").sort((a, b) => order[a.status] - order[b.status]);

  return (
    <>
      <div className="crumb no-print"><a href="#/reports">Reports</a> / <a href={`#/reports/${fw}`}>{f.short}</a></div>
      <div className="page-head">
        <div>
          <h1>{f.name} readiness report</h1>
          <p>{s.name}, {data.organization.name}. Based on evidence up to {last ? formatDate(last.started) : "today"}.</p>
        </div>
        <div className="actions no-print">
          <button className="btn btn-quiet" onClick={() => toast("Share link copied. It expires in 30 days.")}><LuShare2 /> Share with auditor</button>
          <button
            className="btn btn-primary"
            onClick={() => (__PREVIEW__ ? toast("PDF export runs on the server in the full version") : window.print())}
          >
            <LuDownload /> Download PDF
          </button>
        </div>
      </div>

      <section className="panel panel-pad">
        <div className="report-cover">
          <Seal label={f.short} score={c.score} size={132} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ marginBottom: 8 }}>
              {c.gap === 0 && c.partial === 0 ? "Every requirement is covered." : `${c.gap} gap${c.gap === 1 ? "" : "s"} and ${c.partial} partly covered requirement${c.partial === 1 ? "" : "s"} to work on.`}
            </h2>
            <div style={{ margin: "10px 0" }}><CoverageBar c={c} /></div>
            <div className="legend">
              <span>{c.met} covered</span><span>{c.partial} partly covered</span><span>{c.gap} gap{c.gap === 1 ? "" : "s"}</span>{c.notTested > 0 && <span>{c.notTested} not tested yet</span>}
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>
              This report shows readiness for an audit or self-assessment. It is not a certificate or legal opinion.
            </p>
          </div>
        </div>
      </section>

      {toFix.length > 0 && (
        <section className="section">
          <h2>What to do next</h2>
          <div className="panel">
            <ul className="rows">
              {toFix.map((r) => (
                <li key={r.id}>
                  <StatusPill status={r.status} />
                  <div className="row-main"><b>{r.ref}: {r.title}</b><p>{r.plain} Evidence so far: {r.evidence.toLowerCase()}.</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <h2>Every requirement</h2>
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Requirement</th><th>Evidence</th><th className="num">Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}><b>{r.ref}</b></td>
                  <td><b>{r.title}</b><div className="small muted">{r.plain}</div></td>
                  <td className="small">{r.evidence}</td>
                  <td className="num"><StatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {findings.length > 0 && (
        <section className="section">
          <h2>Findings behind this report</h2>
          <div className="panel"><FindingList findings={findings} /></div>
        </section>
      )}

      <p className="small muted section">
        Test engines: {s.engines.join(", ")}. Datasets are credited in the attribution annex. Built on open-source tools including AI Verify, Project Moonshot and Giskard.
      </p>
    </>
  );
}
