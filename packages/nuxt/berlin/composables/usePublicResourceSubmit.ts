export const usePublicResourceSubmit = () => {
  const config = useRuntimeConfig();

  const createPublicResource = async (data: Record<string, unknown>) => {
    const strapiUrl = useStrapiUrl();
    const response = await fetch(`${strapiUrl}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.public.createResourceStrapiApiToken}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create resource');
    }

    return await response.json();
  };

  return {
    createPublicResource,
  };
};
