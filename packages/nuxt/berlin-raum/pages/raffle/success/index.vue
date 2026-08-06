<template>
  <div class="bg-very-bright-gray">
    <div
      class="px-6 xl:px-0 grid grid-cols-12 gap-5 max-w-[1620px] mx-auto pt-6 lg:pt-16"
    >
      <div class="col-span-12 grid grid-cols-12 gap-5">
        <div
          class="relative col-span-12 lg:col-span-8 lg:col-start-3 xl:col-span-6 xl:col-start-4 my-12 md:my-24"
        >
          <svg
            class="mb-3"
            width="29"
            height="20"
            viewBox="0 0 29 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M26.5837 0V2.17L1.98199 5.87C1.41901 5.95519 0.91083 6.20297 0.547936 6.56922C0.185043 6.93547 -0.00901224 7.39642 0.000321682 7.87V12.21C-0.00901224 12.6836 0.185043 13.1445 0.547936 13.5108C0.91083 13.877 1.41901 14.1248 1.98199 14.21L4.83365 14.56V18C4.83365 18.5304 5.08827 19.0391 5.54148 19.4142C5.99469 19.7893 6.60938 20 7.25032 20H16.917C17.5579 20 18.1726 19.7893 18.6258 19.4142C19.079 19.0391 19.3337 18.5304 19.3337 18V16.74L26.5837 17.83V20H29.0003V0H26.5837ZM16.917 18H7.25032V14.93L16.917 16.38V18ZM2.41699 12.17V7.83L26.5837 4.2V15.8L2.41699 12.17Z"
              fill="#121212"
            />
          </svg>

          <figure class="hidden md:block absolute right-0 top-24">
            <svg
              class="h-[150px] md:h-[298px] aspect-[317/497]"
              aria-hidden="true"
            >
              <use href="/illustrations/thumbs-up.svg#fragment" />
            </svg>
          </figure>

          <h1 class="font-bold text-6xl mb-4">
            {{ $t('berlin_raffle_success_title') }}
          </h1>

          <div class="md:max-w-[calc(100%-200px)]">
            <p class="text-lg font-light mb-6 max-w-[56ch]">
              {{ $t('berlin_raffle_success_description') }}
            </p>
          </div>

          <!-- newsletter cta and insta follow cta buttons -->
          <div class="w-full flex flex-col gap-8">
            <UButton
              to="https://www.instagram.com/engagiertes.berlin/"
              color="primary"
              variant="outline"
              class="w-max"
              target="_blank"
              external
            >
              {{ $t('berlin_instaFollow') }}
            </UButton>

            <div class="max-w-full">
              <form
                method="POST"
                action="https://95705b49.sibforms.com/serve/MUIFAGbUzNQ0b8FQ5PU7Anx-9qrxBriIrRcGMmfMXPOE01dy4vDt_0EZ_MpmbVdtuMyTjsBa5Q2mpoG1YEo3L8K1qNV5PHpZNm-ePg_KIYtJJG_0STO4DMrqVhFwXqGmnM81RfgaL2xDtXSbHsEn5irTM5n4bmD2b6EjkJwBxjdI1oilK6_IkHteZ4JvAOLS8RfggkwU-r68N2iI"
                @submit="console.log('submit form')"
              >
                <UFormField
                  :label="$t('berlin_raffle_form_raffleEmailLong')"
                  :ui="{ label: 'font-bold text-2lg mb-2' }"
                  name="EMAIL"
                >
                  <UInput
                    type="email"
                    class="lg:w-2/3"
                    :placeholder="
                      $t('berlin_resource_form_contactEmailPlaceholder')
                    "
                    required
                  />
                </UFormField>

                <UFormField
                  name="OPT_IN"
                  :ui="{ label: 'font-light text-base mb-3' }"
                  class="mt-4"
                >
                  <template #label>
                    <div class="flex items-start gap-2 lg:w-2/3">
                      <UCheckbox
                        size="xl"
                        :ui="{
                          base: 'w-8! h-8! md:w-10! md:h-10! border-black ring-black rounded-full mt-5',
                          indicator: 'p-1',
                        }"
                        required
                      />
                      <p
                        class="ml-2 text-lg lg:text-2lg leading-snug font-light tracking-[-1%]"
                      >
                        Ich habe die
                        <NuxtLink
                          class="underline underline-offset-3 decoration-[1px] font-light! text-black!"
                          to="https://engagiertes.berlin/de/datenschutz/"
                          target="_blank"
                          external
                        >
                          {{ 'Datenschutzerklärung' }}
                        </NuxtLink>
                        gelesen und bin mit der Verarbeitung meiner Daten zum
                        Versand des Newsletters einverstanden.
                      </p>
                    </div>
                  </template>
                </UFormField>

                <UButton
                  type="submit"
                  color="primary"
                  variant="outline"
                  class="w-max"
                >
                  {{ $t('berlin_submit') }}
                </UButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
