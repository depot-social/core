<script setup lang="ts">
import type {
  AvailabilitiesGetCalendarResponseData,
  BerlinResourceType,
  Resource,
} from '@depot/shared';
import { format } from 'date-fns';
import { marked } from 'marked';

import {
  getUsernameAbbreviationFromUser,
  getUsernameFromUser,
} from '@depot/shared';

const props = defineProps<{
  resource: Resource;
  user: Resource['user'];
  documentId: string;
  resourceType?: BerlinResourceType;
  accessibilityText?: string;
  isPaid: boolean;
}>();

const { find } = useStrapi();

const { documentId, resource } = props;

const markdownDescription = computed(() =>
  resource?.description ? marked(resource.description) : ''
);

// Fetch calendar data
const start = new Date();
const end = new Date();
end.setDate(end.getDate() + 182);

const calendarResponse = await useAsyncData('calendar', () =>
  find<AvailabilitiesGetCalendarResponseData>(
    `plugin-availabilities/calendar?start=${format(
      start,
      'yyyy-MM-dd'
    )}&end=${end.toISOString()}&resource_id=${documentId}`
  )
);

const availabilities = calendarResponse.data
  .value as unknown as AvailabilitiesGetCalendarResponseData;
</script>

<template>
  <div class="grid grid-cols-12 gap-5">
    <!-- Resource quick information and map -->
    <div
      class="col-span-12 md:col-span-6 lg:col-span-5 md:sticky md:top-[20px] self-start mb-8 space-y-6"
    >
      <h1
        v-if="resource?.title"
        class="text-3xl xl:text-6xl mb-6 font-bold leading-tightest"
      >
        {{ resource.title }}
      </h1>

      <span class="sr-only">{{ $t('resource_description') }}</span>
      <div class="html-content" v-html="markdownDescription" />

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-5 mb-8"
      >
        <div class="flex flex-col">
          <span class="text-base font-light leading-tight">
            <!-- TODO: Nutzungsart und andere wiederkehrende Attribute; auch nutzbar machen für die Verwendung -->
            <!-- {{ $t('berlin_resource_usage') }} -->
            Nutzungsart
          </span>

          <span class="text-xl font-semibold"> Kostenlos </span>
        </div>
      </div>

      <div v-if="resource.user" class="flex flex-col">
        <span class="text-base font-medium">{{ $t('resource_provider') }}</span>
        <div class="flex items-start mt-3 gap-3">
          <div class="avatar avatar-placeholder">
            <div class="bg-primary text-white rounded-full w-18">
              <span>
                {{ getUsernameAbbreviationFromUser(user) }}
              </span>
            </div>
          </div>
          <div class="flex flex-col">
            <p class="font-sans">
              {{ getUsernameFromUser(user) }}
            </p>
            <p class="text-gray-800">
              {{ $t('resource_memberSince') }}
              {{ format(user.createdAt, 'MMM yyyy') }}
            </p>
            <!-- <ul class="flex gap-2 mt-4 text-base">
                <li class="badge badge-sm border-0">4 Ressourcen</li>
                <li class="badge badge-sm badge-accent">
                  <i class="ph ph-checks mr-2"></i>
                  Gemeinwohl Akteur
                </li>
              </ul> -->
          </div>
        </div>
      </div>

      <div v-if="resource.address">
        <BaseResourceMap class="m-0!" :resource="resource" :with-link="false">
          <span class="text-base font-medium pb-3 block">{{
            $t('resource_location')
          }}</span>
        </BaseResourceMap>
      </div>
    </div>

    <!-- Resource information -->
    <div class="col-span-12 md:col-span-6 md:col-start-7">
      <h2 class="font-semibold text-xl mt-6 mb-5 sm:mb-7">
        {{ $t('berlin_resource_title') }}
      </h2>

      <div
        class="grid sm:grid-cols-[200px_1fr] md:grid-cols-[100px_1fr] lg:grid-cols-[155px_1fr] *:leading-snug *:even:mb-5 sm:*:even:mb-0 *:font-light sm:*:flex sm:*:items-start sm:*:py-[1.15rem] sm:*:border-b *:border-b-secondary gap-x-6"
      >
        <template v-if="resource.district">
          <span class="text-sm">
            {{ $t('berlin_resource_district') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resource.district.name }}
          </span>
        </template>

        <!-- TODO: Show Adress only :when: -->
        <template v-if="resource.address?.street">
          <span class="text-sm">
            {{ $t('berlin_resource_address') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resource.address.street }}
          </span>
        </template>

        <template v-if="resource.address?.zip">
          <span class="text-sm">
            {{ $t('berlin_resource_zip') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resource.address.zip }}
          </span>
        </template>

        <template v-if="resource.links?.length">
          <span class="text-sm">
            {{ $t('berlin_resource_website') }}
          </span>

          <span>
            <NuxtLink
              :href="resource.links[0]?.url"
              class="text-base font-light lg:text-lg break-all hover:underline underline-offset-2 decoration-1"
              external
            >
              {{
                resource.links[0]?.url?.match(/^https?:\/\/[^/]+/)?.[0] ??
                resource.links[0]?.url
              }}
            </NuxtLink>
          </span>
        </template>
      </div>

      <div class="flex mt-7 mb-8 md:mt-28">
        <BaseResourceCalendar
          :resource="resource"
          :availabilities="availabilities"
        />
      </div>
    </div>
  </div>
</template>
