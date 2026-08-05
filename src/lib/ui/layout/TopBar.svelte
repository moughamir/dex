<script lang="ts">
    import { Bell, Settings2 } from "lucide-svelte";

    import { Button, GlassPanel } from "$lib/ui/primitives";
    import { SearchBox } from "$lib/ui/navigation";

    let query = $state("");
</script>

<header
    class="absolute inset-x-0 top-0 z-(--z-hud) flex h-(--hud-height) items-center px-6"
    data-tauri-drag-region
>
    <GlassPanel
        variant="hud"
        padding="sm"
        class="flex h-full w-full items-center gap-4"
    >
        <div class="flex items-center gap-3" data-tauri-drag-region>
            <div
                class="flex size-10 items-center justify-center rounded-xl bg-(--dex-primary) font-bold text-black"
            >
                D
            </div>

            <div>
                <h1 class="text-sm font-semibold">DEX</h1>

                <p class="text-xs text-(--text-muted)">
                    Digital Experience
                </p>
            </div>
        </div>

        <div class="flex-1">    </div>

        <div class="w-full max-w-md">
            <SearchBox bind:value={query} />
        </div>

        <Button variant="ghost" size="icon">
            <Bell />
        </Button>

        <Button variant="ghost" size="icon">
            <Settings2 />
        </Button>
    </GlassPanel>
</header>
