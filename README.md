# Attesta

Attesta (working name) tests AI systems and turns the results into readiness reports for the EU AI Act, GDPR, the Cyber Resilience Act, NIS2, ISO/IEC 42001, NIST AI RMF and the OWASP Top 10 for LLM Applications.

Tests run inside the customer's own infrastructure through a small runner container. Only results come back; the reports are built on our side.

> **Status: clickable prototype.** The screens use realistic sample data from `shared/sample-data.json`. Nothing calls a real model yet.

## What's in the prototype

| Screen | What it shows |
| --- | --- |
| Overview | A silver hallmark seal per law or standard, the findings to fix first, live runs, trend, questionnaires due |
| AI systems | Every system, its risk tier and the rules that apply |
| Add an AI system | Four steps: describe, classify (EU AI Act risk tier), rules and tests, connect a runner |
| Test runs | Run history, live progress, OWASP LLM results, AI Verify tests and findings with test input and answer |
| Reports | A separate readiness report per law or standard and per system, with every requirement, its evidence and what to do next; prints to PDF |
| Evidence | Questionnaires and documents for requirements tests can't prove |
| Runner and keys | Runner status, install command and API keys |

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, rebuilds on change
npm run build      # writes dist/index.html, one self-contained file
```

The mock API (optional for now; the frontend uses the sample data directly):

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000/docs
```

## Layout

```
frontend/   React + TypeScript UI, bundled with esbuild
backend/    FastAPI mock API serving the same sample data
shared/     sample-data.json, the single source for both
docs/       architecture and licensing notes
```

## Next steps

1. Replace the sample data with the real evidence store and scoring service.
2. Build the runner image on `moonshot-cicd`, AI Verify, Giskard, Syft and Trivy.
3. Write the compliance mappings (requirement to tests) for each framework.
4. Questionnaire editor and document upload.

See `docs/LICENSING.md` before adding any third-party tool or dataset.
