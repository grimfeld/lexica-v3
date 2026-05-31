import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BackupControls } from "../backup/BackupControls";
import { writeBundleToFile, readBundleFromFile } from "../backup/file-io";
import { ByokSettings } from "../ai/ByokSettings";
import { keyStore, PROVIDERS, getProvider } from "../ai";
import { CloudSettings } from "../sync/CloudSettings";
import { configureCloud, auth, syncNow, currentUrl, signedInEmail } from "../sync/run";
import { SubscriptionSettings } from "../billing/SubscriptionSettings";
import { subscription } from "../billing/run";
import { services } from "../services";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  // Cloud state is module-held in sync/run; bump to re-read after each action.
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);

  const { data: keyedIds = [] } = useQuery({
    queryKey: ["byok-keys"],
    queryFn: () => keyStore.providersWithKeys(),
  });

  // null when signed out (prompts sign-in); boolean entitlement otherwise.
  const { data: subActive = null } = useQuery({
    queryKey: ["subscription-active", signedInEmail()],
    queryFn: async () => (signedInEmail() ? subscription.isActive() : null),
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-xl">AI provider keys</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Bring your own key to enable AI features. Keys stay on this device.
        </p>
        <ByokSettings
          providers={PROVIDERS}
          keyedIds={keyedIds}
          onSave={async (id, key) => {
            await keyStore.setKey(id, key);
            await qc.invalidateQueries({ queryKey: ["byok-keys"] });
          }}
          onClear={async (id) => {
            await keyStore.clearKey(id);
            await qc.invalidateQueries({ queryKey: ["byok-keys"] });
          }}
          onTest={(id, key) => getProvider(id).validate(key)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Cloud sync</h2>
        <CloudSettings
          configuredUrl={currentUrl()}
          signedInEmail={signedInEmail()}
          onConfigure={(url) => {
            configureCloud(url);
            refresh();
          }}
          onSignIn={async (email, password) => {
            try {
              await auth()!.signIn(email, password);
              refresh();
              return { ok: true };
            } catch (e) {
              return { ok: false, error: e instanceof Error ? e.message : "Sign-in failed." };
            }
          }}
          onSignUp={async (email, password) => {
            try {
              await auth()!.signUp(email, password);
              refresh();
              return { ok: true };
            } catch (e) {
              return { ok: false, error: e instanceof Error ? e.message : "Sign-up failed." };
            }
          }}
          onSignOut={() => {
            auth()!.signOut();
            refresh();
          }}
          onSync={async () => {
            const r = await syncNow();
            await qc.invalidateQueries();
            return { ok: r.ok, error: r.error };
          }}
        />
        <SubscriptionSettings
          active={subActive}
          onSubscribe={async () => {
            const ok = await subscription.subscribe();
            await qc.invalidateQueries({ queryKey: ["subscription-active"] });
            return ok;
          }}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Pronunciation audio</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          With an ElevenLabs key, cards can be spoken aloud. Audio is generated
          once and cached on this device. The cache is local, so each device you
          use will regenerate (and re-pay for) the same clips — a shared cache
          across devices comes with cloud sync later.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Backup</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Export your data to a file and keep it on any drive, or import a backup.
        </p>
        <BackupControls
          onExport={async () => {
            const json = await services.backup.exportBundle();
            return writeBundleToFile(json);
          }}
          onImport={async () => {
            const json = await readBundleFromFile();
            if (json === null) return null;
            const result = await services.backup.importBundle(json);
            if (result.ok) await qc.invalidateQueries();
            return result;
          }}
        />
      </section>
    </div>
  );
}
