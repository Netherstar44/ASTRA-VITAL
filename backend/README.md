# ASTRA-VITAL backend

The backend is a Python/FastAPI service designed to run as a Vercel Python
Function. Set the Vercel project root to `backend`; Vercel will discover
`api/index.py` and serve the exported ASGI `app`.

## Local development

From the repository root:

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.api.index:app --reload --port 8000
```

The API exposes:

- `GET /healthz`
- `GET /api/mission/state`
- `POST /api/mission/advance`
- `POST /api/mission/reset`
- `POST /api/communications/relay`
- `POST /api/assistant`

The MVP stores the active simulation in memory so the demo stays portable to
serverless execution. Durable mission history belongs behind
`backend/storage/repository.py` when a production database is selected.