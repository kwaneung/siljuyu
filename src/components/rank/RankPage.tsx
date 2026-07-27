"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { FUEL_TYPES, FUEL_TYPE_CODES, type FuelType } from "@/lib/fuel/types";
import { formatWon, rankStations } from "@/lib/cost/totalCost";
import {
  isOnboardingComplete,
  loadPrefs,
  savePrefs,
  type RadiusKm,
  type UserPrefs,
} from "@/lib/prefs/storage";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStations } from "@/hooks/useStations";

function detailHref(station: {
  id: string;
  name: string;
  pricePerL: number;
  distanceM: number;
  wgs84?: { lat: number; lng: number };
}) {
  const params = new URLSearchParams({
    name: station.name,
    pricePerL: String(station.pricePerL),
    distanceM: String(station.distanceM),
  });
  if (station.wgs84) {
    params.set("lat", String(station.wgs84.lat));
    params.set("lng", String(station.wgs84.lng));
  }
  return `/station/${encodeURIComponent(station.id)}?${params.toString()}`;
}

export function RankPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);

  useEffect(() => {
    const loaded = loadPrefs();
    if (!isOnboardingComplete(loaded)) {
      router.replace("/onboarding");
      return;
    }
    setPrefs(loaded);
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (geo.status !== "granted" || !prefs) return;
    updatePrefs({ lastOrigin: geo.origin });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status]);

  function updatePrefs(patch: Partial<UserPrefs>) {
    setPrefs((current) => {
      if (!current) return current;
      return savePrefs({ ...current, ...patch });
    });
  }

  const stationsState = useStations({
    origin: prefs?.lastOrigin,
    radiusKm: prefs?.radiusKm,
    fuelType: prefs?.fuelType,
  });

  const ranked = useMemo(() => {
    if (!prefs?.efficiencyKmPerL || !prefs.fillLiters) return [];
    return rankStations(stationsState.stations, {
      efficiencyKmPerL: prefs.efficiencyKmPerL,
      fillLiters: prefs.fillLiters,
    }).slice(0, 30);
  }, [stationsState.stations, prefs?.efficiencyKmPerL, prefs?.fillLiters]);

  if (!prefs) {
    return (
      <main className="app-shell flex items-center justify-center">
        <p className="text-[var(--ink-muted)]">저장된 조건을 확인하고 있어요...</p>
      </main>
    );
  }

  const top = ranked[0];
  const locationLabel =
    geo.status === "granted"
      ? "현재 위치"
      : geo.status === "requesting"
        ? "위치 확인 중"
        : (prefs.lastOrigin?.label ?? "저장된 위치");

  return (
    <main className="app-shell space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="min-h-[86vh] pt-7"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand)]">siljuyu</p>
          <Link href="/onboarding" className="secondary-cta min-h-10 px-4 text-sm">
            다시 설정
          </Link>
        </div>

        <h1 className="display-face mt-8 text-6xl leading-[0.86]">
          리터가 아니라
          <br />
          도착까지 싼 곳
        </h1>
        <p className="mt-5 max-w-[24rem] text-[var(--ink-muted)]">
          {locationLabel} 기준 {prefs.radiusKm}km 안 주유소를 이동 연료비까지 더해 줄 세웠어요.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="secondary-cta" onClick={geo.requestLocation}>
            현재 위치 새로고침
          </button>
          {"message" in geo && geo.message ? (
            <p className="text-sm text-[var(--spark)]">{geo.message}</p>
          ) : null}
        </div>

        <motion.section
          animate={top ? { scale: [1, 1.015, 1] } : undefined}
          transition={{ duration: 2.6, repeat: top ? Infinity : 0, ease: "easeInOut" }}
          className="glass mt-8 rounded-[36px] p-5"
        >
          <p className="text-sm text-[var(--brand)]">현재 1등</p>
          {top ? (
            <>
              <h2 className="mt-2 text-3xl font-black">{top.name}</h2>
              <p className="mt-2 text-5xl font-black text-[var(--brand)]">
                {formatWon(top.costs.totalCost)}
              </p>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">
                이동 {formatWon(top.costs.travelCost)} + 주유{" "}
                {formatWon(top.costs.fillCost)} · {Math.round(top.distanceM)}m
              </p>
            </>
          ) : (
            <p className="mt-4 text-[var(--ink-muted)]">
              {stationsState.status === "loading" || geo.status === "requesting"
                ? "가격을 가져오는 중이에요..."
                : "현재 위치를 허용하거나 조건을 조정해 주세요."}
            </p>
          )}
        </motion.section>

        <section className="mt-5 grid grid-cols-2 gap-2">
          <label className="text-sm text-[var(--ink-muted)]">
            연비 km/L
            <input
              className="field mt-1"
              inputMode="decimal"
              value={prefs.efficiencyKmPerL ?? ""}
              onChange={(event) =>
                updatePrefs({ efficiencyKmPerL: Number(event.target.value) || undefined })
              }
            />
          </label>
          <label className="text-sm text-[var(--ink-muted)]">
            주유량 L
            <input
              className="field mt-1"
              inputMode="decimal"
              value={prefs.fillLiters ?? ""}
              onChange={(event) =>
                updatePrefs({ fillLiters: Number(event.target.value) || undefined })
              }
            />
          </label>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          {[3, 5].map((radius) => (
            <button
              key={radius}
              type="button"
              className={`pill ${prefs.radiusKm === radius ? "pill-active" : ""}`}
              onClick={() => updatePrefs({ radiusKm: radius as RadiusKm })}
            >
              반경 {radius}km
            </button>
          ))}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          {FUEL_TYPE_CODES.map((code) => (
            <button
              key={code}
              type="button"
              className={`pill ${prefs.fuelType === code ? "pill-active" : ""}`}
              onClick={() => updatePrefs({ fuelType: code as FuelType })}
            >
              {FUEL_TYPES[code].shortLabel}
            </button>
          ))}
        </section>
      </motion.header>

      <section className="space-y-3 pb-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">총비용 순위</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            {stationsState.status === "loading" ? "새로 계산 중" : `${ranked.length}곳`}
          </p>
        </div>

        {stationsState.status === "error" && (
          <div className="rounded-3xl border border-[rgba(255,116,104,0.45)] bg-[rgba(255,116,104,0.1)] p-4 text-sm">
            {stationsState.message}
          </div>
        )}
        {stationsState.status === "empty" && (
          <div className="rounded-3xl border border-[var(--line)] bg-white/[0.05] p-4 text-sm">
            {stationsState.message}
          </div>
        )}

        <div className="space-y-3">
          {ranked.map((station, index) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.35 }}
            >
              <Link
                href={detailHref(station)}
                className="block rounded-[28px] border border-[var(--line)] bg-white/[0.06] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--brand)]">#{index + 1}</p>
                    <h3 className="mt-1 text-lg font-black">{station.name}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {station.pricePerL.toLocaleString("ko-KR")}원/L ·{" "}
                      {(station.distanceM / 1000).toFixed(1)}km
                    </p>
                  </div>
                  <strong className="text-right text-xl text-[var(--brand)]">
                    {formatWon(station.costs.totalCost)}
                  </strong>
                </div>
                <p className="mt-3 text-xs text-[var(--ink-muted)]">
                  이동 {formatWon(station.costs.travelCost)} + 주유{" "}
                  {formatWon(station.costs.fillCost)}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
