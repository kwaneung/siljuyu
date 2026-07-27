import "server-only";

export type GeocodeCandidate = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

type KakaoDocument = {
  address_name?: string;
  place_name?: string;
  x?: string;
  y?: string;
};

export class MissingKakaoKeyError extends Error {
  constructor() {
    super("KAKAO_REST_API_KEY is not configured");
    this.name = "MissingKakaoKeyError";
  }
}

function kakaoKey() {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new MissingKakaoKeyError();
  return key;
}

export async function geocodeAddress(query: string): Promise<GeocodeCandidate[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${kakaoKey()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Kakao geocode failed with ${response.status}`);
  }

  const payload = (await response.json()) as { documents?: KakaoDocument[] };
  return (payload.documents ?? []).flatMap((doc) => {
    const lng = Number(doc.x);
    const lat = Number(doc.y);
    const address = doc.address_name?.trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !address) return [];

    return [
      {
        label: doc.place_name?.trim() || address,
        address,
        lat,
        lng,
      },
    ];
  });
}
