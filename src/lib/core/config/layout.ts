/**
 * Shell layout dimensions in CSS px — single source of truth for the
 * HUD, sidebar, dock, and status bar metrics. The four values that have
 * a CSS var today mirror `tokens.css` exactly (56/280/76/34).
 */
export const layout = {
  /** Padding around the shell content area (old AppShell `p-8` = 2rem). */
  shellPadding: 32,
  /** Top HUD bar height. */
  hudHeight: 56,
  /** Expanded sidebar width. */
  sidebarWidth: 280,
  /** Collapsed sidebar width. */
  sidebarCollapsedWidth: 76,
  /** Bottom dock height. */
  dockHeight: 76,
  /** Status bar height. */
  statusHeight: 34,
  /** Maximum width cap for main content blocks. */
  contentMaxWidth: 1200,
  /** Vertical gap between content blocks. */
  contentGap: 24,
  /** Corner radius for shell panels (matches `--radius-lg` = 18px). */
  borderRadius: 18,
} as const;
