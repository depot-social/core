import { loadPublicResources } from '../../../utils/resources';

export default defineEventHandler(async (event) => {
  const response = await loadPublicResources(event, {
    slug: getRouterParam(event, 'slug'),
  });
  return { data: response.data[0], meta: {} };
});
