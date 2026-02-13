# FirstBlush

Web-first MVP demo stack for FirstBlush.

## Quick start

```bash
./scripts/dev-up.sh
```

## URLs

- Web demo: `http://localhost:23110`
- API health: `http://localhost:28110/v1/health`
- MinIO console: `http://localhost:29021`

## Documentation (read in this order)

1. `docs/README.md` - documentation map and conflict-resolution order.
2. `docs/SCOPE_AND_DECISIONS.md` - normalized v1 scope and locked decisions.
3. `docs/BACKLOG.md` - prioritized execution backlog with dependencies.
4. `docs/AI_ENGINEERING_OPERATING_MODEL.md` - agent structure and delivery operating system.
5. `apps/web/README.md` and `services/api/README.md` - service-level run and implementation notes.
6. `firstblush_kiro_spec_bundle/` - historical source bundle that informed the normalized docs.

## Repo layout

- `apps/web`: React + Vite product demo UI.
- `services/api`: Node/Express API demo service.
- `docker-compose.yml`: local orchestration (`web`, `api`, `postgres`, `redis`, `minio`).
- `scripts/dev-up.sh`: local bootstrap + port-conflict guard.
- `docs/`: active project documentation and execution guidance.
- `firstblush_kiro_spec_bundle/`: reference specs and earlier planning artifacts.

## Port configuration

Host ports are non-standard and configurable via `.env`.
Defaults are in `.env.example`:

- `WEB_HOST_PORT=23110`
- `API_HOST_PORT=28110`
- `POSTGRES_HOST_PORT=25435`
- `REDIS_HOST_PORT=26380`
- `MINIO_API_HOST_PORT=29020`
- `MINIO_CONSOLE_HOST_PORT=29021`

## Demo flow

1. Open the web demo.
2. Sign in with Apple or Google using any long token string (stub auth in demo).
3. Create a group and run request/approve membership flow.
4. Create a post with a video URL.
5. React to the post and open reaction chain view.
6. Exercise like/comment/follow/report/block/mute and check notifications + metrics.
