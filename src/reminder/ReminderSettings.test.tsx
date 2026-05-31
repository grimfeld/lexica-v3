import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReminderSettings } from "./ReminderSettings";
import type { ReminderConfig } from "./schedule";

const cfg = (over: Partial<ReminderConfig> = {}): ReminderConfig => ({
  enabled: false,
  hour: 9,
  minute: 0,
  lastFiredDate: null,
  ...over,
});

describe("ReminderSettings", () => {
  it("is off by default with no time picker shown", () => {
    render(<ReminderSettings config={cfg()} onChange={vi.fn()} onEnable={vi.fn()} />);
    expect(screen.getByLabelText("Daily reminder")).not.toBeChecked();
    expect(screen.queryByLabelText("Reminder time")).not.toBeInTheDocument();
  });

  it("requests permission and enables when toggled on", async () => {
    const onChange = vi.fn();
    const onEnable = vi.fn().mockResolvedValue(true);
    render(<ReminderSettings config={cfg()} onChange={onChange} onEnable={onEnable} />);
    await userEvent.click(screen.getByLabelText("Daily reminder"));
    expect(onEnable).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({ enabled: true });
  });

  it("stays off and warns when permission is denied", async () => {
    const onChange = vi.fn();
    render(
      <ReminderSettings config={cfg()} onChange={onChange} onEnable={vi.fn().mockResolvedValue(false)} />,
    );
    await userEvent.click(screen.getByLabelText("Daily reminder"));
    expect(onChange).toHaveBeenCalledWith({ enabled: false });
    expect(await screen.findByText(/Notifications are blocked/)).toBeInTheDocument();
  });

  it("edits the time when enabled", async () => {
    const onChange = vi.fn();
    render(<ReminderSettings config={cfg({ enabled: true })} onChange={onChange} onEnable={vi.fn()} />);
    const input = screen.getByLabelText("Reminder time");
    // time inputs emit a single change with the full value
    fireEvent.change(input, { target: { value: "18:30" } });
    expect(onChange).toHaveBeenCalledWith({ hour: 18, minute: 30 });
  });

  it("never frames the reminder as a due count", () => {
    render(<ReminderSettings config={cfg({ enabled: true })} onChange={vi.fn()} onEnable={vi.fn()} />);
    expect(screen.getByText(/no streaks, no goals, no count/)).toBeInTheDocument();
  });
});
