<script setup lang="ts">
import type { BerlinResourceType, Resource } from '@depot/shared';

const props = defineProps<{
  resource: Resource;
  resourceType?: BerlinResourceType;
  accessibilityText?: string;
  isPaid: boolean;
}>();

const localePath = useLocalePath();

const bookingPath = computed(() => {
  return localePath({
    name: 'bookings-add',
    query: {
      resource_id: props.resource.documentId,
    },
  });
});

const normalizedCapacity = computed(() => {
  return props.resourceType?.maxCapacity?.replace(/\s*[-–—]\s*/g, '-');
});

const formattedPublishedAt = computed(() => {
  const value = props.resourceType?.offerPublishedAt;

  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
});
</script>

<template>
  <div class="grid grid-cols-12 gap-5">
    <!-- Resource quick information and map -->
    <div
      class="col-span-12 md:col-span-6 lg:col-span-5 md:sticky md:top-[20px] self-start mb-8"
    >
      <h1
        v-if="resourceType?.roomName"
        class="text-3xl xl:text-6xl mb-6 font-bold leading-tightest"
      >
        {{ resourceType.roomName }}
      </h1>

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-5 mb-8"
      >
        <div v-if="resourceType?.roomSizeSqm" class="flex flex-col">
          <span class="text-base font-light leading-tight">
            {{ $t('berlin_resource_roomSizeSqm') }}
          </span>

          <span class="text-xl font-semibold">
            {{ resourceType.roomSizeSqm }}
          </span>
        </div>

        <div v-if="normalizedCapacity" class="flex flex-col">
          <span class="text-base font-light leading-tight">
            {{ $t('berlin_resource_maxCapacity') }}
          </span>

          <span class="text-xl font-semibold">
            {{ normalizedCapacity }}
          </span>
        </div>

        <div v-if="accessibilityText" class="flex flex-col">
          <span class="text-base font-light leading-tight">
            {{ $t('berlin_resource_accessibilityState') }}
          </span>

          <span class="text-xl font-semibold leading-none">
            {{ accessibilityText }}
          </span>
        </div>

        <div v-if="isPaid" class="flex flex-col">
          <span class="text-base font-light leading-tight">
            {{ $t('berlin_resource_usageType') }}
          </span>

          <span class="text-xl font-semibold leading-none">
            {{ $t('berlin_resource_isPaid') }}
          </span>
        </div>
      </div>

      <BaseResourceMap class="m-0!" :resource="resource" :with-link="false" />
    </div>

    <!-- Resource information -->
    <div class="col-span-12 md:col-span-6 md:col-start-7">
      <h2 class="font-semibold text-xl mt-6 mb-5 sm:mb-7">
        {{ $t('berlin_resource_title') }}
      </h2>

      <div
        class="grid sm:grid-cols-[200px_1fr] md:grid-cols-[100px_1fr] lg:grid-cols-[155px_1fr] *:leading-snug *:even:mb-5 sm:*:even:mb-0 *:font-light sm:*:flex sm:*:items-start sm:*:py-[1.15rem] sm:*:border-b *:border-b-secondary gap-x-6"
      >
        <template v-if="resourceType?.provider">
          <span class="text-sm sm:border-t-2 sm:border-t-gray-700">
            {{ $t('berlin_resource_provider') }}
          </span>

          <span class="text-lg sm:border-t-2 sm:border-t-gray-700">
            {{ resourceType.provider }}
          </span>
        </template>

        <template v-if="resource.district">
          <span class="text-sm">
            {{ $t('berlin_resource_district') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resource.district.name }}
          </span>
        </template>

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

        <template v-if="resourceType?.initialRoomName">
          <span class="text-sm">
            {{ $t('berlin_resource_initialRoomName') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.initialRoomName }}
          </span>
        </template>

        <template v-if="resourceType?.roomName">
          <span class="text-sm">
            {{ $t('berlin_resource_roomName') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.roomName }}
          </span>
        </template>

        <template v-if="resourceType?.roomSizeSqm">
          <span class="text-sm">
            {{ $t('berlin_resource_roomSizeSqm') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.roomSizeSqm }}
          </span>
        </template>

        <template v-if="normalizedCapacity">
          <span class="text-sm">
            {{ $t('berlin_resource_maxCapacity') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ normalizedCapacity }}
          </span>
        </template>

        <template v-if="resourceType?.facilities">
          <span class="text-sm">
            {{ $t('berlin_resource_facilities') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.facilities }}
          </span>
        </template>

        <template v-if="resourceType?.facilitiesAdditionalInfo">
          <span class="text-sm">
            {{ $t('berlin_resource_facilitiesAdditionalInfo') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.facilitiesAdditionalInfo }}
          </span>
        </template>

        <template v-if="accessibilityText">
          <span class="text-sm">
            {{ $t('berlin_resource_accessibilityState') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ accessibilityText }}
          </span>
        </template>

        <template v-if="resourceType?.accessibilityInfo">
          <span class="text-sm">
            {{ $t('berlin_resource_accessibilityInfo') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.accessibilityInfo }}
          </span>
        </template>

        <template v-if="resourceType?.usageHours">
          <span class="text-sm">
            {{ $t('berlin_resource_usageHours') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.usageHours }}
          </span>
        </template>

        <template v-if="resourceType?.usageFeeDetails">
          <span class="text-sm">
            {{ $t('berlin_resource_usageFeeDetails') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.usageFeeDetails }}
          </span>
        </template>

        <template v-if="resourceType?.contactPerson">
          <span class="text-sm">
            {{ $t('berlin_resource_contactPerson') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.contactPerson }}
          </span>
        </template>

        <template v-if="resourceType?.contactPhone">
          <span class="text-sm">
            {{ $t('berlin_resource_contactPhone') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ resourceType.contactPhone }}
          </span>
        </template>

        <template v-if="formattedPublishedAt">
          <span class="text-sm">
            {{ $t('berlin_resource_offerPublishedAt') }}
          </span>

          <span class="text-base lg:text-lg">
            {{ formattedPublishedAt }}
          </span>
        </template>
      </div>

      <div class="flex mt-7 mb-8 md:mt-28">
        <UButton color="primary" variant="outline" :to="bookingPath">
          {{ $t('berlin_booking_form_requestRoom') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
