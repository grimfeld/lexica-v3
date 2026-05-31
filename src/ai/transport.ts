/*
 * Chooses the AI transport for a provider (ADR-0006): BYOK (client-direct with
 * the user's own key — always free) or app-key (through the Worker proxy, for
 * subscribers). BYOK wins when a key is present — the user opted to use their
 * own and shouldn't be billed through the app. Otherwise, an active subscriber
 * with a Worker configured uses the app-key path. Failing both, AI is off.
 *
 * Pure decision so the selection is unit-tested; the caller builds the actual
 * client from the chosen path.
 */

export type Transport =
  | { kind: "byok" }
  | { kind: "app-key"; workerUrl: string; token: string }
  | { kind: "none"; reason: string };

export interface TransportInputs {
  /** The user has a BYOK key for this provider. */
  hasByokKey: boolean;
  /** A valid subscription access token, or null. */
  accessToken: string | null;
  /** The configured Worker base URL, or null. */
  workerUrl: string | null;
}

export function chooseTransport(inputs: TransportInputs): Transport {
  if (inputs.hasByokKey) return { kind: "byok" };
  if (inputs.accessToken && inputs.workerUrl) {
    return { kind: "app-key", workerUrl: inputs.workerUrl, token: inputs.accessToken };
  }
  if (!inputs.accessToken) return { kind: "none", reason: "Add a key in Settings or subscribe." };
  return { kind: "none", reason: "Hosted AI isn't configured." };
}
