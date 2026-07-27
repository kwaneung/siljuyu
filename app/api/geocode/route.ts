import { NextResponse, type NextRequest } from "next/server";
import { geocodeAddress, MissingKakaoKeyError } from "@/lib/geo/geocode";

export const runtime = "nodejs";

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return error(400, "INVALID_QUERY", "Address query is required.");
  }

  try {
    const candidates = await geocodeAddress(query);
    return NextResponse.json({ candidates });
  } catch (caught) {
    if (caught instanceof MissingKakaoKeyError) {
      return error(503, "KAKAO_KEY_MISSING", "Kakao geocode key is not configured.");
    }

    console.error(caught);
    return error(502, "GEOCODE_FAILED", "Could not search that address.");
  }
}
