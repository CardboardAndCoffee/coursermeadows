import { describe, expect, it } from 'vitest';
import { describeHours, describeHoursInline, formatTime, getStoreStatus } from './store-status';
import type { SiteSettings } from './content/types';

type Settings = Parameters<typeof getStoreStatus>[0];

const base: Settings = {
  timeZone: 'America/New_York',
  hours: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], opens: '09:00', closes: '19:00' }],
  closures: [],
  statusOverride: 'auto',
};

// 2026-11-05 is a Thursday. New York is UTC-5 in November.
const at = (local: string) => new Date(`${local}-05:00`);

describe('getStoreStatus — regular hours', () => {
  it('is open during hours and says when it closes', () => {
    expect(getStoreStatus(base, at('2026-11-05T10:30'))).toEqual({
      isOpen: true, reason: 'hours', headline: 'Open now', detail: 'until 7 pm',
    });
  });

  it('is closed before opening and says it opens later today', () => {
    expect(getStoreStatus(base, at('2026-11-05T07:15')).detail).toBe('opens at 9 am');
  });

  it('is closed at closing time exactly', () => {
    const s = getStoreStatus(base, at('2026-11-05T19:00'));
    expect(s.isOpen).toBe(false);
    expect(s.detail).toBe('opens tomorrow at 9 am');
  });

  it('uses the farm time zone, not the visitor’s', () => {
    // 23:30 UTC is 6:30 pm in New York: still open.
    expect(getStoreStatus(base, new Date('2026-11-05T23:30:00Z')).isOpen).toBe(true);
  });

  it('handles daylight saving time', () => {
    // July: New York is UTC-4, so 13:30 UTC is 9:30 am.
    expect(getStoreStatus(base, new Date('2026-07-01T13:30:00Z')).isOpen).toBe(true);
    expect(getStoreStatus(base, new Date('2026-07-01T12:30:00Z')).isOpen).toBe(false);
  });

  it('names the weekday when the next opening is more than a day away', () => {
    const weekdaysOnly: Settings = {
      ...base,
      hours: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri'], opens: '09:00', closes: '17:00' }],
    };
    // Friday evening -> Monday
    expect(getStoreStatus(weekdaysOnly, at('2026-11-06T18:00')).detail).toBe('opens Monday at 9 am');
  });

  it('supports split hours on the same day', () => {
    const split: Settings = {
      ...base,
      hours: [
        { days: ['thu'], opens: '08:00', closes: '12:00' },
        { days: ['thu'], opens: '15:00', closes: '18:30' },
      ],
    };
    expect(getStoreStatus(split, at('2026-11-05T13:00')).detail).toBe('opens at 3 pm');
    expect(getStoreStatus(split, at('2026-11-05T16:00')).detail).toBe('until 6:30 pm');
  });

  it('falls back to a call-ahead message when no hours are set', () => {
    expect(getStoreStatus({ ...base, hours: [] }, at('2026-11-05T10:00')).detail).toBe('call ahead for hours');
  });
});

describe('getStoreStatus — closures', () => {
  const thanksgiving: Settings = {
    ...base,
    closures: [{ from: '2026-11-26', to: '2026-11-26', label: 'Closed for Thanksgiving' }],
  };

  it('is closed on a closure day even during hours', () => {
    expect(getStoreStatus(thanksgiving, at('2026-11-26T12:00'))).toEqual({
      isOpen: false, reason: 'closure', headline: 'Closed', detail: 'for Thanksgiving',
    });
  });

  it('does not repeat "Closed" when the label already starts with it', () => {
    const plain: Settings = { ...base, closures: [{ from: '2026-11-26', to: '2026-11-26', label: 'Thanksgiving Day' }] };
    expect(getStoreStatus(plain, at('2026-11-26T12:00')).detail).toBe('Thanksgiving Day');
  });

  it('skips closure days when saying when it next opens', () => {
    expect(getStoreStatus(thanksgiving, at('2026-11-25T20:00')).detail).toBe('opens Friday at 9 am');
  });

  it('reads closure dates in the CMS date-time format', () => {
    const cms: Settings = {
      ...base,
      closures: [{ from: '2026-11-26 00:00', to: '2026-11-26 00:00', label: 'Closed for Thanksgiving' }],
    };
    expect(getStoreStatus(cms, at('2026-11-26T12:00')).reason).toBe('closure');
    expect(getStoreStatus(cms, at('2026-11-27T12:00')).isOpen).toBe(true);
  });
});

