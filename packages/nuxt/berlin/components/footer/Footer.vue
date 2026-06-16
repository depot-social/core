<template>
  <footer class="bg-background-300">
    <div
      class="flex flex-col xl:container sm:relative px-6 pb-[3.35rem] xl:pb-[4.75rem] min-h-[390px]"
    >
      <div
        class="flex flex-col gap-8 md:gap-0 sm:flex-row py-6 xl:pt-14 sm:mb-28 md:mb-28 xl:mb-40"
      >
        <header class="sm:basis-1/2 mt-8 sm:mt-0 hidden">
          <h2 class="text-xl 2xl:text-[63px] font-bold mb-8">
            engagiertes.berlin
          </h2>
        </header>

        <nav
          class="mt-2.5 sm:basis-2/3 md:basis-1/2 grid grid-cols-2 sm:grid-cols-3 row-auto gap-2 gap-y-7 sm:ml-auto"
        >
          <div class="flex flex-col col-span-1">
            <span class="font-bold">Über uns</span>
            <ul>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/konzept/"
                  external
                  >Konzept</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/danke/"
                  external
                  >Danke an</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/newsletter-anmeldung"
                  external
                  >Newsletter</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://www.instagram.com/engagiertes.berlin/"
                  external
                  >Instagram</NuxtLink
                >
              </li>
            </ul>
          </div>
          <div class="flex flex-col col-span-1">
            <span class="font-bold">Finder</span>
            <ul>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/events"
                  external
                  >Events</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/foerdermittel"
                  external
                  >Fördermittel</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/weiterbildungen"
                  external
                  >Weiterbildungen</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/tools"
                  external
                  >Tools</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/preise"
                  external
                  >Preise</NuxtLink
                >
              </li>
            </ul>
          </div>
          <div class="flex flex-col col-span-1">
            <span class="font-bold">Rechtliches</span>
            <ul>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/impressum"
                  >Impressum</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  class="hover:underline external-link"
                  to="https://engagiertes.berlin/de/datenschutz"
                  external
                  >Datenschutz</NuxtLink
                >
              </li>
            </ul>
          </div>
        </nav>

        <svg
          class="mt-auto static sm:absolute z-10 sm:bottom-36 md:bottom-0 sm:left-6 md:left-8 xl:left-14 w-[135px] md:w-[195px] xl:w-[277px] aspect-[318/309]"
          aria-hidden="true"
        >
          <use href="/illustrations/engagiertes-e.svg#fragment" />
        </svg>
      </div>

      <div
        class="lg:w-1/2 md:self-end grid grid-cols-2 md:grid-cols-[1fr_180px] gap-8 mt-8"
      >
        <!-- logo row -->
        <div class="flex flex-col gap-4">
          <span class="font-medium text-xs"> Gefördert von </span>

          <NuxtLink
            to="https://www.berlin.de/sen/kultgz/"
            aria-label="Berliner Senatsverwaltung für Kultur und Gesellschaftlichen Zusammenhalt"
            external
          >
            <svg
              class="h-24 sm:hidden aspect-[146/97]"
              viewBox="0 0 146 97"
              aria-hidden="true"
            >
              <use href="/logos/berlin-senat-mobile.svg#fragment" />
            </svg>

            <svg
              class="h-12 xl:h-14 2xl:h-16 hidden sm:block"
              viewBox="0 0 502 84"
              aria-hidden="true"
            >
              <use href="/logos/berlin-senat.svg#fragment" />
            </svg>
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-4">
          <span class="font-medium text-xs">
            Mit großer Unterstützung von
          </span>

          <NuxtLink
            class="flex h-full items-center"
            to="https://depot.social/?mtm_campaign=raum.engagiertes.berlin"
            aria-label="depot.social"
            external
          >
            <svg
              class="h-12 xl:h-14 2xl:h-16"
              viewBox="0 0 223 73"
              aria-hidden="true"
            >
              <use href="/logos/depot.svg#fragment" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
