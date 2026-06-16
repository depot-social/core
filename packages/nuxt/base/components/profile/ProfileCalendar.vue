<template>
  <div class="container px-10">
    <BaseAvailabilityModal
      v-if="modalAvailability"
      :availability="modalAvailability"
      :resources="resources"
      @close="onCloseModal"
      @save="onSaveAvailability"
      @delete="onDeleteAvailability"
    />
    <div v-if="calendar && date" class="flex items-center justify-between">
      <h3 class="text-xl text-bold">{{ $t('bookingsAndAvailabilities') }}</h3>
      <div class="flex items-center gap-6">
        <h2 class="text-lg leading-none">
          {{ formatDate(date, 'MMMM yyyy') }}
        </h2>
        <div class="join">
          <button class="join-item btn btn-info" @click="gotoPrevMonth">
            <svg
              class="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button class="join-item btn btn-info" @click="gotoToday">
            {{ $t('today') }}
          </button>
          <button class="join-item btn btn-info" @click="gotoNextMonth">
            <svg
              class="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div
      id="dashboard-calendar"
      class="mt-8 text-gray-800 h-screen overflow-hidden rounded-lg"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type {
  AvailabilitiesGetDashboardResponseData,
  Availability,
  Booking,
  Resource,
} from '@depot/shared';
import { format, setHours } from 'date-fns';

enum CalendarType {
  AVAILABILITIES = '1',
  BOOKINGS = '2',
}

const NEW_APPOINTMENT_START_HOUR = 8;
const NEW_APPOINTMENT_END_HOUR = 18;

interface Props {
  dashboard: AvailabilitiesGetDashboardResponseData;
  resources: Resource[];
}

const props = defineProps<Props>();

const calendar = ref<any | null>(null);
const date = ref<Date | undefined>(undefined);
const modalAvailability = ref<Availability | undefined>(undefined);

const config = useRuntimeConfig();

const formatTime = (dateString: string | Date) => {
  return format(new Date(dateString), 'HH:mm') + ' ' + $t('oClock');
};

const formatDate = (date: Date, formatStr: string) => {
  return format(date, formatStr);
};

const mapAvailabilityToCalendarEvent = (availability: Availability) => ({
  id: availability.id.toString(),
  calendarId: CalendarType.AVAILABILITIES,
  title: availability.title,
  category: 'time',
  dueDateClass: '',
  start: availability.start,
  end: availability.end,
  raw: availability,
});

const mapBookingToCalendarEvent = (booking: Booking) => ({
  id: booking.id.toString(),
  calendarId: CalendarType.BOOKINGS,
  title: $t('booking') + ' ' + booking.title,
  category: 'time',
  dueDateClass: '',
  start: booking.start,
  end: booking.end,
  isReadOnly: true,
});

const updateLocalDate = () => {
  if (calendar.value) {
    date.value = calendar.value.getDate().toDate();
  }
};

const onBeforeUpdateEvent = async (updatedEvent: any) => {
  console.log('Event updated', updatedEvent);
  const { changes, event } = updatedEvent;

  if (!changes.start && !changes.end) {
    return;
  }

  const { id, calendarId, raw } = event;

  if (calendarId !== CalendarType.AVAILABILITIES) {
    return;
  }

  try {
    const cookies = useCookie('strapi_jwt');
    const jwt = cookies.value;

    if (!jwt) {
      return;
    }

    const updatedAvailability = await $fetch(
      `${config.public.strapiUrl}/api/availabilities/${id}?populate[]=resource`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: {
          data: {
            ...raw,
            ...(changes.start && { start: changes.start.toDate() }),
            ...(changes.end && { end: changes.end.toDate() }),
          },
        },
      }
    );

    if (!updatedAvailability || !updatedAvailability.data) {
      return;
    }

    const availability = updatedAvailability.data as Availability;

    if (calendar.value) {
      calendar.value.updateEvent(id, calendarId, {
        start: availability.start,
        end: availability.end,
        raw: availability,
      });
    }
  } catch (e) {
    console.error('Error updating availability', e);
  }
};

const onSelectDateTime = async (event: any) => {
  const start = setHours(event.start, NEW_APPOINTMENT_START_HOUR);
  const end = setHours(event.end, NEW_APPOINTMENT_END_HOUR);

  modalAvailability.value = {
    title: '',
    start,
    end,
    availableUnits: 0,
    resource: props.resources[0] ?? undefined,
  } as Availability;
};

