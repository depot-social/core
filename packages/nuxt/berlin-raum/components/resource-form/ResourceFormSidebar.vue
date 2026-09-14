<template>
  <aside>
    <div class="flex flex-col h-max">
      <NuxtLinkLocale
        :to="{ name: 'resources' }"
        class="text-2lg font-light block"
      >
        {{ $t('berlin_resource_toOverview') }}
      </NuxtLinkLocale>
    </div>
  </aside>
</template>
