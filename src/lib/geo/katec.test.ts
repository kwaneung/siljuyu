import { describe, expect, it } from "vitest";
import { katecToWgs84, wgs84ToKatec } from "./katec";

describe("KATEC conversion", () => {
  it("round-trips a Seoul fixture within a small tolerance", () => {
    const seoul = { lat: 37.5665, lng: 126.978 };
    const katec = wgs84ToKatec(seoul);
    const back = katecToWgs84(katec);

    expect(katec.x).toBeGreaterThan(250000);
    expect(katec.x).toBeLessThan(360000);
    expect(katec.y).toBeGreaterThan(430000);
    expect(katec.y).toBeLessThan(580000);
    expect(back.lat).toBeCloseTo(seoul.lat, 5);
    expect(back.lng).toBeCloseTo(seoul.lng, 5);
  });

  it("rejects non-finite coordinates", () => {
    expect(() => wgs84ToKatec({ lat: Number.NaN, lng: 126.978 })).toThrow(RangeError);
    expect(() => katecToWgs84({ x: 0, y: Number.POSITIVE_INFINITY })).toThrow(
      RangeError,
    );
  });
});
