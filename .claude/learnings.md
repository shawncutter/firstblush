---
# MyFamilyDevices Session Learnings
# Session: Phase 0 Baseline Fixes (2026-02-04)

---
id: 001
timestamp: 2026-02-04T00:00:00Z
session: phase0-baseline
category: discovery
trigger: "Implementing dual-path API routing for backward compatibility"
learning: |
  APIPathRewriteMiddleware pattern allows transparent path rewriting in FastAPI.
  Place before other middlewares. Rewrites /api/v1/* to /v1/* in request.scope['path']
  while preserving both route paths. Enables gradual API migration without client changes.
context: |
  Used for MyFamilyDevices migration from /api/v1 to /v1 endpoint structure.
  Allows web dashboard using old paths to work while new clients use /v1.
keywords: fastapi, middleware, routing, path rewriting, backward compatibility
confidence: high
source: implementation
applied: 1
---

id: 002
timestamp: 2026-02-04T00:00:00Z
session: phase0-baseline
category: discovery
trigger: "Solving missing analytics data due to late events"
learning: |
  Watermark-based incremental processing pattern handles data backfill reliably.
  Store last_processed_date in database (RollupWatermark model).
  Each task processes from watermark to today, then updates watermark.
  Handles late events, worker downtime, and manual backfill in single pattern.
context: |
  Critical for any aggregation system (rollups, analytics, reporting).
  Must create helper functions for single-date computation to reuse in backfill and regular processing.
keywords: database pattern, incremental processing, backfill, watermark, data quality
confidence: high
source: implementation
applied: 1
---

id: 003
timestamp: 2026-02-04T00:00:00Z
session: phase0-baseline
category: discovery
trigger: "Consolidating scattered Celery configuration across multiple files"
learning: |
  Use Pydantic BaseModel for CelerySettings within main Settings.
  All schedule intervals in one place: CelerySettings model in config.py.
  Reference via settings.celery.poll_sheet_interval instead of hardcoded values.
  Single source of truth prevents configuration divergence.
context: |
  Prevents duplicate configuration across worker.py and celery_config.py.
  Enables environment variable override for all intervals.
  Pattern applies to any service with scattered configuration.
keywords: configuration, pydantic, celery, single source of truth
confidence: high
source: implementation
applied: 1
---

id: 004
timestamp: 2026-02-04T00:00:00Z
session: phase0-baseline
category: correction
trigger: "GraphQL parameter ordering bug in mutations"
learning: |
  Python function parameters with defaults must come AFTER required parameters.
  strawberry.mutation decorators don't change this rule.
  Caught in send_parent_message() and create_geofence() mutations.
context: |
  Any Python function with mixed required/optional params.
  This was a syntax bug, not a logical issue.
keywords: python, graphql, strawberry, parameter ordering
confidence: high
source: implementation
applied: 1
---
