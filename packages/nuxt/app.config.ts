export default defineAppConfig({
  ResourceCalendarStartTimeFrom: 8,
  ResourceCalendarEndTimeTill: 22,
  ui: {
    formField: {
      // @see https://ui.nuxt.com/docs/components/form-field#theme
      slots: {
        label: 'font-text font-bold',
        error: 'font-text font-bold',
      },
    },
    input: {
      // @see https://ui.nuxt.com/docs/components/input#theme
      slots: {
        root: 'flex',
        base: 'border border-black rounded-full',
      },
    },
    select: {
      slots: {
        base: 'px-4',
        content: 'bg-white px-4 border-black border',
      },
      compoundVariants: [
        {
          class: 'h-11 bg-white border border-black rounded-full',
        },
      ],
    },
    button: {
      slots: {
        base: [
          'btn btn-full btn-xl btn-primary block mt-4 self-start rounded-full',
        ],
      },
    },
    checkbox: {
      // @see https://ui.nuxt.com/docs/components/checkbox#theme
      slots: {
        base: 'sm:w-[24px] sm:h-[24px] border-black border flex grid',
        root: 'gap-2',
        label: 'font-text',
      },
    },
  },
});
