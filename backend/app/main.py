"""Attesta mock API.

Serves the shared sample data so the frontend can move from its built-in
sample data to a real API without changing its screens. Later phases replace
these handlers with the real evidence store, scoring and report services.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

DATA_PATH = Path(__file__).resolve().parents[2] / "shared" / "sample-data.json"

app = FastAPI(title="Attesta API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def load() -> dict[str, Any]:
    with DATA_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


STATUS_WEIGHT = {"met": 1.0, "partial": 0.5, "gap": 0.0}


def score(statuses: dict[str, str]) -> int | None:
    """Coverage score: met = 1, partial = 0.5, gap = 0; not tested is excluded."""
    weights = [STATUS_WEIGHT[s] for s in statuses.values() if s in STATUS_WEIGHT]
    if not weights:
        return None
    return round(100 * sum(weights) / len(weights))


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/organization")
def organization() -> dict[str, Any]:
    return load()["organization"]


@app.get("/api/frameworks")
def frameworks() -> list[dict[str, Any]]:
    return load()["frameworks"]


@app.get("/api/systems")
def systems() -> list[dict[str, Any]]:
    return load()["systems"]


@app.get("/api/systems/{system_id}")
def system(system_id: str) -> dict[str, Any]:
    data = load()
    match = next((s for s in data["systems"] if s["id"] == system_id), None)
    if match is None:
        raise HTTPException(404, f"No AI system with id {system_id}")
    return match


@app.get("/api/runs")
def runs(system_id: str | None = None) -> list[dict[str, Any]]:
    items = load()["runs"]
    return [r for r in items if system_id is None or r["systemId"] == system_id]


@app.get("/api/runs/{run_id}")
def run(run_id: str) -> dict[str, Any]:
    data = load()
    match = next((r for r in data["runs"] if r["id"] == run_id), None)
    if match is None:
        raise HTTPException(404, f"No test run with id {run_id}")
    match["findings"] = [f for f in data["findings"] if f["runId"] == run_id]
    return match


@app.get("/api/findings")
def findings(system_id: str | None = None) -> list[dict[str, Any]]:
    items = load()["findings"]
    return [f for f in items if system_id is None or f["systemId"] == system_id]


@app.get("/api/reports/{system_id}/{framework_id}")
def report(system_id: str, framework_id: str) -> dict[str, Any]:
    data = load()
    statuses = data["assessments"].get(system_id, {}).get(framework_id)
    if statuses is None:
        raise HTTPException(404, "This framework does not apply to this AI system")
    requirements = [
        {**req, "status": statuses.get(req["id"], "not_tested")}
        for req in data["requirements"][framework_id]
    ]
    linked = [
        f
        for f in data["findings"]
        if f["systemId"] == system_id and any(m.startswith(framework_id + ":") for m in f["maps"])
    ]
    return {
        "systemId": system_id,
        "frameworkId": framework_id,
        "score": score(statuses),
        "requirements": requirements,
        "findings": linked,
    }


@app.get("/api/runners")
def runners() -> list[dict[str, Any]]:
    return load()["runners"]


@app.get("/api/api-keys")
def api_keys() -> list[dict[str, Any]]:
    return load()["apiKeys"]


@app.get("/api/questionnaires")
def questionnaires() -> list[dict[str, Any]]:
    return load()["questionnaires"]
