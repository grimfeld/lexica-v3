import { useState } from "react";
import type { ReminderConfig } from "./schedule";

/*
 * Daily-reminder settings (ADR-0005). A single opt-in cue at a user-set hour.
 * Deliberately plain: a toggle and a time, no goal, no streak, no "cards due"
 * framing. Off by default. Actions injected for testability; enabling requests
 * OS notification permission.
 */

export interface ReminderSettingsProps {
  config: ReminderConfig;
  onChange: (patch: Partial<ReminderConfig>) => void;
  /** Request OS notification permission when the user enables reminders. */
  onEnable: () => Promise<boolean>;
}

export function ReminderSettings({ config, onChange, onEnable }: ReminderSettingsProps) {
  const [denied, setDenied] = useState(false);

  async function toggle(enabled: boolean) {
    if (enabled) {
      const granted = await onEnable();
      setDenied(!granted);
      onChange({ enabled: granted });
    } else {
      setDenied(false);
      onChange({ enabled: false });
    }
  }

  const time = `${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label="Daily reminder"
          checked={config.enabled}
          onChange={(e) => void toggle(e.target.checked)}
        />
        <span className="text-sm">A gentle daily reminder to practice</span>
      </label>

      {config.enabled && (
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
          <span>At</span>
          <input
            type="time"
            aria-label="Reminder time"
            value={time}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(m)) onChange({ hour: h, minute: m });
            }}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-2 py-1"
          />
        </label>
      )}

      {denied && (
        <p className="text-xs text-[var(--color-miss)]">
          Notifications are blocked. Allow them for this app to get the reminder.
        </p>
      )}

      <p className="text-xs text-[var(--color-ink-muted)]">
        It's a plain nudge — no streaks, no goals, no count of what's due.
      </p>
    </div>
  );
}
