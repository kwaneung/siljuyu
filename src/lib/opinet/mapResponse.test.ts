import { describe, expect, it } from "vitest";
import { wgs84ToKatec } from "@/lib/geo/katec";
import { mapAroundAllResponse, mapDetailResponse } from "./mapResponse";

describe("mapAroundAllResponse", () => {
  it("maps array OIL rows into station domain objects", () => {
    const katec = wgs84ToKatec({ lat: 37.5665, lng: 126.978 });
    const stations = mapAroundAllResponse({
      RESULT: {
        OIL: [
          {
            UNI_ID: "A0001",
            OS_NM: "서울 실주유",
            POLL_DIV_CD: "SKE",
            PRICE: "1,700",
            DISTANCE: "1234",
            GIS_X_COOR: String(katec.x),
            GIS_Y_COOR: String(katec.y),
          },
        ],
      },
    });

    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({
      id: "A0001",
      name: "서울 실주유",
      brand: "SKE",
      pricePerL: 1700,
      distanceM: 1234,
    });
    expect(stations[0].wgs84?.lat).toBeCloseTo(37.5665, 4);
  });

  it("maps single-object OIL and skips unusable rows", () => {
    const stations = mapAroundAllResponse({
      RESULT: {
        OIL: {
          UNI_ID: "A0002",
          OS_NM: "단일 응답",
          PRICE: "1690",
          DISTANCE: "650",
        },
      },
    });

    expect(stations).toEqual([
      {
        id: "A0002",
        name: "단일 응답",
        brand: undefined,
        pricePerL: 1690,
        distanceM: 650,
        katecX: undefined,
        katecY: undefined,
        wgs84: undefined,
      },
    ]);
    expect(mapAroundAllResponse({ RESULT: { OIL: { UNI_ID: "bad" } } })).toEqual([]);
  });
});

describe("mapDetailResponse", () => {
  it("maps detail address fields", () => {
    const detail = mapDetailResponse({
      RESULT: {
        OIL: {
          UNI_ID: "A0001",
          OS_NM: "서울 실주유",
          VAN_ADR: "서울시 중구",
          NEW_ADR: "서울 중구 세종대로",
          TEL: "02-123-4567",
        },
      },
    });

    expect(detail).toEqual({
      id: "A0001",
      name: "서울 실주유",
      address: "서울시 중구",
      roadAddress: "서울 중구 세종대로",
      phone: "02-123-4567",
      brand: undefined,
    });
  });
});
