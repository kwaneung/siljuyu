import proj4 from "proj4";

export type Wgs84Point = {
  lat: number;
  lng: number;
};

export type KatecPoint = {
  x: number;
  y: number;
};

const WGS84 = "EPSG:4326";
const KATEC = "KATEC";

// Korea Transverse Mercator used by legacy KATEC/OpenAPI integrations.
// Central meridian 128E, latitude origin 38N, false easting/northing 400000/600000.
proj4.defs(
  KATEC,
  "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +towgs84=-146.43,507.89,681.46 +units=m +no_defs",
);

function assertCoordinate(name: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`);
  }
}

export function wgs84ToKatec(point: Wgs84Point): KatecPoint {
  assertCoordinate("lat", point.lat);
  assertCoordinate("lng", point.lng);

  const [x, y] = proj4(WGS84, KATEC, [point.lng, point.lat]);
  return { x, y };
}

export function katecToWgs84(point: KatecPoint): Wgs84Point {
  assertCoordinate("x", point.x);
  assertCoordinate("y", point.y);

  const [lng, lat] = proj4(KATEC, WGS84, [point.x, point.y]);
  return { lat, lng };
}
