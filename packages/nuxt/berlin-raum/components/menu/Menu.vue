<template>
  <USlideover
    v-model:open="open"
    :title="$t('navigation_title')"
    close-icon="i-ph-x"
    :close="{ size: 'xl', class: 'end-4 sm:end-6' }"
    :ui="{
      overlay: 'top-[70px] bg-white/40 backdrop-blur-sm',
      content: 'top-[70px] max-w-none md:max-w-4xl sm:ring-0',
      header: 'justify-end py-6',
      title: 'sr-only',
      body: 'p-0 sm:p-0',
    }"
  >
    <UButton
      icon="i-ph-list"
      color="neutral"
      variant="ghost"
      size="xl"
      :aria-label="$t('navigation_open')"
    />

    <template #body>
      <div class="grid md:grid-cols-2 min-h-full" @click="closeOnLink">
        <nav class="flex flex-col gap-2 bg-violet-100 p-6 lg:px-12 lg:py-8">
          <div :class="labelClass">{{ $t('berlin_menu_title') }}</div>
          <UNavigationMenu
            orientation="vertical"
            :items="instanceItems"
            trailing-icon="i-ph-caret-down"
            :ui="{
              ...menuUi,
              item: 'border-b border-black/20',
              linkTrailingBadge:
                'bg-transparent ring-0 font-normal text-sm text-muted',
              // Nested items start with the title text: icon (size-6) + gap-1.5
              childList: 'ms-7.5 border-0 pb-4',
              childItem: 'ps-0 ms-0',
            }"
          />
          <UNavigationMenu
            orientation="vertical"
            :items="metaItems"
            class="mt-auto"
            :external-icon="false"
            :ui="menuUi"
          />
        </nav>

        <nav
          class="flex flex-col gap-2 bg-very-bright-gray p-6 lg:px-12 lg:py-8"
        >
          <div :class="labelClass">{{ $t('berlin_to_parent') }}</div>
          <UNavigationMenu
            orientation="vertical"
            :items="mainItems"
            external-icon="i-ph-arrow-square-out"
            :ui="{
              ...mainUi,
              label: `px-0 ${labelClass}`,
              // Group spacing only via separators; the first one sits directly
              // under the brand like the item borders on the left
              root: 'gap-0',
              separator: 'my-3 first-of-type:mt-0 bg-black/20',
            }"
          />
          <UNavigationMenu
            orientation="vertical"
            :items="social"
            class="mt-auto"
            :external-icon="false"
            :ui="{
              ...mainUi,
              list: 'flex flex-wrap gap-x-6',
              linkLabel: `${menuUi.linkLabel} font-semibold underline`,
            }"
          />
        </nav>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(false);

// Close on every link click, also when it points to the current page
// (dropdown triggers are buttons and keep the menu open)
const closeOnLink = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest('a')) open.value = false;
};

const { data: navigation } = useNavigation('main');
const { data: metaItems } = useNavigation('meta');
const { home, groups, social } = useMainNavigation();

// Same label look on both sides (Nuxt UI's label slot has `py-1.5`)
const labelClass = 'py-1.5 text-sm/5 font-semibold uppercase text-blue-900';

// Shared look of all menus: black text and icons instead of Nuxt UI's muted defaults
const menuUi = {
  link: 'px-0 py-2 text-base text-black hover:text-black/70 before:hidden',
  linkLeadingIcon: 'text-black',
  linkTrailingIcon: 'text-black',
  // Flex label centers the external link icon vertically next to the text
  linkLabel: 'inline-flex items-center gap-2',
  linkLabelExternalIcon: 'size-5 text-black',
};

// Right column (engagiertes.berlin): larger leading icons, same link height as everywhere
const mainUi = {
  ...menuUi,
  linkLeadingIcon: 'size-6 text-black',
};

// Large first level items, same on both sides so they start at the same height
const topLevelUi = {
  link: 'py-4 text-2lg font-bold',
  linkLeadingIcon: 'size-6',
};

// Nested items share the default link style
const instanceItems = computed(() =>
  navigation.value.map((item) => ({ ...item, ui: topLevelUi }))
);

const mainItems = computed<NavigationMenuItem[][]>(() => {
  const [[offersLabel, ...offers] = [], knowledge = []] = groups.value;

  return [
    [{ ...home.value, ui: topLevelUi }],
    [{ ...offersLabel, class: 'normal-case text-base font-bold text-black' }],
    offers,
    knowledge,
  ];
});
</script>