const onClickEvent = (ev: any) => {
  const { event } = ev;
  const { calendarId, raw } = event;

  if (calendarId !== CalendarType.AVAILABILITIES) {
    // @todo If is booking, redirect to booking/:id
    return;
  }

  modalAvailability.value = raw as Availability;
};

const setCalendarEvents = () => {
  if (!calendar.value) return;

  calendar.value.on('beforeUpdateEvent', onBeforeUpdateEvent);
  calendar.value.on('selectDateTime', onSelectDateTime);
  calendar.value.on('clickEvent', onClickEvent);
};

const onCloseModal = () => {
  modalAvailability.value = undefined;
};

const onSaveAvailability = async (
  availability: Availability,
  isNew: boolean
) => {
  console.log('SAVED', availability);

  if (!calendar.value) return;

  if (isNew) {
    calendar.value.createEvents([mapAvailabilityToCalendarEvent(availability)]);
  } else {
    calendar.value.updateEvent(
      availability.id.toString(),
      CalendarType.AVAILABILITIES,
      mapAvailabilityToCalendarEvent(availability)
    );
  }
};

const onDeleteAvailability = async (availability: Availability) => {
  console.log('DELETED', availability);

  if (!calendar.value) return;

  calendar.value.deleteEvent(
    availability.id.toString(),
    CalendarType.AVAILABILITIES
  );
};

const fetchCalendarData = () => {
  if (!calendar.value || !props.dashboard) return;

  const { availabilities, bookingsResourceOwner, bookingsCustomer } =
    props.dashboard;

  if (!availabilities || !bookingsResourceOwner || !bookingsCustomer) {
    return;
  }

  // Create availabilities events
  calendar.value.createEvents(
    availabilities.map(mapAvailabilityToCalendarEvent)
  );

  // Create bookings on own resources
  calendar.value.createEvents(
    bookingsResourceOwner.map(mapBookingToCalendarEvent)
  );

  // Create bookings on other resources
  calendar.value.createEvents(bookingsCustomer.map(mapBookingToCalendarEvent));
};

const gotoPrevMonth = () => {
  if (calendar.value) {
    calendar.value.prev();
    updateLocalDate();
  }
};

const gotoNextMonth = () => {
  if (calendar.value) {
    calendar.value.next();
    updateLocalDate();
  }
};

const gotoToday = () => {
  if (calendar.value) {
    calendar.value.today();
    updateLocalDate();
  }
};

onMounted(async () => {
  /**
   * Implements "TUI Calendar", however neither its docs nor TS type exports
   * are very good.
   *
   * This is a client-only action as there is no way to pre-render the calendar on the server :(
   *
   * @see https://nhn.github.io/tui.calendar/latest/CalendarCore
   */
  const { default: Calendar } = await import('@toast-ui/calendar');
  await import('@toast-ui/calendar/dist/toastui-calendar.min.css');

  calendar.value = new Calendar('#dashboard-calendar', {
    defaultView: 'month',
    useFormPopup: false,
    useDetailPopup: false,
    usageStatistics: false,
    template: {
      time(event: any) {
        const { start, end, title, calendarId } = event;
        const isAvailCalendar = calendarId === CalendarType.AVAILABILITIES;
        const hoverTitle = isAvailCalendar
          ? $t('clickToEditAvailability')
          : $t('openBookingNewTab');
        return `<span style="color: ${
          isAvailCalendar ? '#006E80' : '#C82F09'
        };" title="${hoverTitle}">${formatTime(start)} - ${formatTime(end)}${
          title ? `: ${title}` : ''
        }</span>`;
      },
      allday(event: any) {
        const { title, calendarId } = event;
        const hoverTitle =
          calendarId === CalendarType.AVAILABILITIES
            ? $t('clickToEditAvailability')
            : $t('openBookingNewTab');
        return `<span style="background: blue;" title="${hoverTitle}">${title}</span>`;
      },
    },
    calendars: [
      {
        id: CalendarType.AVAILABILITIES,
        name: 'Availabilities',
        backgroundColor: '#DFFFFC',
      },
      {
        id: CalendarType.BOOKINGS,
        name: 'Bookings',
        backgroundColor: '#FFEDD5',
      },
    ],
  });

  updateLocalDate();
  setCalendarEvents();
  fetchCalendarData();
});
</script>
