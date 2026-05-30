import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BackupControls } from "./BackupControls";

describe("BackupControls", () => {
  it("confirms a successful export", async () => {
    const onExport = vi.fn().mockResolvedValue(true);
    render(<BackupControls onExport={onExport} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Export backup" }));
    expect(await screen.findByText("Backup saved.")).toBeInTheDocument();
  });

  it("reports an import failure with its error", async () => {
    const onImport = vi.fn().mockResolvedValue({ ok: false, error: "bad version" });
    render(<BackupControls onExport={vi.fn()} onImport={onImport} />);
    await userEvent.click(screen.getByRole("button", { name: "Import backup" }));
    expect(await screen.findByText("Import failed: bad version")).toBeInTheDocument();
  });

  it("stays quiet when the user cancels import", async () => {
    const onImport = vi.fn().mockResolvedValue(null);
    render(<BackupControls onExport={vi.fn()} onImport={onImport} />);
    await userEvent.click(screen.getByRole("button", { name: "Import backup" }));
    expect(screen.queryByText(/imported|failed/i)).not.toBeInTheDocument();
  });
});
