import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AuthoringAssist, type AuthoringAssistProps } from "./AuthoringAssist";

function setup(onAssist: AuthoringAssistProps["onAssist"]) {
  const onFill = vi.fn();
  render(<AuthoringAssist onAssist={onAssist} onFill={onFill} providerLabel="Anthropic" />);
  return { onFill };
}

describe("AuthoringAssist", () => {
  it("fills the form with accepted fields on success", async () => {
    const onAssist = vi.fn().mockResolvedValue({ ok: true, fields: { front: "hello" } });
    const { onFill } = setup(onAssist);
    await userEvent.type(screen.getByLabelText("Seed word or phrase"), "hola");
    await userEvent.click(screen.getByRole("button", { name: "Suggest fields" }));
    expect(onAssist).toHaveBeenCalledWith("hola");
    expect(onFill).toHaveBeenCalledWith({ front: "hello" });
  });

  it("shows the error and does not fill on failure", async () => {
    const onAssist = vi.fn().mockResolvedValue({ ok: false, error: "AI request failed." });
    const { onFill } = setup(onAssist);
    await userEvent.type(screen.getByLabelText("Seed word or phrase"), "hola");
    await userEvent.click(screen.getByRole("button", { name: "Suggest fields" }));
    expect(await screen.findByText("AI request failed.")).toBeInTheDocument();
    expect(onFill).not.toHaveBeenCalled();
  });

  it("disables the button until a seed is entered", async () => {
    setup(vi.fn());
    const btn = screen.getByRole("button", { name: "Suggest fields" });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Seed word or phrase"), "x");
    expect(btn).toBeEnabled();
  });
});
