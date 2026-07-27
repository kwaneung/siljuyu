import { katecToWgs84, type Wgs84Point } from "@/lib/geo/katec";

export type OpinetStation = {
  id: string;
  name: string;
  brand?: string;
  pricePerL: number;
  distanceM: number;
  katecX?: number;
  katecY?: number;
  wgs84?: Wgs84Point;
};

export type OpinetStationDetail = {
  id: string;
  name?: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
  brand?: string;
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
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberValue(row: UnknownRecord, keys: string[]): number | undefined {
  const value = text(row, keys);
  if (!value) return undefined;

  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function oilRows(payload: unknown): UnknownRecord[] {
  const root = asRecord(payload);
  const result = asRecord(root?.RESULT);
  return asArray(result?.OIL);
}

export function mapAroundAllResponse(payload: unknown): OpinetStation[] {
  return oilRows(payload).flatMap((row) => {
    const id = text(row, ["UNI_ID", "ID"]);
    const name = text(row, ["OS_NM", "NAME"]);
    const pricePerL = numberValue(row, ["PRICE", "OIL_PRICE"]);
    const distanceM = numberValue(row, ["DISTANCE"]);

    if (!id || !name || !pricePerL || !distanceM) {
      return [];
    }

    const katecX = numberValue(row, ["GIS_X_COOR", "X", "KATEC_X"]);
    const katecY = numberValue(row, ["GIS_Y_COOR", "Y", "KATEC_Y"]);
    const wgs84 =
      katecX !== undefined && katecY !== undefined
        ? katecToWgs84({ x: katecX, y: katecY })
        : undefined;

    return [
      {
        id,
        name,
        brand: text(row, ["POLL_DIV_CD", "BRAND"]),
        pricePerL,
        distanceM,
        katecX,
        katecY,
        wgs84,
      },
    ];
  });
}

export function mapDetailResponse(payload: unknown): OpinetStationDetail | null {
  const row = oilRows(payload)[0];
  if (!row) return null;

  const id = text(row, ["UNI_ID", "ID"]);
  if (!id) return null;

  return {
    id,
    name: text(row, ["OS_NM", "NAME"]),
    address: text(row, ["VAN_ADR", "ADR"]),
    roadAddress: text(row, ["NEW_ADR"]),
    phone: text(row, ["TEL"]),
    brand: text(row, ["POLL_DIV_CD", "BRAND"]),
  };
}
