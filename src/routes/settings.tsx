import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BackupControls } from "../backup/BackupControls";
import { writeBundleToFile, readBundleFromFile } from "../backup/file-io";
import { ByokSettings } from "../ai/ByokSettings";
import { keyStore, PROVIDERS, getProvider } from "../ai";
import { services } from "../services";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();

  const { data: keyedIds = [] } = useQuery({
    queryKey: ["byok-keys"],
    queryFn: () => keyStore.providersWithKeys(),
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
