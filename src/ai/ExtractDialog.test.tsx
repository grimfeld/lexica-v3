import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ExtractDialog, type ExtractDialogProps } from "./ExtractDialog";
import type { Candidate } from "./extract";

const CANDS: Candidate[] = [
  { type: "vocab", fields: { front: "hello", back: "hola" } },
  { type: "vocab", fields: { front: "dog", back: "perro" } },
];

function setup(over: Partial<ExtractDialogProps> = {}) {
  const onExtract = vi.fn(async () => ({ ok: true, candidates: CANDS }));
  const onPickFile = vi.fn(async () => null);
  const onAccept = vi.fn(async () => {});
  render(
    <ExtractDialog
      onExtract={onExtract}
      onPickFile={onPickFile}
      onAccept={onAccept}
      providerLabel="Anthropic"
      {...over}
    />,
  );
  return { onExtract, onPickFile, onAccept };
}

async function runExtract() {
  await userEvent.type(screen.getByLabelText("Document text"), "some passage");
  await userEvent.click(screen.getByRole("button", { name: "Find cards" }));
}

describe("ExtractDialog", () => {
  it("renders all candidates UNSELECTED by default", async () => {
    setup();
    await runExtract();
    const boxes = await screen.findAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    boxes.forEach((b) => expect(b).not.toBeChecked());
    // With nothing selected, the add button is disabled.
    expect(screen.getByRole("button", { name: /Add 0/ })).toBeDisabled();
  });

  it("accepts only the candidates the user checks", async () => {
    const { onAccept } = setup();
    await runExtract();
    const boxes = await screen.findAllByRole("checkbox");
    await userEvent.click(boxes[1]); // pick the second only
    await userEvent.click(screen.getByRole("button", { name: "Add 1 note" }));
    expect(onAccept).toHaveBeenCalledWith([CANDS[1]]);
  });

  it("loads file text into the document area", async () => {
    setup({ onPickFile: vi.fn(async () => "from a file") });
    await userEvent.click(screen.getByRole("button", { name: "Open file…" }));
    expect(await screen.findByDisplayValue("from a file")).toBeInTheDocument();
  });

  it("shows an empty-result message", async () => {
    setup({ onExtract: vi.fn(async () => ({ ok: true, candidates: [] })) });
    await runExtract();
    expect(await screen.findByText("No cards found in that text.")).toBeInTheDocument();
  });

  it("surfaces an extraction error", async () => {
    setup({ onExtract: vi.fn(async () => ({ ok: false, error: "AI request failed." })) });
    await runExtract();
    expect(await screen.findByText("AI request failed.")).toBeInTheDocument();
  });
});
