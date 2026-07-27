import { beforeEach, describe, expect, it } from "vitest";
import {
  clampRadius,
  isOnboardingComplete,
  loadPrefs,
  normalizePrefs,
  PREFS_KEY,
  savePrefs,
} from "./storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("prefs storage", () => {
  it("round-trips saved preferences through localStorage", () => {
    savePrefs({
      onboardingDone: true,
      efficiencyKmPerL: 11.2,
      fuelType: "B027",
      fillLiters: 40,
      radiusKm: 3,
      lastOrigin: { lat: 37.5665, lng: 126.978, label: "서울시청" },
      vehiclePresetId: "grandeur-30-gasoline",
    });

    expect(loadPrefs()).toEqual({
      onboardingDone: true,
      efficiencyKmPerL: 11.2,
      fuelType: "B027",
      fillLiters: 40,
      radiusKm: 3,
      lastOrigin: { lat: 37.5665, lng: 126.978, label: "서울시청" },
      vehiclePresetId: "grandeur-30-gasoline",
    });
  });

  it("clamps legacy radii above 5km to 5km", () => {
    expect(clampRadius(20)).toBe(5);

    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        onboardingDone: true,
        efficiencyKmPerL: 12,
        fuelType: "B027",
        fillLiters: 40,
        radiusKm: 20,
        lastOrigin: { lat: 37.5, lng: 127 },
      }),
    );

    expect(loadPrefs().radiusKm).toBe(5);
  });

  it("treats incomplete or invalid preferences as not onboarded", () => {
    expect(isOnboardingComplete({ onboardingDone: true, efficiencyKmPerL: 12 })).toBe(
      false,
    );

    expect(
      isOnboardingComplete(
        normalizePrefs({
          onboardingDone: true,
          efficiencyKmPerL: 12,
          fuelType: "BAD",
          fillLiters: 40,
          radiusKm: 3,
          lastOrigin: { lat: 37.5, lng: 127 },
        }),
      ),
    ).toBe(false);
  });

  it("survives blocked localStorage without throwing", () => {
    const original = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });

    expect(() => loadPrefs()).not.toThrow();
    expect(loadPrefs()).toEqual({ onboardingDone: false });
    expect(() =>
      savePrefs({
        onboardingDone: true,
        efficiencyKmPerL: 12,
        fuelType: "B027",
        fillLiters: 40,
        radiusKm: 3,
        lastOrigin: { lat: 37.5, lng: 127 },
      }),
    ).not.toThrow();

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: original,
    });
  });
});
