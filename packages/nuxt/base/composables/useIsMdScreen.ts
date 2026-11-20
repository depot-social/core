/**
 * Reactive flag for the tailwind `md` breakpoint (min-width: 48rem).
 * Always `false` during SSR and before mount, so mobile is the default.
 */
export const useIsMdScreen = () => {
  const isMd = ref(false);
  let mediaQuery: MediaQueryList | undefined;

  const onChange = (event: MediaQueryListEvent) => {
    isMd.value = event.matches;
  };

  onMounted(() => {
    mediaQuery = window.matchMedia('(min-width: 48rem)');
    isMd.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', onChange);
  });

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', onChange);
  });

  return isMd;
};
