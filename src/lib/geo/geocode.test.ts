import { describe, expect, it } from "vitest";
import { mapKakaoLocalResponse } from "./geocode";

describe("mapKakaoLocalResponse", () => {
  it("maps address-search documents to WGS84 candidates", () => {
    const candidates = mapKakaoLocalResponse({
      documents: [
        {
          address_name: "서울 중구 세종대로 110",
          x: "126.978",
          y: "37.5665",
          road_address: { address_name: "서울 중구 세종대로 110" },
        },
      ],
    });

    expect(candidates).toEqual([
      {
        label: "서울 중구 세종대로 110",
        lat: 37.5665,
        lng: 126.978,
      },
    ]);
  });

  it("maps keyword-search documents and skips rows without coordinates", () => {
    const candidates = mapKakaoLocalResponse({
      documents: [
        {
          place_name: "서울시청",
          address_name: "서울 중구 태평로1가 31",
          road_address_name: "서울 중구 세종대로 110",
          x: "126.9784147",
          y: "37.5666805",
        },
        { place_name: "좌표 없음" },
      ],
    });

    expect(candidates).toEqual([
      {
        label: "서울시청 · 서울 중구 세종대로 110",
        lat: 37.5666805,
        lng: 126.9784147,
      },
    ]);
  });
});
