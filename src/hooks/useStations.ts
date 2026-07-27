"use client";

import { useEffect, useState } from "react";
import type { FuelType } from "@/lib/fuel/types";
import type { OpinetStation } from "@/lib/opinet/mapResponse";
import type { Origin, RadiusKm } from "@/lib/prefs/storage";

type StationsState =
  | { status: "idle"; stations: OpinetStation[]; message?: undefined }
  | { status: "loading"; stations: OpinetStation[]; message?: undefined }
  | { status: "success"; stations: OpinetStation[]; message?: undefined }
  | { status: "empty"; stations: OpinetStation[]; message: string }
  | { status: "error"; stations: OpinetStation[]; message: string };

export function useStations(params: {
  origin?: Origin;
  radiusKm?: RadiusKm;
  fuelType?: FuelType;
}) {
  const [state, setState] = useState<StationsState>({ status: "idle", stations: [] });

  useEffect(() => {
    if (!params.origin || !params.radiusKm || !params.fuelType) {
      setState({ status: "idle", stations: [] });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ status: "loading", stations: prev.stations }));

    const query = new URLSearchParams({
      lat: String(params.origin.lat),
      lng: String(params.origin.lng),
      radiusKm: String(params.radiusKm),
      prodcd: params.fuelType,
    });

    fetch(`/api/stations?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "주유소 정보를 불러오지 못했어요.");
        }
        return (payload.stations ?? []) as OpinetStation[];
      })
      .then((stations) => {
        setState(
          stations.length
            ? { status: "success", stations }
            : {
                status: "empty",
                stations: [],
                message: "반경 안에서 가격 정보를 찾지 못했어요.",
              },
        );
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          stations: [],
          message:
            caught instanceof Error
              ? caught.message
              : "주유소 정보를 불러오지 못했어요.",
        });
      });

    return () => controller.abort();
  }, [params.origin, params.radiusKm, params.fuelType]);

  return state;
}
