<template>
  <div class="header-login">
    <NuxtLink v-if="!user" :to="getLoginPath()" class="btn btn-primary">{{
      $t('login')
    }}</NuxtLink>
    <div v-else>
      <div class="flex gap-1">
        <div tabindex="0" class="dropdown dropdown-end dropdown-bottom">
          <details>
            <summary class="avatar avatar-online avatar-placeholder">
              <div
                class="transition-all bg-primary text-white rounded-full w-12 cursor-pointer hover:border-black border-transparent border-2"
              >
                <span>{{ shortName }}</span>
              </div>
            </summary>
            <ul
              class="p-4 shadow menu dropdown-content z-[1] bg-white rounded-box"
            >
              <li class="menu-title">
                {{ user.firstName }} {{ user.lastName }}
              </li>
              <li>
                <NuxtLink
                  :to="getUserProfilePath()"
                  title="Übersicht über Ressourcen, Buchungen und Kontoaktivitäten"
                >
                  {{ $t(`dashboard`) }}
                </NuxtLink>
              </li>
              <!-- <li>
                <NuxtLink
                  :to="getUserChatPath()"
                  title="Kontaktiere Anbieter:innen und Ausleiher:innen"
                >
                  {{ $t(`messages`) }}
                  <span class="badge badge-xs badge-primary">2</span>
                </NuxtLink>
              </li> -->
              <li>
                <NuxtLink :to="getUserSettingsPath()">
                  {{ $t(`myProfile`) }}
                </NuxtLink>
              </li>
              <li class="p-0">
                <button
                  class="btn btn-info bg-gray-100 btn-wide"
                  @click="onClickLogout"
                >
                  {{ $t(`logout`) }}
                </button>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';
import { getUsernameAbbreviationFromUser } from '@depot/shared';
import {
  getLoginPath,
  getUserChatPath,
  getUserProfilePath,
  getUserSettingsPath,
} from '~/base/utils/paths';

const user = useStrapiUser() as Ref<User>;

const shortName = computed(() =>
  user.value ? getUsernameAbbreviationFromUser(user.value) : ''
);

const { logout } = useStrapiAuth();

const onClickLogout = () => {
  logout();
  useToast().add({
    title: $t('logout_success'),
  });
  navigateTo('/');
};
</script>
