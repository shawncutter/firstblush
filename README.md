# FirstBlush

Web-first MVP demo stack for FirstBlush.

## What is included
- `apps/web`: React + Vite demo client
- `services/api`: Node/Express demo API
- `docker-compose.yml`: local orchestration (web, api, postgres, redis, minio)
- `firstblush_kiro_spec_bundle`: product and execution specs

## Demo run (one command)
```bash
docker-compose up -d --build
```

## URLs
- Web demo: `http://localhost:13110`
- API health: `http://localhost:18110/v1/health`
- MinIO console: `http://localhost:19021`

## Demo flow
1. Open web demo.
2. Sign in using Apple or Google with any long token string.
3. Create group and request/approve membership (switch accounts in the session panel).
4. Create a post with a video URL.
5. React to the post and view reaction chain.
6. Like/comment/follow/report/block/mute and inspect notifications + metrics.
