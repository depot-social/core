export const useScrollToFirstError = () => {
  return (formRef: { $el?: HTMLElement }) => {
    nextTick(() => {
      const formEl = formRef?.$el as HTMLElement | undefined;
      if (!formEl) return;

      const firstErrorEl = formEl.querySelector<HTMLElement>(
        '[data-part="error-message"], .text-error, [class*="error"]'
      );

      if (firstErrorEl) {
        const field =
          firstErrorEl.closest<HTMLElement>('[name]') ?? firstErrorEl;
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = field.querySelector<HTMLElement>(
          'input, select, textarea'
        );
        focusable?.focus({ preventScroll: true });
      }
    });
  };
};
