const topics = [
  { slug: "mechanics", title: "Mechanics", desc: "Forces, motion, energy, momentum" },
  { slug: "waves", title: "Waves", desc: "Superposition, standing waves, diffraction" },
  { slug: "electricity", title: "Electricity", desc: "Circuits, fields, potential, capacitance" },
  { slug: "fields", title: "Fields", desc: "Gravitational, electric, magnetic" },
  { slug: "modern", title: "Modern Physics", desc: "Photoelectric effect, photons, quantum ideas" },
];


export default function TopicsPage() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui" }}>
      <a href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
  ← Back to Home
</a>

      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Topics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {topics.map((t) => (
          <a
            key={t.slug}
            href={`/topics/${t.slug}`}
            style={{ border: "1px solid #ddd", borderRadius: 14, padding: 16, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{t.title}</div>
            <div style={{ opacity: 0.8 }}>{t.desc}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
