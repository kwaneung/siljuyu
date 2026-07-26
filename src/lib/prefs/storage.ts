import { isFuelType, type FuelType } from "@/lib/fuel/types";

export const PREFS_KEY = "siljuyu.prefs.v1";

export type RadiusKm = 3 | 5;

export type Origin = {
  lat: number;
  lng: number;
  label?: string;
};

export type UserPrefs = {
  onboardingDone: boolean;
  efficiencyKmPerL?: number;
  fuelType?: FuelType;
  fillLiters?: number;
  radiusKm?: RadiusKm;
  lastOrigin?: Origin;
  vehiclePresetId?: string;
};

function finitePositive(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function clampRadius(value: unknown): RadiusKm | undefined {
  const parsed = Number(value);
  if (parsed === 3) return 3;
  if (parsed === 5) return 5;
  if (Number.isFinite(parsed) && parsed > 5) return 5;
  return undefined;
}

function normalizeOrigin(value: unknown): Origin | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const lat = Number(record.lat);
  const lng = Number(record.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;

  return {
    lat,
    lng,
    label: typeof record.label === "string" ? record.label : undefined,
  };
}

export function normalizePrefs(value: unknown): UserPrefs {
  if (!value || typeof value !== "object") return { onboardingDone: false };
  const record = value as Record<string, unknown>;

  return {
    onboardingDone: record.onboardingDone === true,
    efficiencyKmPerL: finitePositive(record.efficiencyKmPerL),
    fuelType: isFuelType(record.fuelType) ? record.fuelType : undefined,
    fillLiters: finitePositive(record.fillLiters),
    radiusKm: clampRadius(record.radiusKm),
    lastOrigin: normalizeOrigin(record.lastOrigin),
    vehiclePresetId:
      typeof record.vehiclePresetId === "string" ? record.vehiclePresetId : undefined,
  };
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage ?? null;
}

export function loadPrefs(): UserPrefs {
  const store = storage();
  if (!store) return { onboardingDone: false };

  try {
    const raw = store.getItem(PREFS_KEY);
    return raw ? normalizePrefs(JSON.parse(raw)) : { onboardingDone: false };
  } catch {
    return { onboardingDone: false };
  }
}

export function savePrefs(prefs: UserPrefs): UserPrefs {
  const normalized = normalizePrefs(prefs);
  const store = storage();
  if (store) {
    store.setItem(PREFS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function isOnboardingComplete(prefs: UserPrefs): boolean {
  return (
    prefs.onboardingDone === true &&
    finitePositive(prefs.efficiencyKmPerL) !== undefined &&
    isFuelType(prefs.fuelType) &&
    finitePositive(prefs.fillLiters) !== undefined &&
    prefs.radiusKm !== undefined &&
    prefs.lastOrigin !== undefined
  );
}
