<template>
  <aside>
    <div class="flex flex-col h-[calc(100dvh-3rem)]">
      <NuxtLinkLocale
        :to="{ name: 'resources' }"
        class="text-2lg font-light mb-4 block"
      >
        {{ $t('berlin_resource_toOverview') }}
      </NuxtLinkLocale>
    </div>
  </aside>
</template>
