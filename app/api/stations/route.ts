import { NextResponse, type NextRequest } from "next/server";
import { isFuelType } from "@/lib/fuel/types";
import { fetchStationsAround, MissingOpinetKeyError } from "@/lib/opinet/client";

export const runtime = "nodejs";

function numberParam(params: URLSearchParams, key: string) {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : null;
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = numberParam(params, "lat");
  const lng = numberParam(params, "lng");
  const radiusKm = numberParam(params, "radiusKm");
  const prodcd = params.get("prodcd");

  if (lat === null || lng === null) {
    return error(400, "INVALID_ORIGIN", "lat and lng are required numbers.");
  }

  if (radiusKm !== 3 && radiusKm !== 5) {
    return error(400, "INVALID_RADIUS", "radiusKm must be 3 or 5.");
  }

  if (!isFuelType(prodcd)) {
    return error(400, "INVALID_FUEL_TYPE", "prodcd is not supported.");
  }

  try {
    const stations = await fetchStationsAround({
      origin: { lat, lng },
      radiusKm,
      prodcd,
    });
    return NextResponse.json({ stations });
  } catch (caught) {
    if (caught instanceof MissingOpinetKeyError) {
      return error(503, "OPINET_KEY_MISSING", "Opinet API key is not configured.");
    }

    console.error(caught);
    return error(502, "OPINET_REQUEST_FAILED", "Could not load station prices.");
  }
}
