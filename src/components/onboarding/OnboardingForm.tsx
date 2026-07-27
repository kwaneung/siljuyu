"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { VEHICLE_PRESETS } from "@/data/vehiclePresets";
import { FUEL_TYPES, FUEL_TYPE_CODES, type FuelType } from "@/lib/fuel/types";
import { savePrefs, type RadiusKm } from "@/lib/prefs/storage";
import { useGeolocation } from "@/hooks/useGeolocation";

const FILL_PRESETS = [20, 40, 60];

export function OnboardingForm() {
  const router = useRouter();
  const geo = useGeolocation();
  const [vehiclePresetId, setVehiclePresetId] = useState<string | undefined>();
  const [fuelType, setFuelType] = useState<FuelType | undefined>();
  const [efficiency, setEfficiency] = useState("");
  const [fillLiters, setFillLiters] = useState("");
  const [radiusKm, setRadiusKm] = useState<RadiusKm | undefined>();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(id: string) {
    const preset = VEHICLE_PRESETS.find((item) => item.id === id);
    if (!preset) {
      setVehiclePresetId(undefined);
      return;
    }
    setVehiclePresetId(id);
    setFuelType(preset.fuelType);
    setEfficiency(String(preset.officialKmPerL));
  }

  function complete() {
    const parsedEfficiency = Number(efficiency);
    const parsedFill = Number(fillLiters);

    if (geo.status !== "granted") {
      setMessage("현재 위치 권한이 필요해요. 위치를 허용한 뒤 다시 시도해 주세요.");
      return;
    }

    if (
      !Number.isFinite(parsedEfficiency) ||
      parsedEfficiency <= 0 ||
      !fuelType ||
      !Number.isFinite(parsedFill) ||
      parsedFill <= 0 ||
      !radiusKm
    ) {
      setMessage("유종, 연비, 주유량, 반경을 모두 확정해 주세요.");
      return;
    }

    savePrefs({
      onboardingDone: true,
      efficiencyKmPerL: parsedEfficiency,
      fuelType,
      fillLiters: parsedFill,
      radiusKm,
      lastOrigin: geo.origin,
      vehiclePresetId,
    });
    router.push("/");
  }

  return (
    <main className="app-shell">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-7"
      >
        <header className="pt-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand)]">
            siljuyu start
          </p>
          <h1 className="display-face mt-3 text-5xl leading-[0.92]">
            첫 주유 랭킹을 만들 기준을 잡아요
          </h1>
          <p className="mt-4 text-[var(--ink-muted)]">
            현재 위치와 유종·연비를 한 번만 저장하면 다음부터 바로 순위를 보여줘요.
          </p>
        </header>

        <section className="glass rounded-[32px] p-5">
          <h2 className="text-lg font-bold">1. 현재 위치</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            기준 위치는 기기 GPS만 사용해요.
          </p>
          {geo.status === "idle" || geo.status === "requesting" ? (
            <p className="mt-3 text-sm text-[var(--brand)]">현재 위치를 확인하고 있어요...</p>
          ) : null}
          {geo.status === "granted" && (
            <p className="mt-3 rounded-2xl bg-[rgba(141,249,111,0.12)] p-3 text-sm text-[var(--brand)]">
              현재 위치 준비 완료
            </p>
          )}
          {"message" in geo && geo.message ? (
            <p className="mt-3 text-sm text-[var(--spark)]">{geo.message}</p>
          ) : null}
          <button
            type="button"
            className="secondary-cta mt-4 w-full whitespace-nowrap"
            onClick={geo.requestLocation}
          >
            위치 새로고침
          </button>
        </section>

        <section className="glass rounded-[32px] p-5">
          <h2 className="text-lg font-bold">2. 유종과 연비</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            랭킹은 유종과 연비로 계산해요. 차량 프리셋은 선택하면 값을 채워 줍니다.
          </p>

          <label className="mt-4 block text-sm text-[var(--ink-muted)]" htmlFor="vehicle-preset">
            차량 프리셋 (선택)
          </label>
          <select
            id="vehicle-preset"
            className="field mt-2"
            value={vehiclePresetId ?? ""}
            onChange={(event) => {
              const nextId = event.target.value;
              if (!nextId) {
                setVehiclePresetId(undefined);
                return;
              }
              applyPreset(nextId);
            }}
          >
            <option value="">직접 입력</option>
            {VEHICLE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.model} · {FUEL_TYPES[preset.fuelType].label} ·{" "}
                {preset.officialKmPerL}km/L
              </option>
            ))}
          </select>

          <p className="mt-5 text-sm text-[var(--ink-muted)]">유종</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FUEL_TYPE_CODES.map((code) => (
              <button
                type="button"
                key={code}
                className={`pill ${fuelType === code ? "pill-active" : ""}`}
                onClick={() => {
                  setFuelType(code);
                  setVehiclePresetId(undefined);
                }}
              >
                {FUEL_TYPES[code].label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-[var(--ink-muted)]" htmlFor="efficiency">
            연비 km/L
          </label>
          <input
            id="efficiency"
            className="field mt-2"
            inputMode="decimal"
            value={efficiency}
            onChange={(event) => {
              setEfficiency(event.target.value);
              setVehiclePresetId(undefined);
            }}
            placeholder="예: 11.2"
          />
        </section>

        <section className="glass rounded-[32px] p-5">
          <h2 className="text-lg font-bold">3. 주유량과 반경</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {FILL_PRESETS.map((liters) => (
              <button
                key={liters}
                type="button"
                className={`pill ${fillLiters === String(liters) ? "pill-active" : ""}`}
                onClick={() => setFillLiters(String(liters))}
              >
                {liters}L
              </button>
            ))}
          </div>
          <input
            className="field mt-3"
            inputMode="decimal"
            value={fillLiters}
            onChange={(event) => setFillLiters(event.target.value)}
            placeholder="직접 입력: 35"
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[3, 5].map((radius) => (
              <button
                key={radius}
                type="button"
                className={`pill ${radiusKm === radius ? "pill-active" : ""}`}
                onClick={() => setRadiusKm(radius as RadiusKm)}
              >
                {radius}km
              </button>
            ))}
          </div>
        </section>

        {message && <p className="text-sm text-[var(--spark)]">{message}</p>}
        <button type="button" className="primary-cta w-full" onClick={complete}>
          총비용 랭킹 보기
        </button>
      </motion.section>
    </main>
  );
}
