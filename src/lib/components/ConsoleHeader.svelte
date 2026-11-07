<script lang="ts">
    import type { Tenant } from '#lib/server/tenants';
    import TenantSwitcher from './TenantSwitcher.svelte';

    let {
        user,
        tenants,
        current,
        section
    }: {
        user: { name?: string; email: string };
        tenants?: Tenant[];
        current?: string;
        section: string;
    } = $props();
</script>

<header class="border-b border-accent bg-surface">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <a href="/tenants" class="inline-flex" aria-label="Phorge console, your tenants">
            <img
                class="logo-light h-8 w-auto"
                src="/brand/logo-wordmark-light.svg"
                alt="Phorge"
                width="242"
                height="86"
            />
            <img
                class="logo-dark h-8 w-auto"
                src="/brand/logo-wordmark-dark.svg"
                alt="Phorge"
                width="242"
                height="86"
            />
        </a>
        {#if tenants && tenants.length > 0}
            <TenantSwitcher {tenants} {current} {section} />
        {/if}
        <div class="ml-auto flex items-center gap-4">
            <a href="/account" class="font-semibold">{user.name ?? user.email}</a>
            <form method="POST" action="/logout">
                <button
                    type="submit"
                    class="cursor-pointer rounded border border-accent bg-bg px-3 py-1 font-semibold text-fg"
                    >Sign out</button
                >
            </form>
        </div>
    </div>
</header>
