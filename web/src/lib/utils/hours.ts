export type DayPart = "AM" | "PM";

export type HoursSelection = {
  openHour: number; // 1-12
  openMinute: number; // 0 | 15 | 30 | 45
  openPeriod: DayPart;
  closeHour: number;
  closeMinute: number;
  closePeriod: DayPart;
};

export const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

export const DEFAULT_HOURS: HoursSelection = {
  openHour: 9,
  openMinute: 0,
  openPeriod: "AM",
  closeHour: 10,
  closeMinute: 0,
  closePeriod: "PM",
};

function pad(minute: number): string {
  return minute.toString().padStart(2, "0");
}

export function formatHours(selection: HoursSelection): string {
  return `${selection.openHour}:${pad(selection.openMinute)} ${selection.openPeriod} - ${selection.closeHour}:${pad(selection.closeMinute)} ${selection.closePeriod}`;
}

export function parseHours(value?: string | null): HoursSelection {
  if (!value?.trim()) return DEFAULT_HOURS;

  const match = value.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );

  if (!match) return DEFAULT_HOURS;

  const openMinute = Number(match[2]);
  const closeMinute = Number(match[5]);

  return {
    openHour: Math.min(12, Math.max(1, Number(match[1]))),
    openMinute: (MINUTE_OPTIONS as readonly number[]).includes(openMinute)
      ? openMinute
      : 0,
    openPeriod: match[3]!.toUpperCase() as DayPart,
    closeHour: Math.min(12, Math.max(1, Number(match[4]))),
    closeMinute: (MINUTE_OPTIONS as readonly number[]).includes(closeMinute)
      ? closeMinute
      : 0,
    closePeriod: match[6]!.toUpperCase() as DayPart,
  };
}
