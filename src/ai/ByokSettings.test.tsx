import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ByokSettings } from "./ByokSettings";
import type { ProviderInfo } from "./providers";

const provider: ProviderInfo = {
  id: "anthropic",
  label: "Anthropic",
  usedFor: "Authoring assist",
  keysUrl: "https://example.com",
  validate: async () => true,
};

function setup(over: Partial<React.ComponentProps<typeof ByokSettings>> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClear = vi.fn().mockResolvedValue(undefined);
  const onTest = vi.fn().mockResolvedValue(true);
  render(
    <ByokSettings
      providers={[provider]}
      keyedIds={[]}
      onSave={onSave}
      onClear={onClear}
      onTest={onTest}
      {...over}
    />,
  );
  return { onSave, onClear, onTest };
}

describe("ByokSettings", () => {
  it("saves the entered key and clears the input", async () => {
    const { onSave } = setup();
    const input = screen.getByLabelText("Anthropic API key");
    await userEvent.type(input, "sk-ant-xyz");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("anthropic", "sk-ant-xyz");
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("uses a password field so the key isn't shown", () => {
    setup();
    expect(screen.getByLabelText("Anthropic API key")).toHaveAttribute("type", "password");
  });

  it("disables Save until a non-empty key is entered", async () => {
    setup();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Anthropic API key"), "k");
    expect(save).toBeEnabled();
  });

  it("shows stored status and enables Clear when a key exists", async () => {
    const { onClear } = setup({ keyedIds: ["anthropic"] });
    expect(screen.getByText("Key stored")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledWith("anthropic");
    expect(await screen.findByText("Removed.")).toBeInTheDocument();
  });

  it("reports a rejected key from the Test button", async () => {
    setup({ onTest: vi.fn().mockResolvedValue(false) });
    await userEvent.type(screen.getByLabelText("Anthropic API key"), "bad");
    await userEvent.click(screen.getByRole("button", { name: "Test" }));
    expect(await screen.findByText("Key was rejected.")).toBeInTheDocument();
  });

  it("never renders a stored key's value", () => {
    // keyedIds only signals presence; no value is passed in, so nothing to leak.
    setup({ keyedIds: ["anthropic"] });
    expect(screen.getByLabelText("Anthropic API key")).toHaveValue("");
  });
});
