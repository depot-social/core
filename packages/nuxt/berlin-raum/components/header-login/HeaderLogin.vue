<template>
  <div class="header-login">
    <NuxtLinkLocale
      v-if="!user"
      :to="{ name: 'user-login' }"
      class="flex items-center text-base gap-1 text-[16px] font-semibold"
    >
      {{ $t('berlin_login_signIn') }}

      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M26 30H14C13.4696 30 12.9609 29.7893 12.5858 29.4142C12.2107 29.0391 12 28.5304 12 28V25H14V28H26V4H14V7H12V4C12 3.46957 12.2107 2.96086 12.5858 2.58579C12.9609 2.21071 13.4696 2 14 2H26C26.5304 2 27.0391 2.21071 27.4142 2.58579C27.7893 2.96086 28 3.46957 28 4V28C28 28.5304 27.7893 29.0391 27.4142 29.4142C27.0391 29.7893 26.5304 30 26 30Z"
          fill="#121212"
        />
        <path
          d="M14.59 20.59L18.17 17H4V15H18.17L14.59 11.41L16 10L22 16L16 22L14.59 20.59Z"
          fill="#121212"
        />
      </svg>
    </NuxtLinkLocale>

    <div v-else>
      <UDropdownMenu
        :items="items"
        size="xl"
        :modal="false"
        :ui="{
          content: 'max-w-56',
          itemLabel: 'overflow-auto whitespace-normal',
        }"
      >
        <button class="avatar avatar-online avatar-placeholder">
          <div
            class="cursor-pointer min-w-9 px-1 py-0.5 rounded-md bg-violet-100 border-2 border-black items-center justify-center flex text-base font-medium"
          >
            <span>{{ shortName }}</span>
          </div>
        </button>
      </UDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';
import { getUsernameAbbreviationFromUser } from '@depot/shared';
import type { DropdownMenuItem } from '@nuxt/ui';

const user = useStrapiUser() as Ref<User>;
const { logout } = useStrapiAuth();

const shortName = computed(() =>
  user.value ? getUsernameAbbreviationFromUser(user.value) : ''
);

const isOrganization = computed(() => !!user.value?.organization);
const organizationName = computed(() =>
  user.value?.organization ? user.value.organization.title : undefined
);

const onClickLogout = () => {
  logout();
  useToast().add({
    title: $t('logout_success'),
  });
  navigateTo('/');
};

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: isOrganization.value
        ? organizationName.value
        : `${user.value?.firstName} ${user.value?.lastName}`,
      type: 'label',
    },
  ],
  [
    {
      label: 'Übersicht',
      icon: 'i-lucide-layout-grid',
      onSelect() {
        navigateTo('/user');
      },
    },
    {
      label: 'Einstellungen',
      icon: 'i-lucide-cog',
      onSelect() {
        navigateTo('user/settings');
      },
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect() {
        onClickLogout();
      },
    },
  ],
]);
</script>
