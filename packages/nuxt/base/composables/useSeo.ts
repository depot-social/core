import type { SingleTypePage } from '@depot/shared';

export const useSeo = (page: SingleTypePage) => {
  const seoMeta = computed(() => {
    if (!page.seo) return;

    return {
      title: page.seo.metaTitle ?? page.headline,
      description: page.seo.metaDescription,
      image: page.seo.metaImage
        ? useStrapiMedia(page.seo.metaImage.url)
        : undefined,
      canonical: page.seo.canonicalURL,
      robots: page.seo.metaRobots,
      viewport: page.seo.metaViewport,
      keywords: page.seo.keywords,
      ...(page.seo.openGraph
        ? {
            ...page.seo.openGraph,
            ogImage: page.seo.openGraph.ogImage
              ? useStrapiMedia(page.seo.openGraph.ogImage.url)
              : undefined,
          }
        : undefined),
    };
  });

  useSeoMeta(seoMeta.value);

  // @todo insert seo.structuredData into <body>
};
