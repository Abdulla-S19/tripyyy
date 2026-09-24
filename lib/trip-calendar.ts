// Weekdays, weekends and fixed-date holidays for the trip dates, computed rather than guessed:
// they drive traffic and crowd advice. Festivals on the lunar calendar (Diwali, Onam, Pongal…)
// move every year, so the prompt asks the model to check those itself.

/** Fixed dates with heavy travel across India (month-day). */
const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "01-26": "Republic Day",
  "05-01": "May Day (holiday in several states)",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "12-24": "Christmas Eve",
  "12-25": "Christmas",
  "12-31": "New Year's Eve",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type CalendarDay = { date: string; label: string; weekend: boolean; holiday: string | null };

export function tripCalendar(dates: string[]): CalendarDay[] {
  return dates.map((date) => {
    const d = new Date(date + "T00:00:00Z");
    const dow = d.getUTCDay();
    return {
      date,
      label: `${WEEKDAYS[dow]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      weekend: dow === 0 || dow === 6,
      holiday: FIXED_HOLIDAYS[date.slice(5)] ?? null,
    };
  });
}

/** "Day 1: Fri 9 Oct 2026 · Day 2: Sat 10 Oct 2026 (weekend) …" plus a long-weekend hint. */
export function calendarLines(dates: string[]): string[] {
  const cal = tripCalendar(dates);
  const lines = cal.map((c, i) => `  - Day ${i + 1}: ${c.label}${[c.weekend && "weekend", c.holiday].filter(Boolean).map((t) => ` (${t})`).join("")}`);
  const longWeekend = cal.some((c) => c.holiday) && cal.some((c) => c.weekend);
  if (longWeekend) lines.push("  A holiday next to a weekend makes a long weekend: expect heavy traffic out of cities and crowded hill stations and beaches.");
  return lines;
}
