// Decides whether the farm store is open right now, and what the status bar
// should say. Pure function of the settings and a moment in time, so it runs
// the same at build time and in the visitor's browser.
import type { ClockTime, SiteSettings, Weekday } from './content/types';

export interface StoreStatus {
  isOpen: boolean;
  /** What decided it: the weekly hours, a holiday closure, or the editor's override. */
  reason: 'hours' | 'closure' | 'override';
  /** "Open now" or "Closed". */
  headline: string;
  /** e.g. "until 7 pm", "opens tomorrow at 9 am", "Closed for Thanksgiving". */
  detail: string;
}

type HoursSettings = Pick<
  SiteSettings,
  'timeZone' | 'hours' | 'closures' | 'statusOverride' | 'overrideMessage' | 'overrideUntil'
>;

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES: Record<Weekday, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};
const LOOKAHEAD_DAYS = 14;

export function getStoreStatus(settings: HoursSettings, now: Date): StoreStatus {
  const local = localParts(now, settings.timeZone);

  const until = settings.overrideUntil ? parseInstant(settings.overrideUntil) : undefined;
  const overrideActive = settings.statusOverride !== 'auto' && (!until || now < until);

  if (overrideActive && settings.statusOverride === 'open') {
    return {
      isOpen: true,
      reason: 'override',
      headline: 'Open now',
      detail:
        afterHeadline(settings.overrideMessage, 'Open now') ||
        openUntilDetail(settings, local, until) ||
        'Come on by',
    };
  }
  if (overrideActive && settings.statusOverride === 'closed') {
    return {
      isOpen: false,
      reason: 'override',
      headline: 'Closed',
      // With an end time, the store reopens at the first opening from then on.
      // Without one, treat it as closed for the rest of today.
      detail:
        afterHeadline(settings.overrideMessage, 'Closed') ||
        nextOpenDetail(settings, local, until ? localParts(until, settings.timeZone) : { date: addDays(local.date, 1), minutes: -1 }),
    };
  }

  const closure = closureOn(settings, local.date);
  if (closure) {
    return { isOpen: false, reason: 'closure', headline: 'Closed', detail: afterHeadline(closure.label, 'Closed') ?? '' };
  }

  const row = openRowAt(settings, local.weekday, local.minutes);
  if (row) {
    return { isOpen: true, reason: 'hours', headline: 'Open now', detail: `until ${formatTime(row.closes)}` };
  }
  return { isOpen: false, reason: 'hours', headline: 'Closed', detail: nextOpenDetail(settings, local) };
}

/** Human summary of the weekly hours, e.g. "Every day 9 am – 7 pm". */
export function describeHours(hours: SiteSettings['hours']): string[] {
  return hours.map((row) => `${describeDays(row.days)} ${formatTime(row.opens)} – ${formatTime(row.closes)}`);
}

/** The hours as one phrase to use mid-sentence, e.g. "every day 9 am – 7 pm" or "Mon–Fri 9 am – 5 pm, Sat 8 am – 12 pm". */
export function describeHoursInline(hours: SiteSettings['hours']): string {
  return describeHours(hours)
    .map((line) => line.replace(/^Every day/, 'every day'))
    .join(', ');
}

// ---------------------------------------------------------------------------

interface LocalParts {
  date: string; // YYYY-MM-DD in the farm's time zone
  weekday: Weekday;
  minutes: number; // minutes since local midnight
}

