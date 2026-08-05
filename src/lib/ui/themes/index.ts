import { dark } from "./dark";
import { light } from "./light";
import { cyber } from "./cyber";

export const themes = {
    dark,
    light,
    cyber
} as const;

export type ThemeId = keyof typeof themes;
