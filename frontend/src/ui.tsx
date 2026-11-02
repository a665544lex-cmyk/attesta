import React, { createContext, useContext, useEffect, useState } from "react";
import type { Coverage, Severity } from "./data";
import { statusLabel } from "./data";

/* ---------- Tiny hash router ---------- */

export function useRoute(): string[] {
  const read = () => (window.location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => { setParts(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}
export const go = (path: string) => { window.location.hash = path; };

/* ---------- Toast ---------- */

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <ToastCtx.Provider value={setMsg}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}

/* ---------- Hallmark seal ---------- */

let sealId = 0;
export function Seal({ label, score, size = 96 }: { label: string; score: number | null; size?: number }) {
  const [id] = useState(() => `seal${++sealId}`);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = score ?? 0;
  const tone = score === null ? "#9aa5b4" : score >= 80 ? "#2d7a55" : score >= 55 ? "#173a6e" : "#b23a3a";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label}: ${score === null ? "not assessed" : score + "% covered"}`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f6f9" />
          <stop offset="0.45" stopColor="#c3ccd7" />
          <stop offset="0.6" stopColor="#e6eaf0" />
          <stop offset="1" stopColor="#9aa6b5" />
        </linearGradient>
      </defs>
      {/* silver rim */}
      <circle cx="50" cy="50" r="48" fill={`url(#${id}g)`} />
      <circle cx="50" cy="50" r="46.2" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      {/* hallmark beading */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * 2 * Math.PI;
        return <circle key={i} cx={50 + 44.4 * Math.cos(a)} cy={50 + 44.4 * Math.sin(a)} r="0.7" fill="#8592a3" opacity="0.55" />;
      })}
      {/* face */}
      <circle cx="50" cy="50" r="40.5" fill="#fbfcfd" stroke="#aeb8c5" strokeWidth="0.6" />
      {/* score arc */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e3e8ee" strokeWidth="5" />
      {score !== null && (
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={tone} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} transform="rotate(-90 50 50)"
        />
      )}
      <text x="50" y="47" textAnchor="middle" fontFamily="Figtree, sans-serif" fontWeight="700" fontSize="19" fill="#0b1f3a">
        {score === null ? "–" : `${score}%`}
      </text>
      <text x="50" y="63" textAnchor="middle" fontFamily="Figtree, sans-serif" fontWeight="600" fontSize={label.length > 8 ? 8.4 : 9.6} fill="#5a6779">
        {label}
      </text>
    </svg>
  );
}

/* ---------- Bits ---------- */

export function StatusPill({ status }: { status: string }) {
  const cls = status === "met" ? "pill-met" : status === "partial" ? "pill-partial" : status === "gap" ? "pill-gap" : "pill-none";
  return <span className={`pill ${cls}`}>{statusLabel[status] ?? status}</span>;
}

export function Sev({ s }: { s: Severity }) {
  return <span className={`sev sev-${s}`}>{s === "high" ? "High" : s === "medium" ? "Medium" : "Low"}</span>;
}

export function CoverageBar({ c }: { c: Coverage }) {
  if (!c.total) return <div className="bar" />;
  const w = (n: number) => `${(100 * n) / c.total}%`;
  return (
    <div className="bar" aria-label={`${c.met} covered, ${c.partial} partly covered, ${c.gap} gaps, ${c.notTested} not tested`}>
      <span style={{ width: w(c.met), background: "var(--met)" }} />
      <span style={{ width: w(c.partial), background: "#d9a54a" }} />
      <span style={{ width: w(c.gap), background: "var(--gap)" }} />
      <span style={{ width: w(c.notTested), background: "var(--silver)" }} />
    </div>
  );
}

export function CodeBlock({ children }: { children: string }) {
  const toast = useToast();
  return (
    <div className="code-block">
      <button
        className="copy"
        onClick={() => {
          navigator.clipboard?.writeText(children).then(() => toast("Copied to clipboard"), () => toast("Copy isn't available here"));
        }}
      >
        Copy
      </button>
      {children}
    </div>
  );
}

export function BrandMark() {
  const [id] = useState(() => `bm${++sealId}`);
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f4f8" />
          <stop offset="0.5" stopColor="#b8c2cf" />
          <stop offset="1" stopColor="#e2e7ee" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} />
      <circle cx="16" cy="16" r="11" fill="#0b1f3a" />
      <path d="M11 16.5l3.4 3.4L21.5 12.6" fill="none" stroke="#e2e7ee" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
