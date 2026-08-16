"use client";

import { useState, type FormEvent } from "react";
import { parseManualOrigin } from "@/lib/geo/origin";
import type { GeocodeCandidate } from "@/lib/geo/geocode";
import type { Origin } from "@/lib/prefs/storage";

export function ManualLocation({
  onSelect,
}: {
  onSelect: (origin: Origin) => void;
  selected?: Origin;
}) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<GeocodeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const trimmed = String(data.get("q") ?? "").trim();
    if (!trimmed) {
      setMessage("검색할 주소나 장소 이름을 입력해 주세요.");
      return;
    }

    setQuery(trimmed);
    setSearching(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const payload = await response.json();
      if (response.status === 503) {
        setCandidates([]);
        setMessage("주소 검색은 아직 준비되지 않았어요. 현재 위치를 허용해 주세요.");
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "주소를 찾지 못했어요.");
      }

      const next = (payload.candidates ?? []) as GeocodeCandidate[];
      setCandidates(next);
      setMessage(next.length ? null : "검색 결과가 없어요. 다른 주소나 장소로 다시 검색해 주세요.");
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
    const origin = parseManualOrigin({
      lat: candidate.lat,
      lng: candidate.lng,
      label: candidate.label,
    });
    if (!origin) {
      setMessage("이 장소의 좌표를 쓰지 못했어요. 다른 결과를 골라 주세요.");
      return;
    }

    setQuery(origin.label ?? candidate.label);
    onSelect(origin);
    setMessage(`${origin.label}로 기준 위치를 정했어요.`);
  }

  return (
    <div className="mt-4 space-y-3">
      <form className="grid gap-2" onSubmit={searchAddress}>
        <label className="text-sm text-[var(--ink-muted)]" htmlFor="manual-query">
          주소 또는 장소
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            id="manual-query"
            name="q"
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 서울시청"
          />
          <button
            type="submit"
            className="secondary-cta whitespace-nowrap px-4"
            disabled={searching}
          >
            {searching ? "검색 중" : "검색"}
          </button>
        </div>
      </form>

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

      {message ? <p className="text-sm text-[var(--spark)]">{message}</p> : null}
    </div>
  );
}
