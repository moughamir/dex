<script lang="ts">
  import { themes, type ThemeName } from "$lib/core/config/theme";
  import { themeStore } from "$lib/core/stores/theme.svelte";
  import { transitionTheme } from "$lib/ui/motion";
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

  function handleSelect(id: string) {
    // Runs the cross-fade timeline; the store apply happens inside the
    // helper at the opacity floor (no direct store call here).
    void transitionTheme(id as ThemeName);
  }
</script>

<Dropdown
  label={labelOf[themeStore.current]}
  {items}
  selected={themeStore.current}
  onSelect={handleSelect}
/>
