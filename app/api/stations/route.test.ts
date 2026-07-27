import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("server-only", () => ({}));

const originalOpinetKey = process.env.OPINET_API_KEY;

afterEach(() => {
  process.env.OPINET_API_KEY = originalOpinetKey;
});

describe("GET /api/stations", () => {
  it("rejects radius values above the Opinet 5000m ceiling", async () => {
    const response = await GET(
      new NextRequest("https://siljuyu.test/api/stations?lat=37.5&lng=127&radiusKm=10&prodcd=B027"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_RADIUS" },
    });
  });

  it("returns a stable 503 when OPINET_API_KEY is missing", async () => {
    delete process.env.OPINET_API_KEY;

    const response = await GET(
      new NextRequest("https://siljuyu.test/api/stations?lat=37.5&lng=127&radiusKm=3&prodcd=B027"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "OPINET_KEY_MISSING",
        message: "Opinet API key is not configured.",
      },
    });
  });
});
