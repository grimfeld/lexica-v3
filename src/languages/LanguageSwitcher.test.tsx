import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

const langs = [
  { id: "es", name: "Spanish" },
  { id: "ja", name: "Japanese" },
];

describe("LanguageSwitcher", () => {
  it("switches the active language", async () => {
    const onSwitch = vi.fn();
    render(
      <LanguageSwitcher languages={langs} activeId="es" onSwitch={onSwitch} onAdd={vi.fn()} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Active language"), "ja");
    expect(onSwitch).toHaveBeenCalledWith("ja");
  });

  it("adds a new language", async () => {
    const onAdd = vi.fn();
    render(
      <LanguageSwitcher languages={langs} activeId="es" onSwitch={vi.fn()} onAdd={onAdd} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "+ Add language" }));
    await userEvent.type(screen.getByLabelText("New language name"), "German");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith("German");
  });
});
