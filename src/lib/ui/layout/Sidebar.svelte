<script lang="ts">
	import { SIDEBAR_NAV } from "$lib/core/config/navigation";

	import { GlassPanel } from "$lib/ui/primitives";
	import { NavItem, NavSection } from "$lib/ui/navigation";
</script>

<aside class="z-(--z-sidebar) h-full w-(--sidebar-width) p-6">
	<GlassPanel variant="sidebar" padding="sm" class="flex h-full flex-col">
		<div class="space-y-6">
			{#each Object.values(SIDEBAR_NAV).flat() as section (section.id)}
				<NavSection title={section.title}>
					{#snippet children()}
						{#each section.items as item (item.id)}
							<NavItem
								label={item.label}
								href={item.href}
								active={false}
							>
								{#if item.badge}
									{#snippet badge()}
										<span
											class="rounded-full bg-(--surface-3) px-2 py-0.5 text-[10px]"
										>
											{item.badge}
										</span>
									{/snippet}
								{/if}
							</NavItem>
						{/each}
					{/snippet}
				</NavSection>
			{/each}
		</div>

		<div class="flex-1"></div>
	</GlassPanel>
</aside>
