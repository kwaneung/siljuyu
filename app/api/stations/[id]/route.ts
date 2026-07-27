import { NextResponse, type NextRequest } from "next/server";
import { isFuelType } from "@/lib/fuel/types";
import { fetchStationDetail, MissingOpinetKeyError } from "@/lib/opinet/client";

export const runtime = "nodejs";

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const prodcd = request.nextUrl.searchParams.get("prodcd");

  if (!id.trim()) {
    return error(400, "INVALID_STATION_ID", "Station id is required.");
  }

  if (prodcd !== null && !isFuelType(prodcd)) {
    return error(400, "INVALID_FUEL_TYPE", "prodcd is not supported.");
  }

  try {
    const detail = await fetchStationDetail({ id, prodcd: prodcd ?? undefined });
    if (!detail) {
      return error(404, "STATION_NOT_FOUND", "Station detail was not found.");
    }
    return NextResponse.json({ detail });
  } catch (caught) {
    if (caught instanceof MissingOpinetKeyError) {
      return error(503, "OPINET_KEY_MISSING", "Opinet API key is not configured.");
    }

    console.error(caught);
    return error(502, "OPINET_REQUEST_FAILED", "Could not load station detail.");
  }
}
