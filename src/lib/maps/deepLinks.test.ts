import { describe, expect, it } from "vitest";
import { buildMapDeepLinks } from "./deepLinks";

describe("buildMapDeepLinks", () => {
  it("builds Kakao, Naver, and Google navigation URLs with coordinates", () => {
    const links = buildMapDeepLinks({
      name: "서울 주유소",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(links).toHaveLength(3);
    expect(links.map((link) => link.provider)).toEqual(["kakao", "naver", "google"]);
    for (const link of links) {
      expect(link.href).toContain("37.5665000");
      expect(link.href).toContain("126.9780000");
      expect(link.href).toContain(encodeURIComponent("서울 주유소"));
    }
  });
});
