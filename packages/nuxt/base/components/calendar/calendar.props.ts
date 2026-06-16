import type { CalendarDate } from "@depot/shared";

export interface OnChangeDateParams {
  start: Date | null;
  end: Date | null;
}

export interface CalendarViewProps {
  monthsCount?: number;
  startDate?: Date;
  endDate?: Date | null;
  allowGotoPast?: boolean;
  availabilities?: undefined | CalendarDate[];
}

export interface CalendarSelectionStore {
  startDate: Date | null;
  endDate: Date | null;
  selectionActive: boolean;
}

export interface CalendarMonthViewProps {
  month: Date;
  onClickDate: (date: Date) => void;
  selectionStore: CalendarSelectionStore;
  availabilities?: undefined | CalendarDate[];
}

export interface CalendarDaySlotProps {
  day: Date;
  dayId: number;
  onClickDate: (date: Date) => void;
  selectionStore: CalendarSelectionStore;
  availableUnits?: number;
}

export interface CalendarDayProps extends CalendarDaySlotProps {}

export type CalendarActiveSelection = {
  maxAvailableUnits: number;
  units: number;
  daysCount: number;
} & OnChangeDateParams;
