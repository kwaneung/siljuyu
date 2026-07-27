# siljuyu

Mobile-first fuel cost ranker for Korea. siljuyu compares nearby Opinet stations by
**total one-way cost**:

```text
(distanceKm / efficiencyKmPerL) * pricePerL + fillLiters * pricePerL
```

The app uses Next.js App Router route handlers as server-only proxies so API keys
never enter the browser bundle.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- Vitest
- `motion`
- pnpm

## Environment

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Required for live station prices:

- `OPINET_API_KEY` — Opinet Open API key. Register/check API docs at:
  https://www.opinet.co.kr/user/custapi/openApiInfoDtl.do?apiId=3

If `OPINET_API_KEY` is missing, `/api/stations` and `/api/stations/[id]` return
`503 OPINET_KEY_MISSING`. The app still builds and tests without any secrets.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Product behavior

- First visit requires onboarding before ranking.
- Origin is **browser geolocation only** for v1. Address search may come later.
- Preferences are stored only in `localStorage` under `siljuyu.prefs.v1`.
- Radius is intentionally limited to `3km` or `5km`; Opinet `aroundAll.do`
  accepts a maximum radius of `5000m`.
- Map navigation uses external Kakao/Naver/Google links only. There is no in-app
  map SDK.

## Vercel readiness

Set this project environment variable:

```text
OPINET_API_KEY=<server-only Opinet key>
```

Do not create a `NEXT_PUBLIC_` variant for the key.

## Smoke checklist

1. Open `/` with no saved prefs and confirm onboarding is required.
2. Allow geolocation, select a vehicle preset, edit efficiency, pick fill liters
   and `3km` or `5km`.
3. Confirm `/` shows a ranked list or a clear API/key/empty state.
4. Change efficiency/fill liters and confirm rank order updates without changing
   radius.
5. Change radius between `3km` and `5km` and confirm data refetches.
6. Select a ranked station and confirm the top panel shows fuel type, 원/L,
   cost breakdown, and external map links (no separate detail page).
