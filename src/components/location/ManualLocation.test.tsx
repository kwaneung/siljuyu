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
  });

  it("submitting lat/lng enables a usable origin when GPS is unavailable", async () => {
    const onSelect = vi.fn<(origin: Origin) => void>();
    const { container } = await render(<ManualLocation onSelect={onSelect} />);

    const lat = container.querySelector("#manual-lat");
    const lng = container.querySelector("#manual-lng");
    const form = container.querySelector("form");
    expect(lat).toBeInstanceOf(HTMLInputElement);
    expect(lng).toBeInstanceOf(HTMLInputElement);
    expect(form).toBeInstanceOf(HTMLFormElement);

    await act(async () => {
      const latInput = lat as HTMLInputElement;
      const lngInput = lng as HTMLInputElement;
      latInput.value = "37.5665";
      latInput.dispatchEvent(new Event("input", { bubbles: true }));
      lngInput.value = "126.978";
      lngInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      (form as HTMLFormElement).dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(onSelect).toHaveBeenCalledWith({
      lat: 37.5665,
      lng: 126.978,
      label: "직접 입력 위치",
    });
  });
});
