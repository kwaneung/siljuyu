export type CostInput = {
  distanceM: number;
  pricePerL: number;
  efficiencyKmPerL: number;
  fillLiters: number;
};

export type StationCost = {
  travelCost: number;
  fillCost: number;
  totalCost: number;
};

export type RankableStation = {
  id: string;
  distanceM: number;
  pricePerL: number;
};

export type RankedStation<T extends RankableStation = RankableStation> = T & {
  costs: StationCost;
};

function assertPositiveFinite(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

export function computeStationCosts(input: CostInput): StationCost {
  assertPositiveFinite("distanceM", input.distanceM);
  assertPositiveFinite("pricePerL", input.pricePerL);
  assertPositiveFinite("efficiencyKmPerL", input.efficiencyKmPerL);
  assertPositiveFinite("fillLiters", input.fillLiters);

  const distanceKm = input.distanceM / 1000;
  const travelCost = (distanceKm / input.efficiencyKmPerL) * input.pricePerL;
  const fillCost = input.fillLiters * input.pricePerL;

  return {
    travelCost,
    fillCost,
    totalCost: travelCost + fillCost,
  };
}

export function rankStations<T extends RankableStation>(
  stations: T[],
  prefs: Pick<CostInput, "efficiencyKmPerL" | "fillLiters">,
): RankedStation<T>[] {
  return stations
    .map((station) => ({
      ...station,
      costs: computeStationCosts({
        distanceM: station.distanceM,
        pricePerL: station.pricePerL,
        efficiencyKmPerL: prefs.efficiencyKmPerL,
        fillLiters: prefs.fillLiters,
      }),
    }))
    .sort((a, b) => {
      const totalDiff = a.costs.totalCost - b.costs.totalCost;
      if (Math.abs(totalDiff) > 0.000001) return totalDiff;

      const distanceDiff = a.distanceM - b.distanceM;
      if (distanceDiff !== 0) return distanceDiff;

      const priceDiff = a.pricePerL - b.pricePerL;
      if (priceDiff !== 0) return priceDiff;

      return a.id.localeCompare(b.id);
    });
}

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}
