"use client";

import { FormEvent, useState } from "react";
import type { Origin } from "@/lib/prefs/storage";

type Candidate = Origin & {
  address?: string;
};

export function ManualLocation({
  onSelect,
  compact = false,
}: {
  onSelect: (origin: Origin) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setStatus(null);
    setCandidates([]);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();

      if (!response.ok) {
        setStatus(
          payload?.error?.code === "KAKAO_KEY_MISSING"
            ? "주소 검색 키가 없어 좌표 입력으로 계속할 수 있어요."
            : "주소를 찾지 못했어요. 좌표 입력을 사용해 보세요.",
        );
        return;
      }

      const nextCandidates = (payload.candidates ?? []) as Candidate[];
      setCandidates(nextCandidates);
      setStatus(nextCandidates.length ? null : "검색 결과가 없어요. 좌표로 입력해 주세요.");
    } catch {
      setStatus("주소 검색 중 문제가 생겼어요. 좌표 입력은 계속 사용할 수 있어요.");
    } finally {
      setLoading(false);
    }
  }

  function submitCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setStatus("위도와 경도를 숫자로 입력해 주세요.");
      return;
    }

    onSelect({ lat: parsedLat, lng: parsedLng, label: "수동 좌표" });
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <form onSubmit={searchAddress} className="space-y-3">
        <label className="block text-sm text-[var(--ink-muted)]" htmlFor="address">
          주소로 찾기
        </label>
        <div className="flex gap-2">
          <input
            id="address"
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 서울 중구 세종대로"
          />
          <button className="secondary-cta shrink-0" type="submit" disabled={loading}>
            {loading ? "검색" : "찾기"}
          </button>
        </div>
      </form>

      {candidates.length > 0 && (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <button
              key={`${candidate.lat}-${candidate.lng}-${candidate.label}`}
              type="button"
              className="w-full rounded-2xl border border-[var(--line)] bg-white/[0.06] p-3 text-left"
              onClick={() => onSelect(candidate)}
            >
              <strong className="block text-sm">{candidate.label}</strong>
              <span className="text-xs text-[var(--ink-muted)]">{candidate.address}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submitCoordinates} className="grid grid-cols-2 gap-2">
        <label className="col-span-2 block text-sm text-[var(--ink-muted)]">
          또는 좌표 입력
        </label>
        <input
          className="field"
          inputMode="decimal"
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          placeholder="위도 37.5665"
        />
        <input
          className="field"
          inputMode="decimal"
          value={lng}
          onChange={(event) => setLng(event.target.value)}
          placeholder="경도 126.9780"
        />
        <button type="submit" className="primary-cta col-span-2">
          이 위치로 계속
        </button>
      </form>

      {status && <p className="text-sm text-[var(--spark)]">{status}</p>}
    </div>
  );
}
