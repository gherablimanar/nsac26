# Backend responsibilities

## Browser

The React/TypeScript app owns check-ins, local per-crew history, body-map rendering,
trends, timed cognition tests, baseline comparisons and coupling rules. PWA storage,
offline guidance and the user-approved outbox also need browser-side implementation.
Existing TypeScript scoring remains in `src/engine`; do not duplicate it in Python.

## Backend

- `api/v1/endpoints`: HTTP endpoints that delegate work to services.
- `schemas`: explicit request and response models, matching agreed frontend fields.
- `adapters`: translate simulator records and preserve simulation labels.
- `providers`: NASA ingestion, normalization, caching and protected model calls.
- `services`: evidence search, data-quality review, explanation and report workflows.
- `resources`: reviewed evidence, limitations and action-card content.
- `core`: configuration, future authentication, logging and request controls.

All feature modules are reserved in this scaffold. Only service liveness is wired.

## Planned request flow

Browser context -> schema validation -> provenance/freshness checks -> structured
symptom routing -> evidence retrieval -> optional model explanation -> structured
response with uncertainty and human-review guidance. Urgent human review must not
depend on a successful model call. Symptom routing still needs domain review and is
not a guarantee that every emergency will be detected.

No custom ML training is planned. A future hosted language model is an explanation
tool, not a validated clinical predictor. The hosted backend requires connectivity;
on-device monitoring and bundled guidance must continue independently.

Before storing health or mental-health records, agree on access controls, retention
and ownership. No patient database or communications transport is chosen by this
scaffold. A report draft is not approval to send it.
