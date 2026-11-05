import { describe, expect, it } from 'vitest';
import { describeHours, formatTime, getStoreStatus } from './store-status';
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
      isOpen: false, reason: 'closure', headline: 'Closed', detail: 'Closed for Thanksgiving',
    });
  });

  it('skips closure days when saying when it next opens', () => {
    expect(getStoreStatus(thanksgiving, at('2026-11-25T20:00')).detail).toBe('opens Friday at 9 am');
  });
});

describe('getStoreStatus — editor override', () => {
  it('forces closed with the editor’s message', () => {
    const s = getStoreStatus(
      { ...base, statusOverride: 'closed', overrideMessage: 'Closed today — snowed in' },
      at('2026-11-05T10:00'),
    );
    expect(s).toEqual({ isOpen: false, reason: 'override', headline: 'Closed', detail: 'Closed today — snowed in' });
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
});
