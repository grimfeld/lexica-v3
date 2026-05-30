import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BackupControls } from "../backup/BackupControls";
import { writeBundleToFile, readBundleFromFile } from "../backup/file-io";
import { services } from "../services";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();

  return (
    <div className="flex flex-col gap-6">
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
