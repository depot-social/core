export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/max-available',
        handler: 'availabilitiesController.getMaxAvailable',
        config: {
          policies: [],
          auth: false,
        },
      },
      {
        method: 'GET',
        path: '/calendar',
        handler: 'availabilitiesController.getCalendar',
        config: {
          policies: [],
          auth: false,
        },
      },
      {
        method: 'GET',
        path: '/dashboard',
        handler: 'availabilitiesController.getDashboard',
      },
    ],
  },
};
