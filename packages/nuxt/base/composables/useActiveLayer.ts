/**
 * Runtime access to the topmost layer of NUXT_LAYERS.
 * @example NUXT_LAYERS=./berlin-ausleihe,./berlin-raum -> 'berlin-ausleihe'
 * const { activeLayer, isLayer } = useActiveLayer();
 */
export const useActiveLayer = () => {
  const activeLayer = useRuntimeConfig().public.activeLayer as string;

  const isLayer = (name: string) =>
    activeLayer === name.trim().replace(/^\.?\/+/, '').replace(/\/+$/, '');

  return {
    activeLayer,
    isLayer,
  };
};