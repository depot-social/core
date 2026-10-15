export default defineAppConfig({
  ui: {
    calendar: {
      // @see https://ui.nuxt.com/docs/components/calendar#theme
      slots: {
        body: 'flex flex-col gap-8 pt-4 sm:flex-row sm:space-x-0',
        headingLabel: 'font-normal text-base',
        cell: 'w-full py-0.5',
      },
      variants: {
        view: {
          day: {
            gridRow: 'grid-cols-7 place-items-stretch',
          },
        },
      },
      compoundVariants: [
        {
          // One continuous orange pill from start to end date
          color: 'primary',
          variant: 'solid',
          class: {
            headCell: 'text-black font-normal',
            cellTrigger:
              'm-0 h-9 w-full rounded-none text-black data-selected:bg-orange-300 data-selected:text-black data-selection-start:rounded-l-full data-selection-end:rounded-r-full data-highlighted:bg-orange-100 data-highlighted-start:rounded-l-full data-highlighted-end:rounded-r-full data-today:not-data-selected:text-orange-500 hover:not-data-selected:bg-orange-100 hover:not-data-selected:rounded-full data-outside-view:invisible',
          },
        },
      ],
      defaultVariants: {
        size: 'lg',
      },
    },
    formField: {
      // @see https://ui.nuxt.com/docs/components/form-field#theme
      slots: {
        wrapper: 'raum-form-control',
        // label: 'font-light text-base', // bug: label slot is not overwriting base layer
        error: 'font-semibold text-sm',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
    input: {
      // @see https://ui.nuxt.com/docs/components/input#theme
      slots: {
        root: 'flex',
      },
      compoundVariants: [
        {
          // no variant and color / default
          class: 'raum-form-control',
        },
        {
          // input on surface color e.g. bg-secondary
          variant: 'soft',
          class: 'bg-[#F7F7F7]!',
        },
      ],
    },
    textarea: {
      // @see https://ui.nuxt.com/docs/components/textarea#theme
      slots: {
        root: 'flex',
      },
      compoundVariants: [
        {
          class: 'raum-form-control',
        },
        {
          variant: 'soft',
          class: 'bg-[#F7F7F7]!',
        },
      ],
    },
    button: {
      // @see https://ui.nuxt.com/docs/components/button#theme
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'ghost',
          class:
            'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-2.5 py-1.5 text-sm gap-1.5 text-default hover:bg-elevated active:bg-elevated outline-inverted/25 focus-visible:outline-3 hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent',
        },
        {
          color: 'primary',
          variant: 'solid',
          class:
            'mt-0 ring-0 text-center border-black border-2 rounded-lg py-3.5 px-6 w-max text-2lg cursor-pointer font-semibold bg-black text-white hover:bg-gray-800 hover:text-white active:bg-gray-800 focus-visible:bg-black disabled:border-gray-500 disabled:text-gray-600 focus-visible:text-white transition-colors leading-none h-auto shadow-none',
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'mt-0 ring-0 text-center border-black border-2 rounded-lg py-3.5 px-6 w-max text-2lg cursor-pointer font-semibold bg-white text-black hover:bg-black hover:text-white active:bg-gray-800 focus-visible:bg-black focus-visible:text-white disabled:border-gray-500 disabled:text-gray-600 transition-colors leading-none h-auto shadow-none',
        },
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
      },
    },
    select: {
      // @see https://ui.nuxt.com/docs/components/select#theme
      slots: {
        base: 'w-full px-0',
        content: 'w-full bg-white border-black border px-0!',
        trailingIcon: 'text-black',
        placeholder: 'text-sm text-black!',

        //base: 'h-12 rounded-lg bg-white text-base shadow-none!',
      },
      compoundVariants: [
        {
          class: 'h-full raum-form-control',
        },
        {
          // input on surface color e.g. bg-secondary
          variant: 'soft',
          class: 'bg-[#F7F7F7]!',
        },
      ],
    },
    selectMenu: {
      // @see https://ui.nuxt.com/docs/components/select-menu#theme
      slots: {},
      compoundVariants: [
        {
          class: 'raum-form-control',
        },
      ],
    },
    checkbox: {
      // @see https://ui.nuxt.com/docs/components/checkbox#theme
      slots: {
        base: 'sm:w-[24px] sm:h-[24px] border-black border flex grid',
        root: 'gap-2',
        label: 'font-text',
      },
    },
    tooltip: {
      slots: {
        content: 'text-sm py-2 px-1.5',
      },
    },
  },
});
