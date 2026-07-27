import "server-only";

import type { FuelType } from "@/lib/fuel/types";
import { wgs84ToKatec, type Wgs84Point } from "@/lib/geo/katec";
import {
  mapAroundAllResponse,
  mapDetailResponse,
  type OpinetStation,
  type OpinetStationDetail,
} from "./mapResponse";

const OPINET_BASE_URL = "https://www.opinet.co.kr/api";

export class MissingOpinetKeyError extends Error {
  constructor() {
    super("OPINET_API_KEY is not configured");
    this.name = "MissingOpinetKeyError";
  }
}

export class OpinetFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpinetFetchError";
  }
}

function apiKey() {
  const key = process.env.OPINET_API_KEY;
  if (!key) throw new MissingOpinetKeyError();
  return key;
}

async function fetchJson(url: URL, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new OpinetFetchError(`Opinet request failed with ${response.status}`);
  }

  return response.json();
}

export async function fetchStationsAround(params: {
  origin: Wgs84Point;
  radiusKm: 3 | 5;
  prodcd: FuelType;
}): Promise<OpinetStation[]> {
  const katec = wgs84ToKatec(params.origin);
  const url = new URL(`${OPINET_BASE_URL}/aroundAll.do`);
  url.searchParams.set("code", apiKey());
  url.searchParams.set("x", String(Math.round(katec.x)));
  url.searchParams.set("y", String(Math.round(katec.y)));
  url.searchParams.set("radius", String(params.radiusKm * 1000));
  url.searchParams.set("sort", "2");
  url.searchParams.set("prodcd", params.prodcd);
  url.searchParams.set("out", "json");

  const payload = await fetchJson(url, { next: { revalidate: 60 } });
  return mapAroundAllResponse(payload);
}

export async function fetchStationDetail(params: {
  id: string;
  prodcd?: FuelType;
}): Promise<OpinetStationDetail | null> {
  const url = new URL(`${OPINET_BASE_URL}/detailById.do`);
  url.searchParams.set("code", apiKey());
  url.searchParams.set("id", params.id);
  if (params.prodcd) url.searchParams.set("prodcd", params.prodcd);
  url.searchParams.set("out", "json");

  const payload = await fetchJson(url, { next: { revalidate: 300 } });
  return mapDetailResponse(payload);
}
