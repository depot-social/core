export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'POST',
        path: '/berlin-booking',
        handler: 'emailController.sendBerlinBookingEmail',
        config: {
          policies: [],
          auth: false,
        },
      },
      {
        method: 'POST',
        path: '/raffle-entry',
        handler: 'emailController.sendBerlinRaffleEntryEmail',
        config: {
          policies: [],
          auth: false,
        },
      },
    ],
  },
};
