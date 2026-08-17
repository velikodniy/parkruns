const EVENT_DATE_LENGTH = 10;

/** Parse a parkrun calendar date without applying the viewer's timezone. */
export function eventDateToDate(eventDate: string): Date {
  return new Date(`${eventDate.slice(0, EVENT_DATE_LENGTH)}T00:00:00.000Z`);
}

export function eventDateToISOString(eventDate: string): string {
  return eventDateToDate(eventDate).toISOString();
}

export function formatEventDate(
  eventDate: string,
  locales?: Intl.LocalesArgument,
): string {
  return new Intl.DateTimeFormat(locales, { timeZone: "UTC" }).format(
    eventDateToDate(eventDate),
  );
}

export function formatEventWeekday(
  eventDate: string,
  locales: Intl.LocalesArgument = "en",
): string {
  return new Intl.DateTimeFormat(locales, {
    timeZone: "UTC",
    weekday: "short",
  }).format(eventDateToDate(eventDate));
}

export function eventMonthKey(eventDate: string): string {
  return eventDate.slice(0, 7);
}
