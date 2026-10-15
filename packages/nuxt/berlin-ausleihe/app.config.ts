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
            headCell: 'text-orange-300 font-normal',
            cellTrigger:
              'm-0 h-9 w-full rounded-none text-black data-selected:bg-orange-300 data-selected:text-white data-selection-start:rounded-l-full data-selection-end:rounded-r-full data-highlighted:bg-orange-100 data-highlighted-start:rounded-l-full data-highlighted-end:rounded-r-full data-today:not-data-selected:text-orange-500 hover:not-data-selected:bg-orange-100 hover:not-data-selected:rounded-full data-outside-view:invisible',
          },
        },
      ],
      defaultVariants: {
        size: 'lg',
      },
    },
  },
});
