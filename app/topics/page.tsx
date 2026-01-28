const topics = [
  { slug: "mechanics", title: "Mechanics", desc: "" },
  { slug: "waves", title: "Waves", desc: "" },
  { slug: "electricity", title: "Electricity", desc: "T" },
  { slug: "fields", title: "Fields", desc: "" },
  { slug: "modern", title: "Modern Physics", desc: "" },
  { slug: "nuclear", title: "Nuclear", desc: ""}
];


export default function TopicsPage() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
  ← Back to Home
</a>

      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Topics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {topics.map((t) => (
          <a
            key={t.slug}
            href={`/topics/${t.slug}`}
            className="card"
            style={{ padding: 16, textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{t.title}</div>
            <div style={{ opacity: 0.8 }}>{t.desc}</div>
            <div style={{ marginTop: 10, color: "var(--accent)" }}>Open →</div>
</a>

        ))}
      </div>
    </main>
  );
}
