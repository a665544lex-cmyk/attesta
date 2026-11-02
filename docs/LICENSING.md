# Licensing rules for building Attesta

Checked November 2026. Not legal advice: get a legal review before launch.

## Every build

- Ship the Apache 2.0 licence text and NOTICE files of every bundled project in the runner image, under `/licenses`.
- Mark any upstream file we modify with a prominent notice saying it was changed.
- Don't use "AI Verify", "AI Verify Foundation", "Giskard", NVIDIA or Intel names or logos as our product name or to suggest endorsement. "Built on AI Verify" is fine.
- Keep our own code in separate modules. It can stay proprietary.
- Generate an SBOM and licence report (Syft or Trivy) for every runner build, rather than relying on upstream NOTICE files.

## Upstream code

| Project | Licence | Allowed |
| --- | --- | --- |
| AI Verify test engine and all stock plugins | Apache 2.0 | Bundle, modify, sell |
| Project Moonshot (`moonshot-cicd`, `moonshot`) | Apache 2.0 | Bundle, modify, sell |
| Giskard library (`giskard-oss`) | Apache 2.0 and MIT | Bundle, modify, sell |
| Giskard Hub | Commercial | Not bundled or resold |

## Third-party components

- **Weak copyleft (LGPL, MPL):** num2words, libvips via sharp, certifi, tqdm, axe-core. Use unmodified and keep their notices. libvips/sharp and axe-core only appear in upstream web UIs we don't ship.
- **JavaCPP:** listed only in the old root NOTICE of the `aiverify` repo. Most likely a scanner false positive (no code uses it; the matched files are Python's standard library). Don't ship `aiverify-apigw` unless needed; confirm with our own SBOM.
- **jszip:** dual MIT or GPL v3. We use it under MIT.
- **pyphen (via Giskard):** tri-licensed. We use it under MPL 1.1, unmodified.
- **NVIDIA CUDA libraries and Intel TBB (via PyTorch):** commercial use and redistribution allowed; no modification or reverse engineering; keep their notices.

## Datasets

Ship only an allowlist of verified datasets, with an attribution file listing the source and licence of each.

Excluded from `moonshot-data`:

| Dataset | Reason | Replacement |
| --- | --- | --- |
| m3exam Indonesian, Thai, Vietnamese | CC BY-NC-SA (non-commercial) | INCLUDE or Global-MMLU (Apache 2.0) |
| tamil-tamilnews-classification | GPL v3 | Drop |
| answercarefully (10 files) | Redistribution forbidden | Do-Not-Answer (Apache 2.0), RealHarm (CC-BY-4.0), or our own derived prompts with attribution |
| realtimeqa-past, rag-sample-dataset | No licence | Build our own |
| sg-legal-glossary, sg-university-tutorial-questions-legal | No licence | Build EU and Romanian legal sets |

Rules for kept datasets:

- CC-BY: credit the source in reports and docs.
- CC-BY-SA: modified redistributed versions stay CC-BY-SA.
- Check each against its original source; labels can be wrong (cnn-dailymail is labelled Apache 2.0, but the articles belong to CNN and the Daily Mail).
- All 45 `moonshot-cicd` datasets are commercial-friendly.
