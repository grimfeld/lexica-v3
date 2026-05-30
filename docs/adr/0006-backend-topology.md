# Backend topology: PocketBase + Cloudflare Workers + Stripe

The app is a Tauri client (web-first, exportable). Backend splits by workload:

- **PocketBase** — system of record for cloud storage, sync, and auth. Stateful
  CRUD. Mirrors each user's subscription status.
- **Cloudflare Workers** — stateless AI proxy. Holds the app's provider API keys
  (which must never ship in the Tauri binary, where they'd be extractable),
  enforces the paywall, proxies to AI providers, and caches results (KV).
- **Stripe** — source of truth for payment. Subscription changes arrive by
  webhook and update the mirrored status in PocketBase. The Worker never calls
  Stripe on the request path (latency, rate limits, fragility).

**AI authorization:** on login PocketBase issues a short-lived JWT (~15 min)
carrying an `active` subscription claim. The Worker verifies the signature and
claim, then proxies. Cancellation propagates within the token's expiry.

**BYOK** calls go directly from the client to the AI provider — never through
the Worker — so "bring your own key" is genuinely free and the app never holds
a user's key.

Rejected: routing AI through PocketBase Go hooks (couples AI latency to the
storage process) and live per-request Stripe/PocketBase checks (slow, fragile).
