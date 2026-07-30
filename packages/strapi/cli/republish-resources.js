/**
 * Re-saves and re-publishes all published resources so component fields
 * (notably `address`) are restored on the published Document Service version.
 *
 * Usage:
 *   DRY_RUN=true pnpm --filter @depot/strapi cli:republish-resources
 *   pnpm --filter @depot/strapi cli:republish-resources
 */
const path = require('path');
const Module = require('module');
const { createStrapi } = require('@strapi/strapi');

// Help pnpm-isolated packages (e.g. internal Strapi plugins) resolve app deps
const appNodeModules = path.join(__dirname, '..', 'node_modules');
process.env.NODE_PATH = [appNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

const UID = 'api::resource.resource';
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  // Same loading path as `strapi start` (uses existing build output)
  const appDir = process.cwd();
  const distDir = path.join(appDir, 'dist');
  const app = await createStrapi({ appDir, distDir }).load();
  let failed = 0;

  try {
    let processed = 0;
    let skipped = 0;

    const resources = await app.documents(UID).findMany({
      status: 'published',
      populate: ['address'],
      fields: ['documentId', 'title', 'slug']
    });

    for (const resource of resources) {
      const { documentId, title, slug } = resource;
      const label = slug || title || documentId;

      try {
        const draft = await app.documents(UID).findOne({
          documentId,
          status: 'draft',
          populate: ['address'],
        });

        if (!draft?.address) {
          skipped += 1;
          console.warn(`Skip ${documentId} (${label}): no address on draft`);
          continue;
        }

        console.log(
          `${DRY_RUN ? '[dry-run] ' : ''}Republish ${documentId} (${label})`,
        );

        if (!DRY_RUN) {
          // Touch address + publish — mirrors Save + Publish in the admin UI
          await app.documents(UID).update({
            documentId,
            data: {
              address: draft.address,
            },
            status: 'published',
          });
        }

        processed += 1;
      } catch (err) {
        failed += 1;
        console.error(`Failed ${documentId}:`, err?.message || err);
      }
    }

    console.log(
      `Done. processed=${processed} skipped=${skipped} failed=${failed}`,
    );
  } finally {
    await app.destroy();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