function localParts(now: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, weekday: weekdayOf(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function weekdayOf(date: string): Weekday {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

/**
 * Reads the override end time. Storyblok saves date-times as "YYYY-MM-DD HH:mm"
 * in UTC with no zone, which `new Date` would read as the visitor's local time
 * (or reject, in some browsers).
 */
function parseInstant(value: string): Date {
  const storyblok = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value);
  return new Date(storyblok ? `${value.replace(' ', 'T')}:00Z` : value);
}

/** "2026-11-26" from a plain date or a date-time like Storyblok's "2026-11-26 00:00". */
function dayOf(value: string): string {
  return value.slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toMinutes(time: ClockTime): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function closureOn(settings: HoursSettings, date: string) {
  return settings.closures.find((c) => dayOf(c.from) <= date && date <= dayOf(c.to));
}

function openRowAt(settings: HoursSettings, weekday: Weekday, minutes: number) {
  return settings.hours.find(
    (row) => row.days.includes(weekday) && toMinutes(row.opens) <= minutes && minutes < toMinutes(row.closes),
  );
}

/**
 * The bar shows the headline ("Closed") before the detail, so editor text that
 * repeats it ("Closed for Thanksgiving") would read "Closed Closed for
 * Thanksgiving". Drop the repeat.
 */
function afterHeadline(text: string | undefined, headline: 'Open now' | 'Closed'): string | undefined {
  if (!text) return text;
  const repeat = headline === 'Closed' ? /^closed\b[\s:,.;–—-]*/i : /^open(\s+now)?\b[\s:,.;–—-]*/i;
  return text.trim().replace(repeat, '');
}

/** While forced open: "until 9 pm", "until tomorrow at 9 am", or the regular closing time if that's later. */
function openUntilDetail(settings: HoursSettings, local: LocalParts, until: Date | undefined): string | undefined {
  const row = openRowAt(settings, local.weekday, local.minutes);
  if (!until) return row ? `until ${formatTime(row.closes)}` : undefined;
  const end = localParts(until, settings.timeZone);
  const offset = daysBetween(local.date, end.date);
  // The regular hours carry on past the override's end, so the store stays open until they close.
  if (row && offset === 0 && end.minutes <= toMinutes(row.closes)) return `until ${formatTime(row.closes)}`;
  const day = offset === 0 ? '' : offset === 1 ? 'tomorrow at ' : `${DAY_NAMES[end.weekday]} at `;
  return `until ${day}${formatMinutes(end.minutes)}`;
}

/**
 * "opens at 9 am", "opens tomorrow at 9 am", "opens Thursday at 9 am".
 * Looks for the first opening at or after `from` (default: now); the wording
 * is relative to `today`.
 */
function nextOpenDetail(
  settings: HoursSettings,
  today: LocalParts,
  from: { date: string; minutes: number } = today,
): string {
  const start = daysBetween(today.date, from.date);
  for (let offset = start; offset <= start + LOOKAHEAD_DAYS; offset++) {
    const date = addDays(today.date, offset);
    if (closureOn(settings, date)) continue;
    const weekday = weekdayOf(date);
    const after = offset === start ? from.minutes : -1;
    // An override can end partway through opening hours: the store reopens right then.
    const reopensMidway = offset === start && openRowAt(settings, weekday, after) ? after : undefined;
    const opening =
      reopensMidway ??
      settings.hours
        .filter((row) => row.days.includes(weekday))
        .map((row) => toMinutes(row.opens))
        .filter((opens) => opens >= after)
        .sort((a, b) => a - b)[0];
    if (opening === undefined) continue;
    const when = offset === 0 ? '' : offset === 1 ? 'tomorrow ' : `${DAY_NAMES[weekday]} `;
    return `opens ${when}at ${formatMinutes(opening)}`;
  }
  return 'call ahead for hours';
}

export function formatTime(time: ClockTime): string {
  return formatMinutes(toMinutes(time));
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function describeDays(days: Weekday[]): string {
  const order: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const sorted = order.filter((d) => days.includes(d));
  if (sorted.length === 7) return 'Every day';
  const short = (d: Weekday) => DAY_NAMES[d].slice(0, 3);
  // Collapse consecutive runs: Mon–Fri, Sat, Sun
  const runs: Weekday[][] = [];
  for (const d of sorted) {
    const last = runs.at(-1);
    if (last && order.indexOf(d) === order.indexOf(last.at(-1)!) + 1) last.push(d);
    else runs.push([d]);
  }
  return runs
    .map((run) => (run.length > 2 ? `${short(run[0])}–${short(run.at(-1)!)}` : run.map(short).join(', ')))
    .join(', ');
}
