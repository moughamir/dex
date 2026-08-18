/**
 * Reactive test double for SvelteKit's `$app/state` `page` object.
 *
 * Rune-backed (`$state`) so the shell store's `$derived` read of
 * `page.url.pathname` is tracked; tests drive route changes through
 * `navigate()` and reset with `resetPage()`.
 */
export const page = $state<{ url: { pathname: string } }>({
  url: { pathname: "/" },
});

export function navigate(pathname: string): void {
  page.url.pathname = pathname;
}

export function resetPage(): void {
  page.url.pathname = "/";
}
