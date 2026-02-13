# FirstBlush Web MVP Demo

Web-first demo client for FirstBlush.

Project scope and backlog are managed in:
- `../../docs/SCOPE_AND_DECISIONS.md`
- `../../docs/BACKLOG.md`

## Run

From this directory:

```bash
npm install
npm run dev
```

Default URL:
- `http://localhost:3000` (direct run)

With Docker Compose from repo root:
- `http://localhost:23110`

Expected API:
- `http://localhost:28110/v1`

Override API base:

```bash
VITE_API_BASE=http://localhost:28110/v1 npm run dev
```
