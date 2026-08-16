export type GeocodeCandidate = {
  label: string;
  lat: number;
  lng: number;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const record = asRecord(item);
      return record ? [record] : [];
    });
  }
  const record = asRecord(value);
  return record ? [record] : [];
}

function text(row: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function coordinate(row: UnknownRecord, key: string): number | undefined {
  const value = row[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function candidateLabel(row: UnknownRecord): string | undefined {
  const place = text(row, ["place_name"]);
  const road = text(row, ["road_address_name"]);
  const address = text(row, ["address_name"]);
  const nestedRoad = asRecord(row.road_address);
  const nestedRoadName = nestedRoad ? text(nestedRoad, ["address_name"]) : undefined;

  const detail = road ?? nestedRoadName ?? address;
  if (place && detail && place !== detail) return `${place} · ${detail}`;
  return place ?? detail;
}

export function mapKakaoLocalResponse(payload: unknown): GeocodeCandidate[] {
  const root = asRecord(payload);
  return asArray(root?.documents).flatMap((row) => {
    const lng = coordinate(row, "x");
    const lat = coordinate(row, "y");
    const label = candidateLabel(row);
    if (lat === undefined || lng === undefined || !label) return [];
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return [];
    return [{ label, lat, lng }];
  });
}

export function mergeGeocodeCandidates(
  groups: GeocodeCandidate[][],
  limit = 8,
): GeocodeCandidate[] {
  const seen = new Set<string>();
  const merged: GeocodeCandidate[] = [];

  for (const group of groups) {
    for (const candidate of group) {
      const key = `${candidate.lat.toFixed(6)},${candidate.lng.toFixed(6)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(candidate);
      if (merged.length >= limit) return merged;
    }
  }

  return merged;
}
