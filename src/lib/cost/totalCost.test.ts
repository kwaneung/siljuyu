import { describe, expect, it } from "vitest";
import { computeStationCosts, rankStations } from "./totalCost";

describe("computeStationCosts", () => {
  it("adds one-way travel fuel cost to the fill cost", () => {
    const costs = computeStationCosts({
      distanceM: 3000,
      pricePerL: 1700,
      efficiencyKmPerL: 12,
      fillLiters: 40,
    });

    expect(costs.travelCost).toBeCloseTo(425);
    expect(costs.fillCost).toBe(68000);
    expect(costs.totalCost).toBeCloseTo(68425);
  });

  it("rejects invalid efficiency or fill inputs", () => {
    expect(() =>
      computeStationCosts({
        distanceM: 1000,
        pricePerL: 1700,
        efficiencyKmPerL: 0,
        fillLiters: 40,
      }),
    ).toThrow(RangeError);

    expect(() =>
      computeStationCosts({
        distanceM: 1000,
        pricePerL: 1700,
        efficiencyKmPerL: 12,
        fillLiters: Number.NaN,
      }),
    ).toThrow(RangeError);
  });
});

describe("rankStations", () => {
  it("can rank a farther cheaper station above a nearer expensive one by total cost", () => {
    const ranked = rankStations(
      [
        { id: "A", distanceM: 2000, pricePerL: 1780 },
        { id: "B", distanceM: 4500, pricePerL: 1700 },
      ],
      { efficiencyKmPerL: 12, fillLiters: 40 },
    );

    expect(ranked[0].id).toBe("B");
    expect(ranked[0].costs.totalCost).toBeLessThan(ranked[1].costs.totalCost);
  });

  it("uses distance, price, then id as deterministic tiebreaks", () => {
    const ranked = rankStations(
      [
        { id: "z", distanceM: 2000, pricePerL: 1100 },
        { id: "a", distanceM: 1000, pricePerL: 1200 },
        { id: "b", distanceM: 1000, pricePerL: 1200 },
      ],
      { efficiencyKmPerL: 10, fillLiters: 1 },
    );

    expect(ranked.map((station) => station.id)).toEqual(["a", "b", "z"]);
  });
});
