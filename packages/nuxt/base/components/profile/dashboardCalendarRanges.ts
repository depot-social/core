import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export type DashboardEvent = {
  id: string;
  type: 'availability' | 'booking';
  title: string;
  start: Date;
  end: Date;
  bookingDocumentId?: string;
};

export type DashboardRangeSegment = {
  event: DashboardEvent;
  start: Date;
  span: number;
  lane: number;
};

export type DashboardRangeLayout = {
  segments: DashboardRangeSegment[];
  segmentsByStartDay: Map<string, DashboardRangeSegment[]>;
  laneCountByDay: Map<string, number>;
};

export const getDashboardCalendarDateKey = (date: Date): string =>
  format(date, 'yyyy-MM-dd');

const getWeekLayoutKey = (month: Date, day: Date): string =>
  `${getDashboardCalendarDateKey(
    startOfMonth(month)
  )}:${getDashboardCalendarDateKey(startOfWeek(day, WEEK_OPTIONS))}`;

const getMondayBasedColumn = (date: Date): number => (date.getDay() + 6) % 7;

const compareSegments = (
  left: DashboardRangeSegment,
  right: DashboardRangeSegment
): number => {
  const startDifference = left.start.getTime() - right.start.getTime();
  if (startDifference !== 0) return startDifference;

  const spanDifference = right.span - left.span;
  if (spanDifference !== 0) return spanDifference;

  if (left.event.type !== right.event.type) {
    return left.event.type === 'availability' ? -1 : 1;
  }

  return left.event.id.localeCompare(right.event.id);
};

/**
 * Breaks events into the visible calendar rows and assigns a non-overlapping
 * vertical lane to every segment in a row. Months are separate grids, so an
 * event crossing a month boundary starts a new visual segment.
 */
export const createDashboardRangeLayout = (
  events: DashboardEvent[],
  visibleMonths: Date[]
): DashboardRangeLayout => {
  const monthsByKey = new Map(
    visibleMonths.map((month) => {
      const monthStart = startOfMonth(month);
      return [getDashboardCalendarDateKey(monthStart), monthStart];
    })
  );
  const segmentsByWeek = new Map<string, DashboardRangeSegment[]>();

  for (const event of events) {
    const eventStart = startOfDay(event.start);
    const eventEnd = startOfDay(event.end);

    if (isAfter(eventStart, eventEnd)) {
      continue;
    }

    for (const month of monthsByKey.values()) {
      const monthStart = startOfMonth(month);
      const monthEnd = startOfDay(endOfMonth(month));
      const visibleStart = isBefore(eventStart, monthStart)
        ? monthStart
        : eventStart;
      const visibleEnd = isAfter(eventEnd, monthEnd) ? monthEnd : eventEnd;

      if (isAfter(visibleStart, visibleEnd)) {
        continue;
      }

      let segmentStart = visibleStart;

      while (!isAfter(segmentStart, visibleEnd)) {
        const weekEnd = startOfDay(endOfWeek(segmentStart, WEEK_OPTIONS));
        const segmentEnd = isBefore(visibleEnd, weekEnd) ? visibleEnd : weekEnd;
        const segment: DashboardRangeSegment = {
          event,
          start: segmentStart,
          span: differenceInCalendarDays(segmentEnd, segmentStart) + 1,
          lane: 0,
        };
        const weekKey = getWeekLayoutKey(month, segmentStart);
        const weekSegments = segmentsByWeek.get(weekKey) ?? [];

        weekSegments.push(segment);
        segmentsByWeek.set(weekKey, weekSegments);
        segmentStart = addDays(segmentEnd, 1);
      }
    }
  }

  const laneCountByWeek = new Map<string, number>();
  const segments: DashboardRangeSegment[] = [];

  for (const [weekKey, weekSegments] of segmentsByWeek) {
    const laneEndColumns: number[] = [];

    for (const segment of weekSegments.sort(compareSegments)) {
      const segmentStartColumn = getMondayBasedColumn(segment.start);
      const segmentEndColumn = segmentStartColumn + segment.span - 1;
      const availableLane = laneEndColumns.findIndex(
        (laneEndColumn) => laneEndColumn < segmentStartColumn
      );

      segment.lane =
        availableLane === -1 ? laneEndColumns.length : availableLane;
      laneEndColumns[segment.lane] = segmentEndColumn;
      segments.push(segment);
    }

    laneCountByWeek.set(weekKey, laneEndColumns.length);
  }

  const segmentsByStartDay = new Map<string, DashboardRangeSegment[]>();

  for (const segment of segments) {
    const startDayKey = getDashboardCalendarDateKey(segment.start);
    const daySegments = segmentsByStartDay.get(startDayKey) ?? [];

    daySegments.push(segment);
    segmentsByStartDay.set(startDayKey, daySegments);
  }

  for (const daySegments of segmentsByStartDay.values()) {
    daySegments.sort((left, right) => left.lane - right.lane);
  }

  const laneCountByDay = new Map<string, number>();

  for (const month of monthsByKey.values()) {
    for (const day of eachDayOfInterval({
      start: month,
      end: endOfMonth(month),
    })) {
      const weekKey = getWeekLayoutKey(month, day);
      laneCountByDay.set(
        getDashboardCalendarDateKey(day),
        laneCountByWeek.get(weekKey) ?? 0
      );
    }
  }

  return { segments, segmentsByStartDay, laneCountByDay };
};
