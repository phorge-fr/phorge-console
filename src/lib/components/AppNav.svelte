<script lang="ts">
    import { page } from '$app/state';
    import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
    import Check from '@lucide/svelte/icons/check';
    import Images from '@lucide/svelte/icons/package';
    import Instances from '@lucide/svelte/icons/server';
    import Key from '@lucide/svelte/icons/key-round';
    import Layers from '@lucide/svelte/icons/layers';
    import LogOut from '@lucide/svelte/icons/log-out';
    import Networks from '@lucide/svelte/icons/network';
    import Overview from '@lucide/svelte/icons/layout-dashboard';
    import Plus from '@lucide/svelte/icons/plus';
    import Profiles from '@lucide/svelte/icons/sliders-horizontal';
    import Users from '@lucide/svelte/icons/users';
    import type { Tenant } from '#lib/server/tenants';

    // The navigation of the console, drawn once and shown in the side column on a desktop and under the menu button on a phone.
    // The tenant is in the address (`/t/<tenant>/<section>`): switching goes through /switch, a plain link that keeps the section.
    let {
        user,
        tenants,
        canCreateTenants
    }: {
        user: { name?: string; email: string };
        tenants?: Tenant[];
        canCreateTenants: boolean;
    } = $props();

    const id = $props.id();
    const current = $derived(page.params.tenant);
    const section = $derived(page.url.pathname.split('/')[3] ?? '');
    const currentTenant = $derived(tenants?.find((t) => t.name === current));
    // With many tenants the menu has a search; it narrows the list, nothing else changes.
    let find = $state('');
    const SEARCH_FROM = 8;
    const matching = $derived(
        (tenants ?? []).filter((t) =>
            `${t.name} ${t.displayName ?? ''}`.toLowerCase().includes(find.trim().toLowerCase())
        )
    );
    const label = (t: { name: string; displayName?: string }) => t.displayName || t.name;
    const initial = (text: string) => text.trim().charAt(0).toUpperCase() || '?';

    const sections = $derived(
        current
            ? [
                  { href: `/t/${current}`, label: 'Overview', icon: Overview, exact: true },
                  { href: `/t/${current}/images`, label: 'Images', icon: Images },
                  { href: `/t/${current}/networks`, label: 'Networks', icon: Networks },
                  { href: `/t/${current}/profiles`, label: 'Profiles', icon: Profiles },
                  { href: `/t/${current}/instances`, label: 'Instances', icon: Instances },
                  { href: `/t/${current}/members`, label: 'Members', icon: Users }
              ]
            : [{ href: '/', label: 'Tenants', icon: Layers, exact: true }]
    );
    const here = (href: string, exact?: boolean) =>
        exact ? page.url.pathname === href : page.url.pathname.startsWith(href);

    // The tenant menu is a <details>, so that it opens without JavaScript; it closes on a click elsewhere, on Escape, and once the
    // person has gone to another page.
    let menu: HTMLDetailsElement | undefined = $state();
    let opened = $state(false);
    $effect(() => {
        void page.url.pathname;
        if (menu) menu.open = false;
    });
    $effect(() => {
        if (!opened) return;
        const away = (event: Event) => {
            if (menu && !menu.contains(event.target as Node)) menu.open = false;
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && menu) {
                menu.open = false;
                menu.querySelector('summary')?.focus();
            }
        };
        document.addEventListener('click', away);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('click', away);
            document.removeEventListener('keydown', escape);
        };
    });
</script>

