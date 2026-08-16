import { describe, expect, it } from "vitest";
import { parseManualOrigin, resolveWorkingOrigin } from "./origin";

describe("parseManualOrigin", () => {
  it("accepts Seoul lat/lng and keeps an optional label", () => {
    expect(
      parseManualOrigin({ lat: "37.5665", lng: "126.978", label: "서울시청" }),
    ).toEqual({
      lat: 37.5665,
      lng: 126.978,
      label: "서울시청",
    });
  });

  it("rejects missing, non-numeric, or out-of-range coordinates", () => {
    expect(parseManualOrigin({ lat: "", lng: "126.978" })).toBeUndefined();
    expect(parseManualOrigin({ lat: "37.5", lng: "east" })).toBeUndefined();
    expect(parseManualOrigin({ lat: "91", lng: "126.978" })).toBeUndefined();
    expect(parseManualOrigin({ lat: "37.5", lng: "181" })).toBeUndefined();
  });

  it("falls back to a default label when none is provided", () => {
    expect(parseManualOrigin({ lat: 37.5, lng: 127 })).toEqual({
      lat: 37.5,
      lng: 127,
      label: "직접 입력 위치",
    });
  });
});

describe("resolveWorkingOrigin", () => {
  it("uses GPS when granted and otherwise accepts a manual origin", () => {
    const gps = { lat: 37.57, lng: 126.98, label: "현재 위치" };
    const manual = { lat: 37.5, lng: 127, label: "서울시청" };

    expect(
      resolveWorkingOrigin({ geoStatus: "granted", geoOrigin: gps, manualOrigin: manual }),
    ).toEqual(gps);

    expect(
      resolveWorkingOrigin({
        geoStatus: "denied",
        manualOrigin: manual,
      }),
    ).toEqual(manual);

    expect(resolveWorkingOrigin({ geoStatus: "denied" })).toBeUndefined();
  });
});
