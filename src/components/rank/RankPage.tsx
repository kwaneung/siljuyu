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
import { SelectedStationPanel } from "@/components/station/SelectedStationPanel";

export function RankPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  useEffect(() => {
    if (ranked.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) =>
      current && ranked.some((station) => station.id === current)
        ? current
        : ranked[0].id,
    );
  }, [ranked]);

  if (!prefs) {
    return (
      <main className="app-shell flex items-center justify-center">
        <p className="text-[var(--ink-muted)]">저장된 조건을 확인하고 있어요...</p>
      </main>
    );
  }

  const selected =
    ranked.find((station) => station.id === selectedId) ?? ranked[0] ?? null;
  const selectedRank = selected
    ? ranked.findIndex((station) => station.id === selected.id) + 1
    : 0;
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
        className="pt-7"
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
          아래에서 고르면 상단에 상세와 길찾기가 열려요.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="secondary-cta whitespace-nowrap"
            onClick={geo.requestLocation}
          >
            현재 위치 새로고침
          </button>
          {"message" in geo && geo.message ? (
            <p className="text-sm text-[var(--spark)]">{geo.message}</p>
          ) : null}
        </div>

        {stationsState.status === "loading" || geo.status === "requesting" ? (
          <section className="glass mt-8 rounded-[36px] p-5">
            <p className="text-[var(--ink-muted)]">가격을 가져오는 중이에요...</p>
          </section>
        ) : (
          <SelectedStationPanel
            station={selected}
            fuelType={prefs.fuelType}
            fillLiters={prefs.fillLiters}
            efficiencyKmPerL={prefs.efficiencyKmPerL}
            rankLabel={selectedRank > 0 ? `#${selectedRank} 상세` : "선택 주유소"}
          />
        )}

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
          {ranked.map((station, index) => {
            const isSelected = station.id === selected?.id;
            return (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(station.id)}
                  className={`w-full rounded-[28px] border p-4 text-left ${
                    isSelected
                      ? "border-[var(--brand)] bg-[rgba(141,249,111,0.12)]"
                      : "border-[var(--line)] bg-white/[0.06]"
                  }`}
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
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
