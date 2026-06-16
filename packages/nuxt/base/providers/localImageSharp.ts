import { joinURL } from 'ufo';
import type { ProviderGetImage } from '@nuxt/image-edge';
import { createOperationsGenerator } from '#image';

/**
 * Integrates with local-image-sharp strapi plugin
 * @see https://github.com/nuxt/image/issues/641#issuecomment-1465018213
 */
export const getImage: ProviderGetImage = (
  src,
  { modifiers, baseURL = 'http://localhost:1337/uploads' } = {}
) => {
  const operationsGenerator = createOperationsGenerator({
    keyMap: {
      width: 'width',
      height: 'height',
      resize: 'resize',
      fit: 'fit',
      position: 'positon',
      trim: 'trim',
      format: 'format',
      quality: 'quality',
      rotate: 'rotate',
      enlarge: 'enlarge',
      flip: 'flip',
      flop: 'flop',
      sharpen: 'sharpen',
      median: 'median',
      gamma: 'gamma',
      negate: 'negate',
      normalize: 'normalize',
      threshold: 'threshold',
      grayscale: 'grayscale',
      animated: 'animated',
    },
    joinWith: ',',
    formatter: (key: string, value: string) => `${key}_${value}`,
  });

  const operations = operationsGenerator(modifiers as any);

  return {
    url: joinURL(baseURL, operations, src),
  };
};
