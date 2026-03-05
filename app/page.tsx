export default function Home() {
  const updates = [
    {
      date: "5th March",
      items: [
        "Mathematics page began",
        "I am currently self-teaching angular velocity in order to model it",
        "Astrophysics page delayed due to priorities elsewhere and self-teaching the physics behind it",
      ],
    },
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
      className="page homeNoScroll"
      style={{
        boxSizing: "border-box",
        minHeight: "100dvh",
        paddingBottom: 0,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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

          <h1 style={{ fontSize: 46, margin: "14px 0 8px", letterSpacing: -0.8, lineHeight: 1.05 }}>
            Visualise Science
          </h1>

          <p className="muted" style={{ fontSize: 16, margin: 0 }}>
            by will king
          </p>

          <p style={{ fontSize: 18, maxWidth: 820, marginTop: 14, lineHeight: 1.65, opacity: 0.9 }}>
            WIP. Some aspects of the 3D modelling used AI to code. The rest of the website is self-taught via youtube and
            google. See{" "}
            <a href="/about" style={{ textDecoration: "underline" }}>
              about
            </a>{" "}
            for more.
          </p>

          {/* Buttons now match the “Featured” box style */}
          <div className="homeActions">
            <a href="/about" className="miniCardLink">
              About →
            </a>
            <a href="/topics" className="miniCardLink">
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

            <a href="/topics/waves/superposition" className="miniCardLink miniCardLinkBlock">
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Superposition</div>
              <div style={{ opacity: 0.85, lineHeight: 1.6 }}>Wave interference.</div>
              <div style={{ marginTop: 10, color: "var(--accent)", fontWeight: 800 }}>Open →</div>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}