import "server-only";

import {
  mapKakaoLocalResponse,
  mergeGeocodeCandidates,
  type GeocodeCandidate,
} from "./geocode";

const KAKAO_LOCAL_BASE_URL = "https://dapi.kakao.com/v2/local/search";

export class MissingKakaoKeyError extends Error {
  constructor() {
    super("KAKAO_REST_API_KEY is not configured");
    this.name = "MissingKakaoKeyError";
  }
}

export class KakaoFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KakaoFetchError";
  }
}

function apiKey() {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new MissingKakaoKeyError();
  return key;
}

async function fetchKakaoDocuments(path: "address.json" | "keyword.json", query: string) {
  const url = new URL(`${KAKAO_LOCAL_BASE_URL}/${path}`);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `KakaoAK ${apiKey()}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new KakaoFetchError(`Kakao request failed with ${response.status}`);
  }

  return mapKakaoLocalResponse(await response.json());
}

export async function searchPlaces(query: string): Promise<GeocodeCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Touch the key first so a missing secret fails before any network call.
  apiKey();

  const settled = await Promise.allSettled([
    fetchKakaoDocuments("address.json", trimmed),
    fetchKakaoDocuments("keyword.json", trimmed),
  ]);

  const groups = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (groups.length === 0) {
    const first = settled[0];
    throw first.status === "rejected" ? first.reason : new KakaoFetchError("Kakao search failed");
  }

  return mergeGeocodeCandidates(groups);
}
