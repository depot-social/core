import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  applyDefaults,
  flattenActions,
  type ConfigurationEntry,
  type DefaultsStore,
  type PermissionsPreset,
} from './defaults';

const entry: ConfigurationEntry = {
  key: 'plugin_test',
  value: '{}',
  type: 'object',
  environment: null,
  tag: null,
};
const preset: PermissionsPreset = {
  public: ['api::resource.resource.find'],
  authenticated: [
    'api::resource.resource.create',
    'plugin::rental-agreement.rentalAgreementController.getRentalAgreement',
  ],
};

function fixture(disabled = false) {
  const roles = new Map([
    ['public', { id: 17, permissions: [{ action: 'custom.existing.read' }] }],
    ['authenticated', { id: 42, permissions: [] as { action: string }[] }],
  ]);
  const settings = new Map<string, ConfigurationEntry>();
  const store: DefaultsStore = {
    actions: new Set([...preset.public, ...preset.authenticated]),
    hasPlugin: () => !disabled,
    findRole: async (type) => roles.get(type) ?? null,
    addPermission: async (id, action) => {
      const role = [...roles.values()].find((role) => role.id === id);
      role?.permissions.push({ action });
    },
    removePermissions: async (id, actions) => {
      const role = [...roles.values()].find((role) => role.id === id);
      if (!role) return { count: 0 };
      const before = role.permissions.length;
      role.permissions = role.permissions.filter(
        ({ action }) => !actions.includes(action)
      );
      return { count: before - role.permissions.length };
    },
    hasConfiguration: async (key) => settings.has(key),
    addConfiguration: async (configuration) =>
      settings.set(configuration.key, configuration),
  };
  return { store, roles, settings };
}

describe('Project defaults import', () => {
  test('adds role-specific grants once and preserves customized settings and permissions', async () => {
    const { store, roles, settings } = fixture();
    settings.set(entry.key, { ...entry, value: '{"custom":true}' });
    expect(await applyDefaults(store, [entry], preset)).toEqual({
      settingsCreated: 0,
      permissionsCreated: 4,
      permissionsRemoved: 0,
    });
    expect(settings.get(entry.key)?.value).toBe('{"custom":true}');
    expect(roles.get('public')?.permissions).toContainEqual({
      action: 'custom.existing.read',
    });
    expect(roles.get('public')?.permissions).not.toContainEqual({
      action: 'api::resource.resource.create',
    });
    expect(await applyDefaults(store, [entry], preset)).toEqual({
      settingsCreated: 0,
      permissionsCreated: 0,
      permissionsRemoved: 0,
    });
  });

  test('revokes obsolete media reads from both default roles, preserving uploads and custom roles', async () => {
    const { store, roles } = fixture();
    const mediaReads = [
      'plugin::upload.content-api.find',
      'plugin::upload.content-api.findOne',
    ].map((action) => ({ action }));
    for (const role of roles.values()) role.permissions.push(...mediaReads);
    const upload = { action: 'plugin::upload.content-api.upload' };
    roles.get('authenticated')?.permissions.push(upload);
    roles.set('custom', { id: 77, permissions: [...mediaReads] });

    expect(await applyDefaults(store, [], preset)).toEqual({
      settingsCreated: 0,
      permissionsCreated: 4,
      permissionsRemoved: 4,
    });
    for (const type of ['public', 'authenticated']) {
      for (const permission of mediaReads)
        expect(roles.get(type)?.permissions).not.toContainEqual(permission);
    }
    expect(roles.get('authenticated')?.permissions).toContainEqual(upload);
    expect(roles.get('public')?.permissions).toContainEqual({
      action: 'custom.existing.read',
    });
    expect(roles.get('custom')?.permissions).toEqual(mediaReads);
    expect(await applyDefaults(store, [], preset)).toEqual({
      settingsCreated: 0,
      permissionsCreated: 0,
      permissionsRemoved: 0,
    });
  });

  test('the shipped preset excludes media reads and retains authenticated uploads', () => {
    const shipped: PermissionsPreset = JSON.parse(
      readFileSync('packages/strapi/permissions.json', 'utf8')
    );
    for (const actions of Object.values(shipped)) {
      expect(actions).not.toContain('plugin::upload.content-api.find');
      expect(actions).not.toContain('plugin::upload.content-api.findOne');
    }
    expect(shipped.authenticated).toContain(
      'plugin::upload.content-api.upload'
    );
  });

  test('adds missing settings and skips disabled plugin actions and views', async () => {
    const { store, settings } = fixture(true);
    const messages: string[] = [];
    const disabledView = {
      ...entry,
      key: 'plugin_content_manager_configuration_content_types::plugin::rental-agreement.example',
    };
    expect(
      await applyDefaults(store, [entry, disabledView], preset, (message) =>
        messages.push(message)
      )
    ).toEqual({
      settingsCreated: 1,
      permissionsCreated: 3,
      permissionsRemoved: 0,
    });
    expect(settings.has(disabledView.key)).toBe(false);
    expect(messages).toContain('Skipped disabled plugin: rental-agreement');
  });

  test('rejects stale actions before applying any project defaults', async () => {
    const { store, settings, roles } = fixture();
    const mediaRead = { action: 'plugin::upload.content-api.find' };
    roles.get('public')?.permissions.push(mediaRead);
    await expect(
      applyDefaults(store, [entry], {
        ...preset,
        authenticated: ['api::missing.missing.find'],
      })
    ).rejects.toThrow('Unknown permission action');
    expect(settings.size).toBe(0);
    expect(roles.get('authenticated')?.permissions).toHaveLength(0);
    expect(roles.get('public')?.permissions).toContainEqual(mediaRead);
  });

  test('flattens the Strapi action registry', () => {
    expect(
      flattenActions({
        'api::resource': {
          controllers: { resource: { find: {}, create: {} } },
        },
      })
    ).toEqual(
      new Set(['api::resource.resource.find', 'api::resource.resource.create'])
    );
  });

  test('the shipped views only reference current, visible schema fields', () => {
    const configuration: ConfigurationEntry[] = JSON.parse(
      readFileSync('packages/strapi/configuration.json', 'utf8')
    );
    const generated = [
      'id',
      'documentId',
      'createdAt',
      'updatedAt',
      'publishedAt',
      'createdBy',
      'updatedBy',
      'locale',
      'localizations',
    ];
    for (const row of configuration) {
      const view = JSON.parse(row.value);
      const [namespace, name] = view.uid.split('.');
      const schemaPath = namespace.startsWith('api::')
        ? `packages/strapi/src/api/${namespace.slice(
            5
          )}/content-types/${name}/schema.json`
        : `packages/strapi/src/plugins/emails/server/content-types/${name}/schema.json`;
      const { attributes } = JSON.parse(readFileSync(schemaPath, 'utf8'));
      for (const field of Object.keys(view.metadatas)) {
        expect(
          generated.includes(field) || field in attributes,
          `${view.uid}.${field}`
        ).toBe(true);
        expect(attributes[field]?.visible).not.toBe(false);
      }
    }
  });
});
