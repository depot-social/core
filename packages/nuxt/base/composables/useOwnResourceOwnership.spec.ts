import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useOwnResourceOwnership } from './useOwnResourceOwnership';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('editor membership using the current own profile', () => {
  it('refreshes the own profile and compares document IDs', async () => {
    const fetchUser = vi
      .fn()
      .mockResolvedValue(ref({ resources: [{ id: 1, documentId: 'owned' }] }));
    vi.stubGlobal('useStrapiAuth', () => ({ fetchUser }));
    vi.stubGlobal('createError', (value: object) => value);
    const ownership = useOwnResourceOwnership();
    await ownership.assertOwnResource('owned');
    expect(fetchUser).toHaveBeenCalledOnce();
    await expect(ownership.assertOwnResource('1')).rejects.toMatchObject({
      statusCode: 403,
    });
    fetchUser.mockResolvedValueOnce(ref(null));
    await expect(ownership.assertOwnResource('owned')).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(fetchUser).toHaveBeenCalledTimes(3);
  });
});
