"use client";

import { useCallback, useState } from "react";
import type { Origin } from "@/lib/prefs/storage";

type GeoState =
  | { status: "idle"; origin?: undefined; message?: undefined }
  | { status: "requesting"; origin?: undefined; message?: undefined }
  | { status: "granted"; origin: Origin; message?: undefined }
  | { status: "denied" | "unsupported" | "error"; origin?: undefined; message: string };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({
        status: "unsupported",
        message: "이 브라우저에서는 현재 위치를 사용할 수 없어요.",
      });
      return;
    }

    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "현재 위치",
          },
        });
      },
      (error) => {
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          message:
            error.code === error.PERMISSION_DENIED
              ? "위치 권한이 필요해요. 브라우저 설정에서 위치를 허용한 뒤 다시 시도해 주세요."
              : "현재 위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, requestLocation };
}
