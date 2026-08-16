import type { Origin } from "@/lib/prefs/storage";

export type GeoAvailability =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function parseManualOrigin(input: {
  lat: unknown;
  lng: unknown;
  label?: string;
}): Origin | undefined {
  const lat = finiteNumber(input.lat);
  const lng = finiteNumber(input.lng);
  if (lat === undefined || lng === undefined) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;

  const label = input.label?.trim();
  return {
    lat,
    lng,
    label: label || "직접 입력 위치",
  };
}

export function resolveWorkingOrigin(input: {
  geoStatus: GeoAvailability;
  geoOrigin?: Origin;
  manualOrigin?: Origin;
}): Origin | undefined {
  if (input.geoStatus === "granted" && input.geoOrigin) {
    return input.geoOrigin;
  }
  return input.manualOrigin;
}
