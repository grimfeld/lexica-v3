import { gate } from "../../src/ai/worker-gate";
import { PROXY_ROUTES, type ProxyChatRequest, type ProxyTtsRequest } from "../../src/ai/proxy-contract";
import { proxyChat, proxyTts, type ProviderEnv } from "./providers";

/*
 * Cloudflare Worker AI proxy + billing host (ADR-0006). The app's provider keys
 * live in Worker secrets and never reach the client. Every AI route is gated by
 * the subscription JWT (`active` claim). The billing routes mint that JWT on
 * login and receive the Stripe webhook that flips the mirrored entitlement.
 *
 * The gate, JWT, and event-mapping logic are shared with the client repo
 * (src/ai, src/billing) and unit-tested there; this entry is thin glue.
 *
 * Secrets (wrangler secret put): JWT_SECRET, ANTHROPIC_API_KEY, OPENAI_API_KEY,
 * ELEVENLABS_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PB_ADMIN_TOKEN,
 * PB_URL, STRIPE_PRICE_ID.
 */

export interface Env extends ProviderEnv {
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PB_URL: string;
  PB_ADMIN_TOKEN: string;
  STRIPE_PRICE_ID: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

    try {
      switch (url.pathname) {
        case PROXY_ROUTES.chat:
          return await handleChat(req, env);
        case PROXY_ROUTES.tts:
          return await handleTts(req, env);
        case PROXY_ROUTES.webhook:
          return await handleWebhook(req, env);
        case PROXY_ROUTES.token:
          return await handleToken(req, env);
        case PROXY_ROUTES.checkout:
          return await handleCheckout(req, env);
        default:
          return json({ error: "not found" }, 404);
      }
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "error" }, 502);
    }
  },
};

/** Gate an AI request on the subscription JWT; returns a 401/403 Response if denied. */
async function requireActive(req: Request, env: Env): Promise<Response | null> {
  const result = await gate(req.headers.get("authorization"), env.JWT_SECRET, Math.floor(Date.now() / 1000));
  if (!result.ok) return json({ error: result.reason }, result.status);
  return null;
}

async function handleChat(req: Request, env: Env): Promise<Response> {
  const denied = await requireActive(req, env);
  if (denied) return denied;
  const body = (await req.json()) as ProxyChatRequest;
  const text = await proxyChat(body, env);
  return json({ text });
}

async function handleTts(req: Request, env: Env): Promise<Response> {
  const denied = await requireActive(req, env);
  if (denied) return denied;
  const body = (await req.json()) as ProxyTtsRequest;
  const audio = await proxyTts(body, env);
  return json(audio);
}

// ---- Billing ---------------------------------------------------------------
// Webhook/token wiring uses the shared handlers (src/billing). The Stripe
// signature verification and PocketBase admin calls are supplied here; the
// decision logic (event -> flag, claim minting) is the tested shared code.

async function handleWebhook(req: Request, env: Env): Promise<Response> {
  const { handleStripeWebhook } = await import("../../src/billing/handlers");
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const result = await handleStripeWebhook(raw, sig, {
    verifyEvent: async (rawBody, signature) => verifyStripeEvent(rawBody, signature, env),
    setSubscriptionActive: (userId, active) => pbSetActive(userId, active, env),
  });
  return json(result, result.ok ? 200 : 400);
}

async function handleToken(req: Request, env: Env): Promise<Response> {
  const { issueAccessToken } = await import("../../src/billing/handlers");
  // The caller authenticates with its PocketBase token; we look up the user +
  // entitlement, then mint the short-lived access JWT.
  const pbToken = req.headers.get("authorization") ?? "";
  const user = await pbWhoAmI(pbToken, env);
  if (!user) return json({ error: "unauthorized" }, 401);
  const token = await issueAccessToken(user.id, user.subscriptionActive, {
    secret: env.JWT_SECRET,
    nowSeconds: () => Math.floor(Date.now() / 1000),
  });
  return json({ token });
}

async function handleCheckout(req: Request, env: Env): Promise<Response> {
  const pbToken = req.headers.get("authorization") ?? "";
  const user = await pbWhoAmI(pbToken, env);
  if (!user) return json({ error: "unauthorized" }, 401);
  const url = await createCheckoutSession(user.id, env);
  return json({ url });
}

// ---- Infra adapters (implemented against live services) --------------------

interface PbUser {
  id: string;
  subscriptionActive: boolean;
}

async function pbWhoAmI(authToken: string, env: Env): Promise<PbUser | null> {
  const res = await fetch(`${env.PB_URL}/api/collections/users/auth-refresh`, {
    method: "POST",
    headers: { authorization: authToken },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { record?: { id: string; subscriptionActive?: boolean } };
  if (!data.record) return null;
  return { id: data.record.id, subscriptionActive: data.record.subscriptionActive ?? false };
}

async function pbSetActive(userId: string, active: boolean, env: Env): Promise<void> {
  await fetch(`${env.PB_URL}/api/collections/users/records/${userId}`, {
    method: "PATCH",
    headers: {
      authorization: env.PB_ADMIN_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify({ subscriptionActive: active }),
  });
}

async function verifyStripeEvent(rawBody: string, signature: string, env: Env) {
  // Stripe's SDK isn't bundled here; the Worker deploy adds `stripe` and calls
  // stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET).
  // Left as a typed boundary so the shared handler logic stays the tested unit.
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

async function createCheckoutSession(userId: string, env: Env): Promise<string> {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    success_url: `${env.PB_URL}/billing/success`,
    cancel_url: `${env.PB_URL}/billing/cancel`,
  });
  return session.url ?? "";
}
