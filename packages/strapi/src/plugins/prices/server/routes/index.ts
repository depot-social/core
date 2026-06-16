export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/resources/:id/price',
        handler: 'pricesController.getPrice',
        config: {
          prefix: '',
          policies: [],
          auth: false,
        },
      },
    ],
  },
};
