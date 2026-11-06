<script lang="ts">
    import 'virtual:uno.css';
    import '#lib/styles/app.css';
    import SiteFooter from '#lib/components/SiteFooter.svelte';
    import SiteHeader from '#lib/components/SiteHeader.svelte';

    let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
    <SiteHeader />
    <div class="flex-1">
        {@render children()}
    </div>
    <SiteFooter />
</div>
