# Lexica AI proxy (Cloudflare Worker)

The serverless surface for **app-key AI** and **billing** (ADR-0006). It holds
the app's provider keys server-side (never shipped in the desktop binary),
gates AI requests on the subscription JWT, and hosts the Stripe webhook +
token/checkout endpoints.

The decision logic — JWT verify, the subscription gate, the Stripe
event→entitlement mapping — is the **shared, unit-tested code** in the main repo
(`src/ai/worker-gate.ts`, `src/billing/`). This Worker is the thin deployment
glue around it.

## Routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/ai/chat` | subscription JWT | proxy a chat completion |
| `POST /api/ai/tts` | subscription JWT | proxy a TTS synthesis |
| `POST /api/billing/token` | PocketBase token | mint a ~15-min access JWT |
| `POST /api/billing/checkout` | PocketBase token | start a Stripe Checkout |
| `POST /api/billing/webhook` | Stripe signature | update mirrored entitlement |

## Deploy

```sh
cd worker
pnpm install
# set secrets (never committed):
wrangler secret put JWT_SECRET            # must match the client's gate secret
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_ID
wrangler secret put PB_URL
wrangler secret put PB_ADMIN_TOKEN
pnpm deploy
```

Point the Stripe webhook at `…/api/billing/webhook` and the client's Worker URL
at the deployed Worker. BYOK users never touch this Worker — it's only the
app-key paywall path.

## Status

Not yet deployed. The shared logic is unit-tested in the main repo; the live
proxy needs a Cloudflare account, the secrets above, and a running PocketBase +
Stripe account to verify end-to-end.
