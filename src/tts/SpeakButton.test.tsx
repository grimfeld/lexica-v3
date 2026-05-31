import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SpeakButton } from "./SpeakButton";

describe("SpeakButton", () => {
  it("invokes onSpeak when clicked", async () => {
    const onSpeak = vi.fn().mockResolvedValue({ ok: true });
    render(<SpeakButton onSpeak={onSpeak} />);
    await userEvent.click(screen.getByRole("button", { name: "Play pronunciation" }));
    expect(onSpeak).toHaveBeenCalledOnce();
  });

  it("shows an error when playback fails", async () => {
    const onSpeak = vi.fn().mockResolvedValue({ ok: false, error: "Add an ElevenLabs key in Settings." });
    render(<SpeakButton onSpeak={onSpeak} />);
    await userEvent.click(screen.getByRole("button", { name: "Play pronunciation" }));
    expect(await screen.findByText("Add an ElevenLabs key in Settings.")).toBeInTheDocument();
  });
});
