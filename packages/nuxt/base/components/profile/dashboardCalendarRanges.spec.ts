import { describe, expect, it } from 'vitest';
import {
  createDashboardRangeLayout,
  getDashboardCalendarDateKey,
  type DashboardEvent,
} from './dashboardCalendarRanges';

const date = (day: number, month = 8) => new Date(2026, month, day);

const event = (
  id: string,
  start: Date,
  end: Date,
  type: DashboardEvent['type'] = 'availability',
  bookingDocumentId?: string
): DashboardEvent => ({
  id,
  type,
  title: id,
  start,
  end,
  bookingDocumentId,
});

const september = date(1);
const october = date(1, 9);

describe('createDashboardRangeLayout', () => {
  it('renders a single-day event as a one-day segment', () => {
    const layout = createDashboardRangeLayout(
      [event('single', date(15), date(15))],
      [september]
    );

    expect(layout.segments).toHaveLength(1);
    expect(layout.segments[0]).toMatchObject({
      start: date(15),
      span: 1,
      lane: 0,
    });
  });

  it('keeps a range within one calendar week as one segment', () => {
    const layout = createDashboardRangeLayout(
      [event('workweek', date(14), date(18))],
      [september]
    );

    expect(layout.segments).toHaveLength(1);
    expect(layout.segments[0]).toMatchObject({
      start: date(14),
      span: 5,
      lane: 0,
    });
  });

  it('continues a range in a new segment after Sunday', () => {
    const layout = createDashboardRangeLayout(
      [event('wrap', date(20), date(22))],
      [september]
    );

    expect(layout.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ start: date(20), span: 1, lane: 0 }),
        expect.objectContaining({ start: date(21), span: 2, lane: 0 }),
      ])
    );
  });

  it('starts a new segment when a range crosses a displayed month', () => {
    const layout = createDashboardRangeLayout(
      [event('month-boundary', date(30), date(2, 9))],
      [september, october]
    );

    expect(layout.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ start: date(30), span: 1, lane: 0 }),
        expect.objectContaining({ start: date(1, 9), span: 2, lane: 0 }),
      ])
    );
  });

  it('places overlapping availability and booking ranges in separate lanes', () => {
    const layout = createDashboardRangeLayout(
      [
        event('availability', date(14), date(18)),
        event('booking', date(16), date(19), 'booking'),
      ],
      [september]
    );

    expect(layout.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: expect.objectContaining({ id: 'availability' }),
          lane: 0,
        }),
        expect.objectContaining({
          event: expect.objectContaining({ id: 'booking' }),
          lane: 1,
        }),
      ])
    );
    expect(
      layout.laneCountByDay.get(getDashboardCalendarDateKey(date(16)))
    ).toBe(2);
  });

  it('preserves a booking document ID for every range segment', () => {
    const layout = createDashboardRangeLayout(
      [event('booking', date(20), date(22), 'booking', 'booking-document-id')],
      [september]
    );

    expect(layout.segments).toHaveLength(2);
    expect(layout.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: expect.objectContaining({
            bookingDocumentId: 'booking-document-id',
          }),
        }),
      ])
    );
  });

  it('keeps every overlapping range without an overflow cap', () => {
    const layout = createDashboardRangeLayout(
      Array.from({ length: 4 }, (_, index) =>
        event(`overlap-${index}`, date(14), date(18))
      ),
      [september]
    );

    expect(layout.segments).toHaveLength(4);
    expect(layout.segments.map((segment) => segment.lane)).toEqual([
      0, 1, 2, 3,
    ]);
  });
});
