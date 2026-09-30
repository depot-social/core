export default {
  default: {
    // Per content-type search configuration keyed by full UID
    // (e.g. 'api::resource.resource'). See the search-service for the shape.
    contentTypes: {},
    // Upper bound of rows scanned per search request (in-memory matching).
    maxResults: 2000,
  },
  validator() {},
};
