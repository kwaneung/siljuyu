import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("server-only", () => ({}));

const originalKakaoKey = process.env.KAKAO_REST_API_KEY;

afterEach(() => {
  process.env.KAKAO_REST_API_KEY = originalKakaoKey;
});

describe("GET /api/geocode", () => {
  it("rejects a blank query", async () => {
    const response = await GET(new NextRequest("https://siljuyu.test/api/geocode?q="));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_QUERY" },
    });
  });

  it("returns a stable 503 when KAKAO_REST_API_KEY is missing", async () => {
    delete process.env.KAKAO_REST_API_KEY;

    const response = await GET(
      new NextRequest("https://siljuyu.test/api/geocode?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD"),
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "KAKAO_KEY_MISSING",
        message: "Kakao REST API key is not configured.",
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/KakaoAK/i);
  });
});
