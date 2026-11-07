<script lang="ts">
    import { PLANS, type Plan } from '#lib/plans';

    // The plans as choices that say what they hold. A set of radios, so that it works without JavaScript.
    let { selected, name = 'plan' }: { selected?: Plan | string; name?: string } = $props();
</script>

<fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
    <legend class="field-label mb-2 p-0">Plan</legend>
    {#each Object.entries(PLANS) as [plan, quota] (plan)}
        <label
            class="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-bg p-3.5 transition-colors duration-150 hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-highlight"
        >
            <input
                type="radio"
                {name}
                value={plan}
                required
                checked={selected === plan}
                class="mt-1"
            />
            <span class="tnum">
                <span class="block font-semibold capitalize">{plan}</span>
                <span class="block text-fg-2">
                    {quota.instances}
                    {quota.instances === 1 ? 'virtual machine' : 'virtual machines'} · {quota.vcpu} vCPU
                    · {quota.memoryGiB} GiB of memory · {quota.diskGiB} GiB of disk
                </span>
            </span>
        </label>
    {/each}
</fieldset>
