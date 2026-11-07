<script lang="ts">
    import SiteFooter from '#lib/components/SiteFooter.svelte';
    import SiteHeader from '#lib/components/SiteHeader.svelte';

    let { children } = $props();
</script>

<!-- The showcase site: the brand header and footer. The console has its own frame, in (console). -->
<div class="flex min-h-screen flex-col">
    <SiteHeader />
    <div class="flex-1">
        {@render children()}
    </div>
    <SiteFooter />
</div>
