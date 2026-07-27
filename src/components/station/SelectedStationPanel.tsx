"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { formatWon, type StationCost } from "@/lib/cost/totalCost";
import { FUEL_TYPES, type FuelType } from "@/lib/fuel/types";
import { MapLinks } from "./MapLinks";

export type SelectableStation = {
  id: string;
  name: string;
  pricePerL: number;
  distanceM: number;
  costs: StationCost;
  wgs84?: { lat: number; lng: number };
};

type DetailPayload = {
  address?: string;
  roadAddress?: string;
  phone?: string;
};

export function SelectedStationPanel({
  station,
  fuelType,
  fillLiters,
  efficiencyKmPerL,
  rankLabel,
}: {
  station: SelectableStation | null;
  fuelType?: FuelType;
  fillLiters?: number;
  efficiencyKmPerL?: number;
  rankLabel: string;
}) {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!station) {
      setDetail(null);
      setDetailMessage(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setDetailMessage(null);

    const query = fuelType ? `?prodcd=${fuelType}` : "";
    fetch(`/api/stations/${encodeURIComponent(station.id)}${query}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "상세 주소를 불러오지 못했어요.");
        }
        return payload.detail as DetailPayload;
      })
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch((caught) => {
        if (!cancelled) {
          setDetailMessage(
            caught instanceof Error
              ? caught.message
              : "상세 주소를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [station?.id, fuelType]);

  if (!station) {
    return (
      <section className="glass mt-8 rounded-[36px] p-5">
        <p className="text-sm text-[var(--brand)]">선택 주유소</p>
        <p className="mt-4 text-[var(--ink-muted)]">목록이 준비되면 여기에 상세가 열려요.</p>
      </section>
    );
  }

  return (
    <motion.section
      key={station.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="glass mt-8 space-y-5 rounded-[36px] p-5"
    >
      <div>
        <p className="text-sm text-[var(--brand)]">{rankLabel}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{station.name}</h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          {fuelType ? FUEL_TYPES[fuelType].label : "선택 유종"} ·{" "}
          {station.pricePerL.toLocaleString("ko-KR")}원/L
        </p>
        {(detail?.roadAddress || detail?.address) && (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {detail.roadAddress ?? detail.address}
          </p>
        )}
        {detail?.phone && (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{detail.phone}</p>
        )}
        {detailMessage && (
          <p className="mt-3 text-sm text-[var(--spark)]">{detailMessage}</p>
        )}
      </div>

      <div>
        <p className="text-5xl font-black text-[var(--brand)]">
          {formatWon(station.costs.totalCost)}
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--line)] pb-3">
            <span className="text-[var(--ink-muted)]">편도 이동 연료비</span>
            <strong>{formatWon(station.costs.travelCost)}</strong>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] pb-3">
            <span className="text-[var(--ink-muted)]">주유 비용 {fillLiters}L</span>
            <strong>{formatWon(station.costs.fillCost)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">
              거리 {(station.distanceM / 1000).toFixed(1)}km · 연비 {efficiencyKmPerL}km/L
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold">외부 지도에서 출발</h3>
        <MapLinks
          name={station.name}
          lat={station.wgs84?.lat}
          lng={station.wgs84?.lng}
        />
      </div>
    </motion.section>
  );
}
