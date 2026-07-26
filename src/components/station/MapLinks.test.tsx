import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapLinks } from "./MapLinks";

describe("MapLinks", () => {
  it("renders external navigation anchors for a station fixture", () => {
    const html = renderToStaticMarkup(
      <MapLinks name="서울 실주유" lat={37.5665} lng={126.978} />,
    );

    expect(html).toContain("카카오맵");
    expect(html).toContain("네이버지도");
    expect(html).toContain("Google Maps");
    expect(html).toContain("target=\"_blank\"");
  });
});
