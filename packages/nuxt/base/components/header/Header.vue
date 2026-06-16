<template>
  <header class="container mt-2 lg:mt-6 px-0">
    <div class="navbar text-base">
      <div class="navbar-start">
        <NuxtLink to="/" class="w-[140px] lg:w-[220px]">
          <img src="/logo.svg" alt="depot Logo" width="1690" height="333" />
          <!-- <Logo width="220px" /> -->
        </NuxtLink>
      </div>
      <div class="navbar-center"></div>
      <div class="navbar-end gap-2 lg:gap-4">
        <ul class="menu menu-horizontal px-1 hidden lg:flex">
          <li v-if="false && session">
            <div tabindex="0" class="dropdown dropdown-end dropdown-bottom">
              <details>
                <summary>Ressourcen</summary>
                <ul class="p-2 bg-white dropdown-content">
                  <li>
                    <NuxtLinkLocale :to="{ name: 'resources' }"
                      >Suche</NuxtLinkLocale
                    >
                  </li>
                  <li>
                    <div class="py-2 px-4">
                      <NuxtLink :to="getResourcesAddPath()" class="">
                        Ressource anlegen
                      </NuxtLink>
                    </div>
                  </li>
                </ul>
              </details>
            </div>
          </li>
          <li v-else>
            <NuxtLinkLocale :to="{ name: 'resources' }"
              >Ressourcen</NuxtLinkLocale
            >
          </li>
          <li>
            <NuxtLink :to="getFaqsPath()">FAQs</NuxtLink>
          </li>
          <!-- <li>
            <NuxtLink :to="getBlogPath()">Blog</NuxtLink>
          </li> -->
        </ul>
        <!-- <RegionSelectModal />
        <button
          class="aspect-square bg-orange-200 transition-all hover:bg-white hover:border-black border-transparent border-2 rounded-full grid place-content-center"
          title="depot Region wechseln"
          @click="openRegionSelectModal"
        >
          <i class="ph ph-map-trifold py-[5px] px-[11px] text-2lg"></i>
        </button> -->
        <GlobalSearchModal />
        <button
          class="aspect-square bg-orange-200 transition-all hover:bg-white hover:border-black border-transparent border-2 rounded-full grid place-content-center"
          title="Schnellsuche öffnen"
          @click="openGlobalSearchModal"
        >
          <i class="ph ph-magnifying-glass py-[5px] px-[11px] text-2lg"></i>
        </button>
        <HeaderLogin />
        <div class="dropdown dropdown-end dropdown-bottom">
          <label tabindex="0" class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabindex="0"
            class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <NuxtLinkLocale :to="{ name: 'resources' }">Ressourcen</NuxtLinkLocale>
            </li>
            <li>
              <NuxtLink :to="getFaqsPath()">FAQs</NuxtLink>
            </li>
            <!-- <li>
              <NuxtLink :to="getBlogPath()">Blog</NuxtLink>
            </li> -->
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import GlobalSearchModal from '~/base/components/global-search-modal/GlobalSearchModal.vue';
import HeaderLogin from '~/base/components/header-login/HeaderLogin.vue';
import { getFaqsPath, getResourcesAddPath } from '~/base/utils/paths';

// Mock session for now - will be replaced with actual auth
const session = ref(null);

const openGlobalSearchModal = () => {
  const globalSearchModal = document.getElementById(
    'global-search-modal'
  ) as any;
  if (globalSearchModal) {
    globalSearchModal.showModal();
  }
};

const openRegionSelectModal = () => {
  const regionSelectModal = document.getElementById(
    'region-select-modal'
  ) as any;
  if (regionSelectModal) {
    regionSelectModal.showModal();
  }
};
</script>
