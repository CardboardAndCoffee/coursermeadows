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

  const overrideActive =
    settings.statusOverride !== 'auto' &&
    (!settings.overrideUntil || now < new Date(settings.overrideUntil));

  if (overrideActive && settings.statusOverride === 'open') {
    return {
      isOpen: true,
      reason: 'override',
      headline: 'Open now',
      detail: settings.overrideMessage || todaysCloseDetail(settings, local) || 'Come on by',
    };
  }
  if (overrideActive && settings.statusOverride === 'closed') {
    return {
      isOpen: false,
      reason: 'override',
      headline: 'Closed',
      detail: settings.overrideMessage || nextOpenDetail(settings, local, { skipToday: true }),
    };
  }

  const closure = closureOn(settings, local.date);
  if (closure) {
    return { isOpen: false, reason: 'closure', headline: 'Closed', detail: closure.label };
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
  return settings.closures.find((c) => c.from <= date && date <= c.to);
}

function openRowAt(settings: HoursSettings, weekday: Weekday, minutes: number) {
  return settings.hours.find(
    (row) => row.days.includes(weekday) && toMinutes(row.opens) <= minutes && minutes < toMinutes(row.closes),
  );
}

function todaysCloseDetail(settings: HoursSettings, local: LocalParts): string | undefined {
  const row = openRowAt(settings, local.weekday, local.minutes);
  return row ? `until ${formatTime(row.closes)}` : undefined;
}

/** "opens at 9 am", "opens tomorrow at 9 am", "opens Thursday at 9 am". */
function nextOpenDetail(settings: HoursSettings, local: LocalParts, opts: { skipToday?: boolean } = {}): string {
  for (let offset = opts.skipToday ? 1 : 0; offset <= LOOKAHEAD_DAYS; offset++) {
    const date = addDays(local.date, offset);
    if (closureOn(settings, date)) continue;
    const weekday = weekdayOf(date);
    const opening = settings.hours
      .filter((row) => row.days.includes(weekday))
      .map((row) => row.opens)
      .filter((opens) => offset > 0 || toMinutes(opens) > local.minutes)
      .sort((a, b) => toMinutes(a) - toMinutes(b))[0];
    if (!opening) continue;
    const when = offset === 0 ? '' : offset === 1 ? 'tomorrow ' : `${DAY_NAMES[weekday]} `;
    return `opens ${when}at ${formatTime(opening)}`;
  }
  return 'call ahead for hours';
}

export function formatTime(time: ClockTime): string {
  const minutes = toMinutes(time);
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
