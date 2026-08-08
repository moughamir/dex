// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";

import Card from "$lib/ui/primitives/Card.svelte";

function textSnippet(text: string) {
  return createRawSnippet(() => ({ render: () => text }));
}

describe("Card", () => {
  it("renders a div by default with the body slot content", () => {
    render(Card, { children: textSnippet("Body content") });

    const card = screen.getByText("Body content").closest(".dex-card");
    expect(card).not.toBeNull();
    expect(card?.tagName).toBe("DIV");
  });

  it("renders the element prop as the semantic element", () => {
    render(Card, { element: "article", children: textSnippet("Body content") });

    expect(document.querySelector("article.dex-card")).not.toBeNull();
    expect(document.querySelector("section.dex-card")).toBeNull();
  });

  it("renders optional header and footer slots in order", () => {
    const { container } = render(Card, {
      header: textSnippet("Header"),
      children: textSnippet("Body"),
      footer: textSnippet("Footer"),
    });

    const nodes = Array.from(container.querySelectorAll(".dex-card > div"));
    expect(nodes[0]?.classList.contains("dex-card__header")).toBe(true);
    expect(nodes[1]?.classList.contains("dex-card__body")).toBe(true);
    expect(nodes[2]?.classList.contains("dex-card__footer")).toBe(true);
  });

  it("forwards events onto the root element", async () => {
    const onClick = vi.fn();
    render(Card, {
      children: textSnippet("Body"),
      onclick: onClick,
      interactive: true,
    });

    await fireEvent.click(screen.getByText("Body"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
