/** What the API accepts for an API key (`ApiKeyCreate` and `Scope` of the OpenAPI document), shared by the forms and the actions. */

/**
 * What a key may do on a tenant, grouped by what it acts on. The form is drawn from this list: a new right of the API is a new line
 * here, in its group, and appears in every rule. `instances:write` does not give `instances:read`: each scope is its own.
 */
export const SCOPES = [
    { scope: 'tenants:read', group: 'Tenant', verb: 'See', label: 'See the tenant' },
    { scope: 'instances:read', group: 'Instances', verb: 'See', label: 'See the instances' },
    {
        scope: 'instances:write',
        group: 'Instances',
        verb: 'Create and change',
        label: 'Create and change instances'
    },
    { scope: 'images:read', group: 'Images', verb: 'See', label: 'See the images' },
    {
        scope: 'images:write',
        group: 'Images',
        verb: 'Pull and delete',
        label: 'Pull and delete images'
    },
    { scope: 'memberships:read', group: 'Members', verb: 'See', label: 'See the members' },
    {
        scope: 'memberships:write',
        group: 'Members',
        verb: 'Add and remove',
        label: 'Add and remove members'
    }
] as const;

/** What each group acts on, in a few words. */
export const GROUP_HELP: Record<string, string> = {
    Tenant: 'The tenant itself: its state and its plan',
    Instances: 'The virtual machines',
    Images: 'The images virtual machines start from',
    Members: 'Who holds a role on the tenant'
};

/** The scopes by group, in the order of the list. */
export const SCOPE_GROUPS = SCOPES.reduce<{ group: string; items: (typeof SCOPES)[number][] }[]>(
    (groups, item) => {
        const last = groups.at(-1);
        if (last?.group === item.group) last.items.push(item);
        else groups.push({ group: item.group, items: [item] });
        return groups;
    },
    []
);

export type Scope = (typeof SCOPES)[number]['scope'];

export const MAX_NAME_LENGTH = 100;
export const MAX_GRANTS = 50;

/** The id of a key, as the API gives it (the name of the object). Only used to build an address, so it is checked. */
export const KEY_ID = /^[a-z0-9-]{1,64}$/;

const SCOPE_NAMES = new Set<string>(SCOPES.map((s) => s.scope));
export const isScope = (value: string): value is Scope => SCOPE_NAMES.has(value);

export const MAX_RULES = 20;

/**
 * What a form asks for: rules, each with the scopes ticked and the tenants chosen (`rule.<n>.scope` and `rule.<n>.tenant`). A tenant
 * that several rules name gets all their scopes: rules add up. Only the tenants the person sees count, so the names of the form are
 * never trusted, and a rule with no scope or no tenant gives nothing.
 */
export function readRules(form: FormData, seen: string[]) {
    const known = new Set(seen);
    const rules: { scopes: Scope[]; tenants: string[] }[] = [];
    for (let n = 0; n < MAX_RULES; n++) {
        const scopes = [...new Set(form.getAll(`rule.${n}.scope`).map(String).filter(isScope))];
        const tenants = [
            ...new Set(
                form
                    .getAll(`rule.${n}.tenant`)
                    .map(String)
                    .filter((t) => known.has(t))
            )
        ];
        if (scopes.length > 0 || tenants.length > 0) rules.push({ scopes, tenants });
    }
    const byTenant = new Map<string, Set<Scope>>();
    for (const rule of rules)
        for (const tenant of rule.tenants) {
            const set = byTenant.get(tenant) ?? new Set<Scope>();
            rule.scopes.forEach((scope) => set.add(scope));
            byTenant.set(tenant, set);
        }
    const grants = [...byTenant].map(([tenant, scopes]) => ({ tenant, scopes: [...scopes] }));
    return { rules, grants };
}

/** The lifetimes offered in the form, in days. A date can be chosen too. The API sets the maximum and says so. */
export const EXPIRY_DAYS = [7, 30, 60, 90] as const;

const endOfDay = (date: Date) => new Date(`${date.toISOString().slice(0, 10)}T23:59:59Z`);

/**
 * When the key expires, from the form: a lifetime in days (counted to the end of that day, in UTC) or a chosen day, or a sentence that
 * says what is wrong. The API checks that it is in the future and within the maximum lifetime of the deployment, and says so.
 */
export function readExpiry(
    choice: string,
    day: string
): { expiresAt: string } | { message: string } {
    if (choice === 'custom') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { message: 'Choose the day the key expires.' };
        const end = new Date(`${day}T23:59:59Z`);
        if (Number.isNaN(end.getTime())) return { message: 'This is not a date.' };
        if (end.getTime() <= Date.now()) return { message: 'The key must expire in the future.' };
        return { expiresAt: end.toISOString() };
    }
    const days = Number(choice);
    if (!(EXPIRY_DAYS as readonly number[]).includes(days))
        return { message: 'Choose when the key expires.' };
    return { expiresAt: endOfDay(new Date(Date.now() + days * 24 * 3600 * 1000)).toISOString() };
}

/** The day a lifetime ends, to show it before the key is made. */
export const expiryDay = (days: number) =>
    endOfDay(new Date(Date.now() + days * 24 * 3600 * 1000))
        .toISOString()
        .slice(0, 10);
