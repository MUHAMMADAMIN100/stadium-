const TJ_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Dushanbe UTC+5

// Shifts a UTC Date into Tajikistan time so UTC methods reflect TJ wall-clock
function toTjUtc(date: Date): Date {
  return new Date(date.getTime() + TJ_OFFSET_MS);
}

// Returns a UTC Date representing midnight of the given date in Tajikistan
export function startOfDay(date: Date): Date {
  const tj = toTjUtc(date);
  tj.setUTCHours(0, 0, 0, 0);
  return new Date(tj.getTime() - TJ_OFFSET_MS);
}

// Adds whole days, calculated in Tajikistan space (no DST in TJ, but keeps it correct)
export function addDays(date: Date, days: number): Date {
  const tj = toTjUtc(date);
  tj.setUTCDate(tj.getUTCDate() + days);
  return new Date(tj.getTime() - TJ_OFFSET_MS);
}

// Safe: just adds milliseconds, timezone-independent
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Shows the hour in Tajikistan wall-clock time
export function formatHour(date: Date): string {
  return `${pad(toTjUtc(date).getUTCHours())}:00`;
}

// Shows the date in Tajikistan wall-clock time
export function formatDate(date: Date): string {
  const tj = toTjUtc(date);
  return `${pad(tj.getUTCDate())}.${pad(tj.getUTCMonth() + 1)}.${tj.getUTCFullYear()}`;
}

// Day-of-week in Tajikistan time
export function weekdayRu(date: Date): string {
  return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][toTjUtc(date).getUTCDay()];
}

// Compares two dates for same hour in Tajikistan time
export function isSameHour(a: Date, b: Date): boolean {
  const tjA = toTjUtc(a);
  const tjB = toTjUtc(b);
  return (
    tjA.getUTCFullYear() === tjB.getUTCFullYear() &&
    tjA.getUTCMonth()    === tjB.getUTCMonth()    &&
    tjA.getUTCDate()     === tjB.getUTCDate()      &&
    tjA.getUTCHours()    === tjB.getUTCHours()
  );
}