describe('getStoreStatus — editor override', () => {
  it('forces closed with the editor’s message', () => {
    const s = getStoreStatus(
      { ...base, statusOverride: 'closed', overrideMessage: 'Closed today — snowed in' },
      at('2026-11-05T10:00'),
    );
    // Shown as "Closed today — snowed in", not "Closed Closed today…".
    expect(s).toEqual({ isOpen: false, reason: 'override', headline: 'Closed', detail: 'today — snowed in' });
  });

  it('forced open with an end time says how long it stays open', () => {
    const open = (until: string) => ({ ...base, statusOverride: 'open' as const, overrideUntil: until });
    // Open late tonight: past the regular 7 pm close.
    expect(getStoreStatus(open('2026-11-05T21:00:00-05:00'), at('2026-11-05T17:00')).detail).toBe('until 9 pm');
    // Override ends before the regular close: the regular hours carry on.
    expect(getStoreStatus(open('2026-11-05T15:00:00-05:00'), at('2026-11-05T10:00')).detail).toBe('until 7 pm');
    // Opened early on a closed morning, override runs into tomorrow.
    expect(getStoreStatus(open('2026-11-06T08:00:00-05:00'), at('2026-11-05T20:00')).detail).toBe('until tomorrow at 8 am');
    // Editor's message that repeats "Open".
    expect(getStoreStatus({ ...base, statusOverride: 'open', overrideMessage: 'Open late tonight' }, at('2026-11-05T20:00')).detail).toBe('late tonight');
  });

  it('forced closed without a message says when it next opens', () => {
    const s = getStoreStatus({ ...base, statusOverride: 'closed' }, at('2026-11-05T10:00'));
    expect(s.detail).toBe('opens tomorrow at 9 am');
  });

  it('forces open outside hours', () => {
    const s = getStoreStatus({ ...base, statusOverride: 'open' }, at('2026-11-05T21:00'));
    expect(s.isOpen).toBe(true);
    expect(s.reason).toBe('override');
  });

  it('expires at overrideUntil and goes back to the regular hours', () => {
    const settings: Settings = { ...base, statusOverride: 'closed', overrideUntil: '2026-11-05T12:00:00-05:00' };
    expect(getStoreStatus(settings, at('2026-11-05T11:59')).isOpen).toBe(false);
    expect(getStoreStatus(settings, at('2026-11-05T12:00')).isOpen).toBe(true);
  });

  it('reads the CMS end time as UTC', () => {
    // Storyblok "2026-11-05 17:00" is 17:00 UTC, noon in New York.
    const settings: Settings = { ...base, statusOverride: 'closed', overrideUntil: '2026-11-05 17:00' };
    expect(getStoreStatus(settings, at('2026-11-05T11:59')).isOpen).toBe(false);
    expect(getStoreStatus(settings, at('2026-11-05T12:00')).isOpen).toBe(true);
  });

  it('forced closed with an end time says when it reopens', () => {
    const closed = (until: string) => ({ ...base, statusOverride: 'closed' as const, overrideUntil: until });
    // Ends during opening hours: reopens right then.
    expect(getStoreStatus(closed('2026-11-05T12:00:00-05:00'), at('2026-11-05T10:00')).detail).toBe('opens at 12 pm');
    // Ends tomorrow afternoon.
    expect(getStoreStatus(closed('2026-11-06T15:00:00-05:00'), at('2026-11-05T10:00')).detail).toBe('opens tomorrow at 3 pm');
    // Ends after closing time: next morning.
    expect(getStoreStatus(closed('2026-11-05T20:00:00-05:00'), at('2026-11-05T10:00')).detail).toBe('opens tomorrow at 9 am');
  });
});

describe('formatting', () => {
  it('formats times', () => {
    expect(formatTime('09:00')).toBe('9 am');
    expect(formatTime('12:00')).toBe('12 pm');
    expect(formatTime('00:30')).toBe('12:30 am');
    expect(formatTime('19:45')).toBe('7:45 pm');
  });

  it('describes the weekly schedule', () => {
    const hours: SiteSettings['hours'] = [
      { days: ['mon', 'tue', 'wed', 'thu', 'fri'], opens: '09:00', closes: '19:00' },
      { days: ['sat', 'sun'], opens: '08:00', closes: '12:00' },
    ];
    expect(describeHours(hours)).toEqual(['Mon–Fri 9 am – 7 pm', 'Sat, Sun 8 am – 12 pm']);
    expect(describeHours(base.hours)).toEqual(['Every day 9 am – 7 pm']);
  });

  it('describes the hours mid-sentence without lowercasing day names', () => {
    expect(describeHoursInline(base.hours)).toBe('every day 9 am – 7 pm');
    expect(
      describeHoursInline([
        { days: ['mon', 'tue', 'wed', 'thu', 'fri'], opens: '09:00', closes: '17:00' },
        { days: ['sat'], opens: '08:00', closes: '12:00' },
      ]),
    ).toBe('Mon–Fri 9 am – 5 pm, Sat 8 am – 12 pm');
  });
});
