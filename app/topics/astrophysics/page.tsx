export default function AstrophysicsTopicPage() {
  const cards = [
    {
      title: "Escape Velocity",
      sub: "Minimum speed to leave and never return",
      href: "/topics/astrophysics/escape-velocity",
    },
  ];

  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="astroHeader" style={{ marginTop: 10 }}>
        <h1 className="topicHeaderTitle" style={{ margin: 0 }}>
          Astrophysics
        </h1>
        <div className="topicHeaderSub" style={{ marginTop: 10, maxWidth: 820 }}>
          Gravity, orbits, tides, black holes. Lit.
        </div>
      </div>

      <div className="cardGrid" style={{ marginTop: 14 }}>
        {cards.map((c) => (
          <a key={c.href} href={c.href} className="cardLink">
            <div className="card" style={{ padding: 16 }}>
              <div className="cardTitle">{c.title}</div>
              <div className="cardSub">{c.sub}</div>
              <div style={{ marginTop: 10, color: "var(--accent)", fontWeight: 800 }}>
                Open →
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
