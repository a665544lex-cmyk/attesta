import raw from "../../shared/sample-data.json";

export type Status = "met" | "partial" | "gap" | "not_tested";
export type Severity = "high" | "medium" | "low";

export interface Framework { id: string; name: string; short: string; kind: string; about: string }
export interface OwaspCategory { id: string; name: string; plain: string }
export interface AISystem {
  id: string; name: string; description: string; type: string; typeLabel: string; model: string;
  riskTier: string; riskLabel: string; riskReason: string; personalData: boolean; owner: string;
  status: string; lastRun: string | null; frameworks: string[]; engines: string[];
}
export interface OwaspResult { id: string; tested: number; failed: number; worst: Severity | null }
export interface MlTest { name: string; plugin: string; result: "pass" | "fail" | "warn"; detail: string }
export interface Run {
  id: string; systemId: string; started: string; durationMin: number | null; trigger: string;
  status: string; progress?: number; runner: string; engines: string[]; attacks: number;
  passed: number; failed: number; judgeCostEur: number; owasp?: OwaspResult[]; mlTests?: MlTest[];
}
export interface Finding {
  id: string; runId: string; systemId: string; owasp: string | null; severity: Severity; title: string;
  engine: string; attack: string; prompt: string | null; response: string | null; why: string; fix: string; maps: string[];
}
export interface Requirement { id: string; ref: string; title: string; plain: string }
export interface Questionnaire { id: string; systemId: string | null; framework: string; title: string; answered: number; total: number; due: string }
export interface Runner { id: string; name: string; location: string; status: string; version: string; lastSeen: string }
export interface ApiKey { id: string; label: string; prefix: string; created: string; lastUsed: string }

interface Data {
  organization: { name: string; country: string; sector: string; nis2Entity: string; plan: string };
  frameworks: Framework[];
  owaspCategories: OwaspCategory[];
  systems: AISystem[];
  runs: Run[];
  findings: Finding[];
  requirements: Record<string, Requirement[]>;
  assessments: Record<string, Record<string, Record<string, Status>>>;
  questionnaires: Questionnaire[];
  runners: Runner[];
  apiKeys: ApiKey[];
  history: Record<string, { date: string; failed: number }[]>;
}

export const data = raw as unknown as Data;

export const framework = (id: string) => data.frameworks.find((f) => f.id === id)!;
export const system = (id: string) => data.systems.find((s) => s.id === id);
export const run = (id: string) => data.runs.find((r) => r.id === id);
export const owaspCategory = (id: string) => data.owaspCategories.find((c) => c.id === id)!;

const WEIGHT: Record<string, number> = { met: 1, partial: 0.5, gap: 0 };

export interface Coverage { score: number | null; met: number; partial: number; gap: number; notTested: number; total: number }

export function coverage(statuses: Record<string, Status> | undefined): Coverage {
  const c: Coverage = { score: null, met: 0, partial: 0, gap: 0, notTested: 0, total: 0 };
  if (!statuses) return c;
  const scored: number[] = [];
  for (const s of Object.values(statuses)) {
    c.total++;
    if (s === "met") c.met++;
    else if (s === "partial") c.partial++;
    else if (s === "gap") c.gap++;
    else c.notTested++;
    if (s in WEIGHT) scored.push(WEIGHT[s]);
  }
  if (scored.length) c.score = Math.round((100 * scored.reduce((a, b) => a + b, 0)) / scored.length);
  return c;
}

/** OWASP coverage derived from the latest run: share of attacks that were resisted. */
export function owaspCoverage(systemId: string): Coverage {
  const s = system(systemId);
  const r = s?.lastRun ? run(s.lastRun) : undefined;
  const c: Coverage = { score: null, met: 0, partial: 0, gap: 0, notTested: 0, total: 0 };
  if (!r?.owasp?.length) return c;
  for (const o of r.owasp) {
    c.total++;
    if (o.tested === 0) c.notTested++;
    else if (o.failed === 0) c.met++;
    else if (o.worst === "high") c.gap++;
    else c.partial++;
  }
  const scored = c.met + c.partial + c.gap;
  c.score = scored ? Math.round((100 * (c.met + 0.5 * c.partial)) / scored) : null;
  return c;
}

export function frameworkCoverage(systemId: string, frameworkId: string): Coverage {
  if (frameworkId === "owasp-llm") return owaspCoverage(systemId);
  return coverage(data.assessments[systemId]?.[frameworkId]);
}

/** Organisation-wide coverage for a framework: averages every system it applies to. */
export function orgCoverage(frameworkId: string): Coverage & { systems: number } {
  const out = { score: null as number | null, met: 0, partial: 0, gap: 0, notTested: 0, total: 0, systems: 0 };
  const scores: number[] = [];
  for (const s of data.systems) {
    if (!s.frameworks.includes(frameworkId)) continue;
    const c = frameworkCoverage(s.id, frameworkId);
    if (c.total === 0) continue;
    out.systems++;
    out.met += c.met; out.partial += c.partial; out.gap += c.gap; out.notTested += c.notTested; out.total += c.total;
    if (c.score !== null) scores.push(c.score);
  }
  if (scores.length) out.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return out;
}

export function findingsFor(systemId: string, frameworkId?: string) {
  return data.findings.filter(
    (f) => f.systemId === systemId && (!frameworkId || f.maps.some((m) => m.startsWith(frameworkId + ":")) || (frameworkId === "owasp-llm" && f.owasp)),
  );
}

export function requirementFindings(systemId: string, frameworkId: string, reqId: string) {
  return data.findings.filter((f) => f.systemId === systemId && f.maps.includes(`${frameworkId}:${reqId}`));
}

export const statusLabel: Record<string, string> = {
  met: "Covered",
  partial: "Partly covered",
  gap: "Gap",
  not_tested: "Not tested yet",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
