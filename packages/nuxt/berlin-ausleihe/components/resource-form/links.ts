import { normalizeWebsiteUrl, type Link } from '@depot/shared';

/**
 * Builds the Strapi links update from the form, which edits only the first link.
 *
 * Returns undefined when nothing changed, so the caller can omit the links field.
 * Otherwise returns the full replacement list, preserving the remaining links.
 * Clearing the website removes only the first link, returning [] if none remain.
 */
export const getResourceLinksUpdate = (
  existingLinks: Link[] | null | undefined,
  website: string | null,
  websiteTitle: string | null
): Link[] | undefined => {
  const [currentWebsiteLink, ...remainingLinks] = existingLinks ?? [];
  const submittedUrl = website?.trim() ?? '';
  const submittedTitle = websiteTitle?.trim() ?? '';
  const currentUrl = currentWebsiteLink?.url.trim() ?? '';
  const currentTitle = currentWebsiteLink?.title?.trim() ?? '';
  const websiteIsUnchanged =
    submittedUrl === currentUrl && submittedTitle === currentTitle;

  // Compare before normalizing so unrelated edits never rewrite legacy URLs.
  if (websiteIsUnchanged) {
    return undefined;
  }

  if (submittedUrl === '') {
    return remainingLinks;
  }

  const normalizedUrl = normalizeWebsiteUrl(submittedUrl);
  if (!normalizedUrl) {
    throw new Error('Invalid website URL');
  }

  const updatedWebsiteLink: Link = {
    // Keep the component ID so Strapi updates the existing link.
    id: currentWebsiteLink?.id,
    url: normalizedUrl,
    title: submittedTitle,
  };

  return [updatedWebsiteLink, ...remainingLinks];
};
