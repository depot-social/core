export type ConfigurationEntry = {
  key: string;
  value: string;
  type: string;
  environment: string | null;
  tag: string | null;
};

export type PermissionsPreset = {
  public: string[];
  authenticated: string[];
};

type Role = { id: number; permissions: { action: string }[] };

export type DefaultsStore = {
  actions: ReadonlySet<string>;
  hasPlugin: (name: string) => boolean;
  findRole: (type: string) => Promise<Role | null>;
  addPermission: (roleId: number, action: string) => Promise<unknown>;
  removePermissions: (
    roleId: number,
    actions: readonly string[]
  ) => Promise<{ count: number }>;
  hasConfiguration: (key: string) => Promise<boolean>;
  addConfiguration: (entry: ConfigurationEntry) => Promise<unknown>;
};

type ActionMap = Record<
  string,
  { controllers: Record<string, Record<string, unknown>> }
>;

// Embedded media needs no Media Library read grants. Revoke the old defaults.
const mediaReadActions = new Set([
  'plugin::upload.content-api.find',
  'plugin::upload.content-api.findOne',
]);

export function flattenActions(map: ActionMap): Set<string> {
  return new Set(
    Object.entries(map).flatMap(([namespace, { controllers }]) =>
      Object.entries(controllers).flatMap(([controller, actions]) =>
        Object.keys(actions).map(
          (action) => `${namespace}.${controller}.${action}`
        )
      )
    )
  );
}

/** Add defaults, preserving customization except for obsolete media read grants. */
export async function applyDefaults(
  store: DefaultsStore,
  configuration: ConfigurationEntry[],
  preset: PermissionsPreset,
  log: (message: string) => void = console.log
) {
  const plans: { role: Role; actions: string[] }[] = [];
  const skipped = new Set<string>();

  // Validate the whole permissions preset before making any writes.
  for (const type of ['public', 'authenticated'] as const) {
    const role = await store.findRole(type);
    if (!role) throw new Error(`Missing users-permissions role: ${type}`);
    const actions = [
      ...new Set(
        type === 'authenticated'
          ? [...preset.public, ...preset.authenticated]
          : preset.public
      ),
    ];
    const available = actions.filter((action) => {
      const plugin = action.match(/^plugin::([^.]+)\./)?.[1];
      if (plugin && !store.hasPlugin(plugin)) {
        skipped.add(plugin);
        return false;
      }
      if (!store.actions.has(action))
        throw new Error(`Unknown permission action: ${action}`);
      return true;
    });
    plans.push({ role, actions: available });
  }

  let settingsCreated = 0;
  let permissionsCreated = 0;
  let permissionsRemoved = 0;
  for (const entry of configuration) {
    const plugin = entry.key.match(/::plugin::([^.]+)\./)?.[1];
    if (plugin && !store.hasPlugin(plugin)) {
      skipped.add(plugin);
      continue;
    }
    if (await store.hasConfiguration(entry.key)) continue;
    await store.addConfiguration(entry);
    settingsCreated += 1;
  }
  for (const { role, actions } of plans) {
    const obsoleteActions = role.permissions
      .map(({ action }) => action)
      .filter((action) => mediaReadActions.has(action));
    if (obsoleteActions.length > 0) {
      const { count } = await store.removePermissions(role.id, obsoleteActions);
      permissionsRemoved += count;
    }
    const existing = new Set(role.permissions.map(({ action }) => action));
    for (const action of actions) {
      if (existing.has(action)) continue;
      await store.addPermission(role.id, action);
      permissionsCreated += 1;
    }
  }
  for (const plugin of skipped) log(`Skipped disabled plugin: ${plugin}`);
  log(
    `Project defaults: ${settingsCreated} settings and ${permissionsCreated} permissions added; ${permissionsRemoved} obsolete media read permissions removed; other existing values kept.`
  );
  return { settingsCreated, permissionsCreated, permissionsRemoved };
}
