export const FUEL_TYPES = {
  B027: { code: "B027", label: "휘발유", shortLabel: "가솔린" },
  D047: { code: "D047", label: "경유", shortLabel: "디젤" },
  B034: { code: "B034", label: "고급휘발유", shortLabel: "고급" },
  K015: { code: "K015", label: "LPG", shortLabel: "LPG" },
} as const;

export type FuelType = keyof typeof FUEL_TYPES;

export const FUEL_TYPE_CODES = Object.keys(FUEL_TYPES) as FuelType[];

export function isFuelType(value: unknown): value is FuelType {
  return typeof value === "string" && value in FUEL_TYPES;
}
