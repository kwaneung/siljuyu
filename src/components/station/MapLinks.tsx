import { buildMapDeepLinks } from "@/lib/maps/deepLinks";

export function MapLinks({
  name,
  lat,
  lng,
}: {
  name: string;
  lat?: number;
  lng?: number;
}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white/[0.05] p-4 text-sm text-[var(--ink-muted)]">
        좌표 정보가 없어 지도 길안내를 만들 수 없어요. 목록에서 다시 열어 주세요.
      </p>
    );
  }

  const links = buildMapDeepLinks({ name, lat: lat as number, lng: lng as number });

  return (
    <div className="grid gap-2">
      {links.map((link) => (
        <a
          key={link.provider}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="primary-cta"
        >
          {link.label} 길안내
        </a>
      ))}
    </div>
  );
}
