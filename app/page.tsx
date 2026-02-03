export default function Home() {
  const updates = [
  {
    date: "3 Feb",
    items: [
      "Phase difference and superposition model added",
      "I am aware the topic homepages do not follow the same format and am working on a css fix",
    ],
  },
  {
    date: "27 Jan",
    items: [
      "Improved compatibility for different screen sizes (mobile + laptops)",
      "Inverse Square Law research project added",
    ],
  },
];

  return (
    <main
      style={{
        padding: 32,
        fontFamily: "system-ui",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* soft background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -200,
          background:
            "radial-gradient(600px 300px at 20% 10%, rgba(80,140,255,0.18), transparent 60%)," +
            "radial-gradient(700px 350px at 80% 15%, rgba(255,80,180,0.14), transparent 60%)," +
            "radial-gradient(800px 420px at 50% 90%, rgba(0,255,180,0.10), transparent 65%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        {/* HERO */}
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.04)",
              opacity: 0.95,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: "var(--accent)",
                boxShadow: "0 0 18px rgba(255,255,255,0.25)",
              }}
            />
            <span>WIP • interactive physics models</span>
          </div>

          <h1
            style={{
              fontSize: 46,
              margin: "14px 0 8px",
              letterSpacing: -0.8,
              lineHeight: 1.05,
            }}
          >
            physics visualised
          </h1>

          <p style={{ fontSize: 16, opacity: 0.85, margin: 0 }}>by will king</p>

          <p
            style={{
              fontSize: 18,
              maxWidth: 820,
              marginTop: 14,
              lineHeight: 1.65,
              opacity: 0.9,
            }}
          >
            WIP. Some aspects of the 3D modelling used AI to code. The rest of the website is
            self-taught via youtube and google. See{" "}
            <a href="/about" style={{ color: "var(--accent)", textDecoration: "underline" }}>
              about
            </a>{" "}
            for more.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
  <a
    href="/about"
    style={{
      padding: "12px 16px",
      borderRadius: 12,
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.12)",
      textDecoration: "none",
      color: "inherit",
      fontWeight: 800,
    }}
  >
    About →
  </a>

  <a
    href="/topics"
    style={{
      padding: "12px 16px",
      borderRadius: 12,
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.12)",
      textDecoration: "none",
      color: "inherit",
      fontWeight: 800,
    }}
  >
    Browse topics →
  </a>
</div>

        </header>

        {/* CONTENT GRID */}
        <section
          style={{
            marginTop: 26,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* Updates */}
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Updates</h2>

            {updates.map((u) => (
              <div key={u.date} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent)" }}>●</span> {u.date}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.88, lineHeight: 1.7 }}>
                  {u.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Featured */}
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Featured</h2>

            <a
              href="/topics/waves/superposition"
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
                Superposition
              </div>
              <div style={{ opacity: 0.85, lineHeight: 1.6 }}>
                Wave interference.
              </div>
              <div style={{ marginTop: 10, color: "var(--accent)", fontWeight: 800 }}>Open →</div>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
