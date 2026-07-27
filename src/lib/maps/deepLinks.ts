import type { Wgs84Point } from "@/lib/geo/katec";

export type MapDeepLinkInput = Wgs84Point & {
  name: string;
};

export type MapDeepLink = {
  provider: "kakao" | "naver" | "google";
  label: string;
  href: string;
};

function enc(value: string) {
  return encodeURIComponent(value);
}

export function buildMapDeepLinks(input: MapDeepLinkInput): MapDeepLink[] {
  const name = input.name.trim() || "주유소";
  const lat = input.lat.toFixed(7);
  const lng = input.lng.toFixed(7);

  return [
    {
      provider: "kakao",
      label: "카카오맵",
      href: `https://map.kakao.com/link/to/${enc(name)},${lat},${lng}`,
    },
    {
      provider: "naver",
      label: "네이버지도",
      href: `https://map.naver.com/p/directions/-/${lng},${lat},${enc(name)}`,
    },
    {
      provider: "google",
      label: "Google Maps",
      href: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&query=${enc(name)}`,
    },
  ];
}
