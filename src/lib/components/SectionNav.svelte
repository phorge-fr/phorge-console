<script lang="ts">
    import { page } from '$app/state';

    // The sections of the console: the tenant ones are under /t/<tenant> (the choice stays in the address), the keys are the person's.
    let { tenant }: { tenant?: string } = $props();

    const sections = $derived([
        ...(tenant
            ? [
                  { href: `/t/${tenant}`, label: 'Overview', exact: true },
                  { href: `/t/${tenant}/images`, label: 'Images' },
                  { href: `/t/${tenant}/instances`, label: 'Instances' },
                  { href: `/t/${tenant}/members`, label: 'Members' }
              ]
            : [{ href: '/', label: 'Tenants', exact: true }]),
        { href: '/api-keys', label: 'API keys' }
    ]);

    const current = (href: string, exact?: boolean) =>
        exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
</script>

<nav aria-label="Console" class="border-b border-accent">
    <ul class="mx-auto flex max-w-6xl list-none gap-1 overflow-x-auto px-4 py-0 m-0">
        {#each sections as section (section.href)}
            <li>
                <a
                    href={section.href}
                    aria-current={current(section.href, section.exact) ? 'page' : undefined}
                    class="inline-block whitespace-nowrap border-b-4 px-3 py-3 font-semibold no-underline {current(
                        section.href,
                        section.exact
                    )
                        ? 'border-accent text-fg'
                        : 'border-transparent text-muted'}">{section.label}</a
                >
            </li>
        {/each}
    </ul>
</nav>
