/*
 * The AI providers the app can talk to with a user-supplied key (BYOK). T14 is
 * plumbing only: storing and clearing the key. Feature tickets (T15 authoring
 * assist, T17 IPA, T18 TTS) read the stored key and call the provider directly
 * from the client (ADR-0006: BYOK never goes through the Worker).
 *
 * `id` doubles as the keystore record key, so it must be stable.
 */

export interface ProviderInfo {
  id: string;
  /** Human label for the settings UI. */
  label: string;
  /** Which AI features use this provider — shown so the user knows why. */
  usedFor: string;
  /** Where the user obtains a key, linked from settings. */
  keysUrl: string;
  /** A cheap, side-effect-free request used to verify a key works (T14 test button). */
  validate: ProviderValidator;
}

/**
 * Returns true if the key is accepted by the provider. Implementations make one
 * minimal authenticated request (e.g. list models) — never a billable call.
 * Injected/overridable so the settings UI is testable without network.
 */
export type ProviderValidator = (key: string) => Promise<boolean>;

const validateAnthropic: ProviderValidator = async (key) => {
  // /v1/models is auth-gated and free; 200 => key good, 401 => bad.
  const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
  });
  return res.ok;
};

const validateOpenai: ProviderValidator = async (key) => {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  return res.ok;
};

const validateElevenlabs: ProviderValidator = async (key) => {
  const res = await fetch("https://api.elevenlabs.io/v1/user", {
    headers: { "xi-api-key": key },
  });
  return res.ok;
};

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    usedFor: "Authoring assist, text extraction, IPA fallback",
    keysUrl: "https://console.anthropic.com/settings/keys",
    validate: validateAnthropic,
  },
  {
    id: "openai",
    label: "OpenAI",
    usedFor: "Authoring assist, text extraction, IPA fallback",
    keysUrl: "https://platform.openai.com/api-keys",
    validate: validateOpenai,
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    usedFor: "Text-to-speech",
    keysUrl: "https://elevenlabs.io/app/settings/api-keys",
    validate: validateElevenlabs,
  },
];

export function getProvider(id: string): ProviderInfo {
  const p = PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown AI provider: ${id}`);
  return p;
}
