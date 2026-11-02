import React, { useState } from "react";
import { LuLayoutDashboard, LuBot, LuFlaskConical, LuFileCheck2, LuFolderCheck, LuServer, LuMenu } from "react-icons/lu";
import { data } from "./data";
import { BrandMark, ToastProvider, useRoute } from "./ui";
import { Overview } from "./pages/Overview";
import { AddSystem, SystemDetail, Systems } from "./pages/Systems";
import { RunDetail, Runs } from "./pages/Runs";
import { FrameworkReports, ReportDetail, Reports } from "./pages/Reports";
import { Evidence, RunnerSetup } from "./pages/Setup";

const NAV = [
  { href: "", label: "Overview", icon: LuLayoutDashboard },
  { href: "systems", label: "AI systems", icon: LuBot },
  { href: "runs", label: "Test runs", icon: LuFlaskConical },
  { href: "reports", label: "Reports", icon: LuFileCheck2 },
  { href: "evidence", label: "Evidence", icon: LuFolderCheck },
  { href: "runner", label: "Runner and keys", icon: LuServer },
];

function Page({ parts }: { parts: string[] }) {
  const [a, b, c] = parts;
  switch (a) {
    case undefined: return <Overview />;
    case "systems": return b === "new" ? <AddSystem /> : b ? <SystemDetail id={b} /> : <Systems />;
    case "runs": return b ? <RunDetail id={b} /> : <Runs />;
    case "reports": return c ? <ReportDetail fw={b} sys={c} /> : b ? <FrameworkReports fw={b} /> : <Reports />;
    case "evidence": return <Evidence />;
    case "runner": return <RunnerSetup />;
    default: return <div className="empty"><h3>Page not found</h3><a href="#/">Go to the overview</a></div>;
  }
}

export function App() {
  const parts = useRoute();
  const [open, setOpen] = useState(false);
  const section = parts[0] ?? "";
  return (
    <ToastProvider>
      <div className="topbar">
        <span className="brand" style={{ padding: 0 }}><BrandMark /> Attesta</span>
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="sidebar"><LuMenu /> Menu</button>
      </div>
      <div className="shell">
        <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <div className="brand"><BrandMark /> Attesta</div>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.href} href={`#/${n.href}`} className={section === n.href ? "active" : ""} aria-current={section === n.href ? "page" : undefined}>
                <n.icon aria-hidden="true" /> {n.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-foot">
            <strong>{data.organization.name}</strong>
            {data.organization.plan} plan
          </div>
        </aside>
        <main className="main">
          <Page parts={parts} />
        </main>
      </div>
    </ToastProvider>
  );
}