<nav aria-label="Console" class="flex min-h-0 flex-1 flex-col gap-6">
    {#if tenants && tenants.length > 0}
        <details bind:this={menu} class="relative" ontoggle={() => (opened = menu?.open ?? false)}>
            <summary
                class="flex h-11 cursor-pointer list-none items-center gap-2.5 rounded-md border border-line bg-bg px-2.5 transition-colors duration-150 hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
                aria-label="Switch tenant"
            >
                <span
                    class="grid size-7 shrink-0 place-items-center rounded bg-primary text-sm font-bold text-on-primary"
                    aria-hidden="true"
                >
                    {initial(currentTenant ? label(currentTenant) : 'T')}
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-semibold leading-tight">
                        {currentTenant ? label(currentTenant) : 'Choose a tenant'}
                    </span>
                    <span class="block text-xs leading-tight text-fg-3">
                        {currentTenant ? 'Tenant' : `${tenants.length} available`}
                    </span>
                </span>
                <ChevronsUpDown size={16} class="shrink-0 text-fg-3" aria-hidden="true" />
            </summary>
            <div
                class="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-line bg-bg p-1 shadow-pop"
            >
                <p class="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-fg-3" id="{id}-tenants">
                    Your tenants
                </p>
                {#if tenants.length > SEARCH_FROM}
                    <div class="px-1 pb-1">
                        <label class="sr-only" for="{id}-find">Search a tenant</label>
                        <input
                            id="{id}-find"
                            type="search"
                            bind:value={find}
                            placeholder="Search a tenant"
                            autocomplete="off"
                            class="field h-8"
                        />
                    </div>
                {/if}
                <ul class="m-0 list-none p-0" aria-labelledby="{id}-tenants">
                    {#each matching as tenant (tenant.name)}
                        <li>
                            <a
                                href="/switch?tenant={encodeURIComponent(
                                    tenant.name
                                )}&section={section}"
                                class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-fg no-underline hover:bg-surface-2"
                                aria-current={tenant.name === current ? 'true' : undefined}
                            >
                                <span
                                    class="grid size-6 shrink-0 place-items-center rounded bg-surface-2 text-xs font-bold text-fg-2"
                                    aria-hidden="true">{initial(label(tenant))}</span
                                >
                                <span class="min-w-0 flex-1 truncate text-sm">{label(tenant)}</span>
                                {#if tenant.name === current}
                                    <Check
                                        size={16}
                                        class="shrink-0 text-primary"
                                        aria-hidden="true"
                                    />
                                {/if}
                            </a>
                        </li>
                    {/each}
                    {#if matching.length === 0}
                        <li class="px-2.5 py-2 text-sm text-fg-3">No tenant matches “{find}”.</li>
                    {/if}
                </ul>
                {#if canCreateTenants}
                    <div class="mt-1 border-t border-line pt-1">
                        <a
                            href="/new"
                            class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-fg no-underline hover:bg-surface-2"
                        >
                            <Plus size={16} class="text-fg-3" aria-hidden="true" />
                            New tenant
                        </a>
                    </div>
                {/if}
            </div>
        </details>
    {/if}

    <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
        {#each sections as item (item.href)}
            {@const Icon = item.icon}
            <li>
                <a
                    href={item.href}
                    aria-current={here(item.href, item.exact) ? 'page' : undefined}
                    class="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-semibold no-underline transition-colors duration-150 {here(
                        item.href,
                        item.exact
                    )
                        ? 'bg-surface-2 text-fg'
                        : 'text-fg-2 hover:bg-surface-2 hover:text-fg'}"
                >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                </a>
            </li>
        {/each}
    </ul>

    <ul class="m-0 flex list-none flex-col gap-0.5 border-t border-line p-0 pt-4">
        <li>
            <a
                href="/api-keys"
                aria-current={here('/api-keys') ? 'page' : undefined}
                class="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-semibold no-underline transition-colors duration-150 {here(
                    '/api-keys'
                )
                    ? 'bg-surface-2 text-fg'
                    : 'text-fg-2 hover:bg-surface-2 hover:text-fg'}"
            >
                <Key size={18} aria-hidden="true" />
                API keys
            </a>
        </li>
    </ul>

    <div class="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <a
            href="/account"
            aria-current={here('/account') ? 'page' : undefined}
            class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-fg no-underline transition-colors duration-150 hover:bg-surface-2 {here(
                '/account'
            )
                ? 'bg-surface-2'
                : ''}"
        >
            <span
                class="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-fg-2"
                aria-hidden="true">{initial(user.name ?? user.email)}</span
            >
            <span class="min-w-0">
                <span class="block truncate text-sm font-semibold leading-tight"
                    >{user.name ?? user.email}</span
                >
                {#if user.name}
                    <span class="block truncate text-xs leading-tight text-fg-3">{user.email}</span>
                {/if}
            </span>
        </a>
        <form method="POST" action="/logout">
            <button
                type="submit"
                class="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 text-left text-sm font-semibold text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
            >
                <LogOut size={18} aria-hidden="true" />
                Sign out
            </button>
        </form>
    </div>
</nav>
