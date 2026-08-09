<script lang="ts">
  import { themes, type ThemeName } from "$lib/core/config/theme";
  import { themeStore } from "$lib/core/stores/theme.svelte";
  import { Dropdown } from "$lib/ui/primitives";

  const labelOf = {
    dark: "Dark",
    light: "Light",
    cyber: "Cyber",
  } satisfies Record<ThemeName, string>;

  const items = $derived(
    (Object.keys(themes) as ThemeName[]).map((id) => ({
      id,
      label: labelOf[id],
    })),
  );
</script>

<Dropdown
  label={labelOf[themeStore.current]}
  {items}
  selected={themeStore.current}
  onSelect={(id) => themeStore.apply(id as ThemeName)}
/>
