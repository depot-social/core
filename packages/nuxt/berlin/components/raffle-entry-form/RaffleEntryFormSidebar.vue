<template>
  <aside>
    <div class="flex flex-col md:h-[calc(100dvh-3rem)]">
      <div class="w-full md:pr-6">
        <NuxtLinkLocale
          :to="{ name: 'resources' }"
          class="text-2lg font-light mb-4 block hidden"
        >
          {{ $t('berlin_resource_toOverview') }}
        </NuxtLinkLocale>

        <svg
          class="max-w-[240px] lg:max-w-[285px] xl:max-w-none static w-full px-6 -mt-8 md:mt-0 md:absolute md:-right-8 lg:right-0 md:z-[-1] md:-bottom-8 md:pr-8 md:w-[320px] aspect-[605/669]"
          aria-hidden="true"
        >
          <use href="/illustrations/schluessel-tresor.svg#fragment" />
        </svg>

        <svg
          class="lg:hidden w-full pr-6 max-w-sm aspect-[552/285] -mt-1 mb-0 md:mb-6"
          aria-hidden="true"
        >
          <title>Gemeinsam öffnen wir Türen</title>
          <use href="/illustrations/raffle-claim-mobile.svg#fragment" />
        </svg>

        <svg
          class="hidden lg:block w-2/3 pr-6 md:pr-0 md:w-full aspect-[778/177] mb-6"
          aria-hidden="true"
        >
          <title>Gemeinsam öffnen wir Türen</title>
          <use href="/illustrations/raffle-claim.svg#fragment" />
        </svg>
      </div>

      <div class="hidden md:flex flex-col gap-2">
        <strong class="text-lg">
          {{ $t('berlin_raffle_form_tableOfContents') }}
        </strong>
        <ul>
          <li
            v-for="link in tocLinks"
            :key="link.id"
            class="bg-[#D4AFFF] mb-1 last:mb-0 w-max pr-0.5"
          >
            <a
              :href="`#${link.id}`"
              class="text-base hover:underline text-black font-light"
            >
              {{ link.text }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const tocLinks = [
  {
    id: 'raffle-entry',
    text: $t('berlin_raffle_form_participationGeneralTitle'),
  },
  { id: 'general', text: $t('berlin_resource_form_generalTitle') },
  { id: 'address', text: $t('address_title') },
  {
    id: 'barrierefreiheit',
    text: $t('berlin_resource_form_accessibilityTitle'),
  },
  { id: 'facilities', text: $t('berlin_resource_form_facilitiesTitle') },
  { id: 'usage', text: $t('berlin_resource_form_usageDetailsTitle') },
  { id: 'contact', text: $t('berlin_resource_form_contactTitle') },
];
</script>
