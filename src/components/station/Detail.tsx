"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { computeStationCosts, formatWon } from "@/lib/cost/totalCost";
import { FUEL_TYPES } from "@/lib/fuel/types";
import { loadPrefs, type UserPrefs } from "@/lib/prefs/storage";
import { MapLinks } from "./MapLinks";

type DetailPayload = {
  id: string;
  name?: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
  brand?: string;
};

function queryNumber(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function StationDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);

  const name = params.get("name") ?? detail?.name ?? "주유소";
  const pricePerL = queryNumber(params.get("pricePerL"));
  const distanceM = queryNumber(params.get("distanceM"));
  const lat = queryNumber(params.get("lat"));
  const lng = queryNumber(params.get("lng"));

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
  }, []);

  useEffect(() => {
    const fuelType = prefs?.fuelType;
    const query = fuelType ? `?prodcd=${fuelType}` : "";
    fetch(`/api/stations/${encodeURIComponent(id)}${query}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "상세 주소를 불러오지 못했어요.");
        }
        return payload.detail as DetailPayload;
      })
      .then(setDetail)
      .catch((caught) => {
        setDetailMessage(
          caught instanceof Error
            ? caught.message
            : "상세 주소를 불러오지 못했어요.",
        );
      });
  }, [id, prefs?.fuelType]);

  const costs = useMemo(() => {
    if (
      pricePerL === undefined ||
      distanceM === undefined ||
      !prefs?.efficiencyKmPerL ||
      !prefs.fillLiters
    ) {
      return null;
    }
    return computeStationCosts({
      pricePerL,
      distanceM,
      efficiencyKmPerL: prefs.efficiencyKmPerL,
      fillLiters: prefs.fillLiters,
    });
  }, [distanceM, prefs?.efficiencyKmPerL, prefs?.fillLiters, pricePerL]);

  return (
    <main className="app-shell">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-5 pt-7"
      >
        <Link href="/" className="secondary-cta min-h-10 px-4 text-sm">
          ← 순위로
        </Link>

        <header className="glass rounded-[36px] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand)]">
            station detail
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{name}</h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {prefs?.fuelType ? FUEL_TYPES[prefs.fuelType].label : "선택 유종"} ·{" "}
            {pricePerL !== undefined
              ? `${pricePerL.toLocaleString("ko-KR")}원/L`
              : "가격 정보 없음"}
          </p>
          {(detail?.roadAddress || detail?.address) && (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              {detail.roadAddress ?? detail.address}
            </p>
          )}
          {detailMessage && (
            <p className="mt-3 text-sm text-[var(--spark)]">{detailMessage}</p>
          )}
        </header>

        <section className="glass rounded-[32px] p-5">
          <h2 className="text-lg font-bold">총비용 분해</h2>
          {costs ? (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between border-b border-[var(--line)] pb-3">
                <span className="text-[var(--ink-muted)]">편도 이동 연료비</span>
                <strong>{formatWon(costs.travelCost)}</strong>
              </div>
              <div className="flex justify-between border-b border-[var(--line)] pb-3">
                <span className="text-[var(--ink-muted)]">
                  주유 비용 {prefs?.fillLiters}L
                </span>
                <strong>{formatWon(costs.fillCost)}</strong>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-[var(--ink-muted)]">
                  거리 {((distanceM ?? 0) / 1000).toFixed(1)}km · 연비{" "}
                  {prefs?.efficiencyKmPerL}km/L
                </span>
                <strong className="text-3xl text-[var(--brand)]">
                  {formatWon(costs.totalCost)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              목록에서 다시 열면 가격과 거리 기준의 총비용을 볼 수 있어요.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">외부 지도에서 출발</h2>
          <MapLinks
            name={name}
            lat={lat}
            lng={lng}
          />
        </section>
      </motion.section>
    </main>
  );
}
