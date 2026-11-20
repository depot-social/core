import { loadPublicResources } from '../../utils/resources';

export default defineEventHandler(async (event) => {
  const response = await loadPublicResources(event, {
    documentId: getRouterParam(event, 'documentId'),
  });
  return { data: response.data[0], meta: {} };
});
