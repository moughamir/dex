import { cyber } from "$lib/ui/themes/cyber";
import { dark } from "$lib/ui/themes/dark";
import { light } from "$lib/ui/themes/light";

export const themes = {
  dark,
  cyber,
  light,
}
export type ThemeName = keyof typeof themes;
export const defaultTheme: ThemeName = "dark";
