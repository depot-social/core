import type { Resource, SingleTypePage } from '@depot/shared';

export default defineNuxtConfig({
  css: ['~/base/assets/css/main.css'],
  components: [{ path: './components', prefix: 'Base' }],
});
