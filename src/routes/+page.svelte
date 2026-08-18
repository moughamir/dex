<script lang="ts">
  import {
    Activity,
    Bot,
    Database,
    FolderKanban,
    Package as PackageIcon,
  } from "lucide-svelte";

  import { Badge, Button, GlassPanel } from "$lib/ui/primitives";

  const stats = [
    {
      title: "Projects",
      value: "12",
      icon: FolderKanban,
    },
    {
      title: "Agents",
      value: "4",
      icon: Bot,
    },
    {
      title: "Databases",
      value: "7",
      icon: Database,
    },
    {
      title: "Plugins",
      value: "16",
      icon: PackageIcon,
    },
  ];
</script>

<div class="flex flex-col gap-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-4xl font-bold">Welcome Back</h1>

      <p class="mt-2 text-(--text-muted)">Your Digital Experience Dashboard</p>
    </div>

    <Button glow>New Project</Button>
  </header>

  <section class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
    {#each stats as stat (stat.title)}
      <GlassPanel interactive class="flex items-center gap-4">
        <div class="rounded-xl bg-(--surface-3) p-4">
          <stat.icon class="size-6 text-(--dex-primary)" />
        </div>

        <div>
          <p class="text-sm text-(--text-muted)">
            {stat.title}
          </p>

          <h2 class="text-3xl font-bold">
            {stat.value}
          </h2>
        </div>
      </GlassPanel>
    {/each}
  </section>

  <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
    <GlassPanel class="min-h-105 xl:col-span-2">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold">Activity</h2>

        <Badge>Live</Badge>
      </div>

      <div class="flex h-full items-center justify-center text-(--text-muted)">
        <Activity class="size-16 opacity-50" />
      </div>
    </GlassPanel>

    <GlassPanel class="min-h-105">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold">AI Assistant</h2>

        <Badge variant="accent">Online</Badge>
      </div>

      <div class="flex h-full items-center justify-center text-(--text-muted)">
        <Bot class="size-16 opacity-60" />
      </div>
    </GlassPanel>
  </section>
</div>
