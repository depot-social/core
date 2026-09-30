export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/search/:uid',
        handler: 'searchController.search',
        config: {
          prefix: '',
          policies: [],
          auth: false,
        },
      },
    ],
  },
};
