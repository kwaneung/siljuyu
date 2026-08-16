import { createRoot } from "react-dom/client";
import { act, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualLocation } from "./ManualLocation";
import type { Origin } from "@/lib/prefs/storage";

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return { container, root };
}

describe("ManualLocation", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("does not offer raw latitude or longitude fields", async () => {
    const { container } = await render(<ManualLocation onSelect={vi.fn()} />);

    expect(container.querySelector("#manual-lat")).toBeNull();
    expect(container.querySelector("#manual-lng")).toBeNull();
    expect(container.textContent).not.toContain("위도");
    expect(container.textContent).not.toContain("경도");
  });

  it("picking a search result sets the origin when GPS is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ label: "서울시청", lat: 37.5665, lng: 126.978 }],
        }),
      }),
    );

    const onSelect = vi.fn<(origin: Origin) => void>();
    const { container } = await render(<ManualLocation onSelect={onSelect} />);

    const query = container.querySelector("#manual-query");
    const form = container.querySelector("form");
    expect(query).toBeInstanceOf(HTMLInputElement);
    expect(form).toBeInstanceOf(HTMLFormElement);

    await act(async () => {
      const queryInput = query as HTMLInputElement;
      queryInput.value = "서울시청";
      queryInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      (form as HTMLFormElement).dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    const candidate = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.includes("서울시청"),
    );
    expect(candidate).toBeInstanceOf(HTMLButtonElement);

    await act(async () => {
      (candidate as HTMLButtonElement).click();
    });

    expect(onSelect).toHaveBeenCalledWith({
      lat: 37.5665,
      lng: 126.978,
      label: "서울시청",
    });
  });
});
