"use client";

import { useState, type FormEvent } from "react";
import { parseManualOrigin } from "@/lib/geo/origin";
import type { GeocodeCandidate } from "@/lib/geo/geocode";
import type { Origin } from "@/lib/prefs/storage";

export function ManualLocation({
  onSelect,
  selected,
}: {
  onSelect: (origin: Origin) => void;
  selected?: Origin;
}) {
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState(selected ? String(selected.lat) : "");
  const [lng, setLng] = useState(selected ? String(selected.lng) : "");
  const [candidates, setCandidates] = useState<GeocodeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function searchAddress() {
    const trimmed = query.trim();
    if (!trimmed) {
      setMessage("검색할 주소나 장소 이름을 입력해 주세요.");
      return;
    }

    setSearching(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const payload = await response.json();
      if (response.status === 503) {
        setCandidates([]);
        setMessage("주소 검색은 아직 준비되지 않았어요. 아래 좌표로 지정할 수 있어요.");
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "주소를 찾지 못했어요.");
      }

      const next = (payload.candidates ?? []) as GeocodeCandidate[];
      setCandidates(next);
      setMessage(next.length ? null : "검색 결과가 없어요. 좌표로 직접 입력해 주세요.");
    } catch (caught) {
      setCandidates([]);
      setMessage(
        caught instanceof Error ? caught.message : "주소를 찾지 못했어요.",
      );
    } finally {
      setSearching(false);
    }
  }

  function applyCandidate(candidate: GeocodeCandidate) {
    setLat(String(candidate.lat));
    setLng(String(candidate.lng));
    setQuery(candidate.label);
    onSelect({
      lat: candidate.lat,
      lng: candidate.lng,
      label: candidate.label,
    });
    setMessage(`${candidate.label}로 기준 위치를 정했어요.`);
  }

  function submitCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const origin = parseManualOrigin({
      lat: data.get("lat"),
      lng: data.get("lng"),
      label: query.trim() || selected?.label,
    });

    if (!origin) {
      setMessage("위도와 경도를 올바른 숫자로 입력해 주세요.");
      return;
    }

    setLat(String(origin.lat));
    setLng(String(origin.lng));
    onSelect(origin);
    setMessage(`${origin.label}로 기준 위치를 정했어요.`);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2">
        <label className="text-sm text-[var(--ink-muted)]" htmlFor="manual-query">
          주소 또는 장소
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            id="manual-query"
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 서울시청"
          />
          <button
            type="button"
            className="secondary-cta whitespace-nowrap px-4"
            onClick={searchAddress}
            disabled={searching}
          >
            {searching ? "검색 중" : "검색"}
          </button>
        </div>
      </div>

      {candidates.length > 0 ? (
        <ul className="space-y-2">
          {candidates.map((candidate) => (
            <li key={`${candidate.lat},${candidate.lng},${candidate.label}`}>
              <button
                type="button"
                className="w-full rounded-2xl border border-[var(--line)] bg-white/[0.05] px-4 py-3 text-left text-sm"
                onClick={() => applyCandidate(candidate)}
              >
                {candidate.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="space-y-3" onSubmit={submitCoordinates}>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-[var(--ink-muted)]" htmlFor="manual-lat">
            위도
            <input
              id="manual-lat"
              name="lat"
              className="field mt-1"
              inputMode="decimal"
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              placeholder="37.5665"
            />
          </label>
          <label className="text-sm text-[var(--ink-muted)]" htmlFor="manual-lng">
            경도
            <input
              id="manual-lng"
              name="lng"
              className="field mt-1"
              inputMode="decimal"
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              placeholder="126.978"
            />
          </label>
        </div>
        <button type="submit" className="secondary-cta w-full">
          이 위치로 설정
        </button>
      </form>

      {message ? <p className="text-sm text-[var(--spark)]">{message}</p> : null}
    </div>
  );
}
