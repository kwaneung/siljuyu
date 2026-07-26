export default function Home() {
  return (
    <main className="app-shell flex items-center">
      <section className="glass rounded-[36px] p-7">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-[var(--brand)]">
          siljuyu
        </p>
        <h1 className="display-face text-5xl leading-[0.92]">
          진짜 싼 주유소를 총비용으로 줄 세웁니다
        </h1>
        <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
          위치, 연비, 주유량을 넣으면 이동 연료비까지 더한 순위가 곧 표시됩니다.
        </p>
      </section>
    </main>
  );
}
