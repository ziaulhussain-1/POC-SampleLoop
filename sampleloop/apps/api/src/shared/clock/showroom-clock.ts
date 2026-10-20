/**
 * The showroom's calendar day governs lending time (AD-8).
 * Collection, expected-return and due dates are plain ISO dates (`YYYY-MM-DD`);
 * every day boundary resolves in Asia/Karachi through this module and nowhere else.
 */
export const SHOWROOM_TIME_ZONE = 'Asia/Karachi';

/** A calendar date, `YYYY-MM-DD`. Maps to SQL `DATE`. */
export type IsoDate = string;

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

const showroomDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOWROOM_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date in the showroom, regardless of server time zone. */
export function showroomToday(clock: Clock = systemClock): IsoDate {
  return showroomDay.format(clock.now());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
