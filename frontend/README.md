# ASTRA-VITAL frontend

This directory mirrors the frontend boundaries from the implementation plan:

- `astronaut/` — field HUD
- `mission-control/` — mission overview
- `medical/` — physiology
- `behavioral/` — behavioral health
- `radiation/` — space weather and radiation
- `network/` — relay, buffer, and sync
- `ai/` — contextual ASTRA assistant

The working Replit preview remains in `artifacts/astra-vital` so it can keep
its managed Vite workflow. The preview is already TypeScript and produces
static assets, which is the deployment shape Cloudflare Pages expects.

For a Cloudflare Pages project, use the repository root as the build root:

```bash
pnpm --filter @workspace/astra-vital run build
```

Publish `artifacts/astra-vital/dist/public` as the Pages output directory.
Set `VITE_API_BASE_URL` to the deployed Vercel API URL when the frontend and
backend are hosted separately.