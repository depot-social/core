import L from 'leaflet';
import 'leaflet.markercluster';

// Fixes https://github.com/nuxt-modules/leaflet/issues/75
export default defineNuxtPlugin((nuxtApp) => ({
  provide: {
    L,
  },
}));
