import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NoteAuthoringShell } from "./NoteAuthoringShell";
import { registerNoteType, __resetRegistry } from "../note-types/registry";
import { vocabNoteType } from "../note-types/vocab";

beforeEach(() => {
  __resetRegistry();
  registerNoteType(vocabNoteType);
});

describe("NoteAuthoringShell", () => {
  it("saves a valid note via the chosen type's form", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NoteAuthoringShell onSave={onSave} />);

    await userEvent.type(screen.getByLabelText("Term"), "perro");
    await userEvent.type(screen.getByLabelText("Meaning"), "dog");
    await userEvent.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        type: "vocab",
        fields: { term: "perro", meaning: "dog" },
      }),
    );
  });

  it("blocks save and shows errors when required fields are missing", async () => {
    const onSave = vi.fn();
    render(<NoteAuthoringShell onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: "Add note" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/term: required/)).toBeInTheDocument();
  });

  it("locks the type picker when editing an existing note", () => {
    render(
      <NoteAuthoringShell
        onSave={vi.fn()}
        initial={{ type: "vocab", fields: { term: "perro", meaning: "dog" } }}
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
