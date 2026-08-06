export default defineAppConfig({
  ui: {
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
          // regardless of the color and variant,
          // we want to apply the same styles to all inputs
          class: 'raum-form-control',
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
      ],
    },
    button: {
      // @see https://ui.nuxt.com/docs/components/button#theme
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'mt-0 ring-0 text-center border-black border-2 rounded-lg py-3.5 px-6 w-full text-2lg cursor-pointer font-semibold bg-black text-white hover:bg-gray-800 hover:text-white active:bg-gray-800 focus-visible:bg-black focus-visible:text-white transition-colors leading-none h-auto shadow-none',
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'mt-0 ring-0 text-center border-black border-2 rounded-lg py-3.5 px-6 w-full text-2lg cursor-pointer font-semibold bg-white text-black hover:bg-black hover:text-white active:bg-gray-800 focus-visible:bg-black focus-visible:text-white transition-colors leading-none h-auto shadow-none',
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
        content: 'w-full bg-white border-black border',
        trailingIcon: 'text-black',
      },
      compoundVariants: [
        {
          class: 'h-full raum-form-control',
        },
      ],
    },
    selectMenu: {
      // @see https://ui.nuxt.com/docs/components/select-menu#theme
      slots: {
        base: '',
      },
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
  },
});
