"use client";

import {
  DEFAULT_HOURS,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  formatHours,
  parseHours,
  type HoursSelection,
} from "@/lib/utils/hours";
import { Label } from "@/components/ui/label";

interface HoursPickerProps {
  value?: string;
  onChange: (formatted: string) => void;
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  formatOption,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: Array<string | number>;
  formatOption?: (value: string | number) => string;
}) {
  return (
    <label className="grid gap-1 text-xs text-[#7a7164]">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-[#14110e]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={`${id}-${option}`} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function HoursPicker({ value, onChange }: HoursPickerProps) {
  const selection = parseHours(value) ?? DEFAULT_HOURS;

  function update(patch: Partial<HoursSelection>) {
    onChange(formatHours({ ...selection, ...patch }));
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Opening hours</Label>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#8a8173]">Opens</p>
          <div className="grid grid-cols-3 gap-2">
            <SelectField
              id="open-hour"
              label="Open hour"
              value={selection.openHour}
              options={[...HOUR_OPTIONS]}
              onChange={(v) => update({ openHour: Number(v) })}
            />
            <SelectField
              id="open-minute"
              label="Open minutes"
              value={selection.openMinute}
              options={[...MINUTE_OPTIONS]}
              formatOption={(v) => Number(v).toString().padStart(2, "0")}
              onChange={(v) => update({ openMinute: Number(v) })}
            />
            <SelectField
              id="open-period"
              label="Open AM/PM"
              value={selection.openPeriod}
              options={["AM", "PM"]}
              onChange={(v) => update({ openPeriod: v as "AM" | "PM" })}
            />
          </div>
        </div>

        <p className="hidden pb-2 text-center text-sm text-[#8a8173] sm:block">
          to
        </p>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#8a8173]">Closes</p>
          <div className="grid grid-cols-3 gap-2">
            <SelectField
              id="close-hour"
              label="Close hour"
              value={selection.closeHour}
              options={[...HOUR_OPTIONS]}
              onChange={(v) => update({ closeHour: Number(v) })}
            />
            <SelectField
              id="close-minute"
              label="Close minutes"
              value={selection.closeMinute}
              options={[...MINUTE_OPTIONS]}
              formatOption={(v) => Number(v).toString().padStart(2, "0")}
              onChange={(v) => update({ closeMinute: Number(v) })}
            />
            <SelectField
              id="close-period"
              label="Close AM/PM"
              value={selection.closePeriod}
              options={["AM", "PM"]}
              onChange={(v) => update({ closePeriod: v as "AM" | "PM" })}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-[#8a8173]">
        Guests will see:{" "}
        <span className="font-medium text-[#14110e]">
          {formatHours(selection)}
        </span>
      </p>
    </div>
  );
}
