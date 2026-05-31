import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CloudSettings, type CloudSettingsProps } from "./CloudSettings";

function setup(over: Partial<CloudSettingsProps> = {}) {
  const props: CloudSettingsProps = {
    configuredUrl: null,
    signedInEmail: null,
    onConfigure: vi.fn(),
    onSignIn: vi.fn(async () => ({ ok: true })),
    onSignUp: vi.fn(async () => ({ ok: true })),
    onSignOut: vi.fn(),
    onSync: vi.fn(async () => ({ ok: true })),
    ...over,
  };
  render(<CloudSettings {...props} />);
  return props;
}

describe("CloudSettings", () => {
  it("configures the server URL", async () => {
    const props = setup();
    await userEvent.type(screen.getByLabelText("PocketBase URL"), "https://pb.example.com");
    await userEvent.click(screen.getByRole("button", { name: "Use" }));
    expect(props.onConfigure).toHaveBeenCalledWith("https://pb.example.com");
  });

  it("hides auth + sync until a server is configured", () => {
    setup({ configuredUrl: null });
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sync now" })).not.toBeInTheDocument();
  });

  it("signs in with email + password once configured", async () => {
    const props = setup({ configuredUrl: "https://pb.example.com" });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(props.onSignIn).toHaveBeenCalledWith("a@b.com", "secret");
  });

  it("shows the signed-in identity and a sync button", async () => {
    const props = setup({ configuredUrl: "https://pb.example.com", signedInEmail: "a@b.com" });
    expect(screen.getByText(/Signed in as a@b.com/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sync now" }));
    expect(props.onSync).toHaveBeenCalled();
  });

  it("surfaces a sign-in error", async () => {
    setup({
      configuredUrl: "https://pb.example.com",
      onSignIn: vi.fn(async () => ({ ok: false, error: "bad credentials" })),
    });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("bad credentials")).toBeInTheDocument();
  });
});
