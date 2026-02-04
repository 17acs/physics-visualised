export default function ModernPage() {
  const cards = [
    {
      title: "Photoelectric effect",
      sub: "Certified Einstein classic.",
      href: "/topics/modern/photoelectric",
    },
  ];

  return (
    <main className="page">
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Modern Physics</h1>
        <div className="topicHeaderSub">
          Breaking classical physics.
        </div>
      </div>

      <div className="cardGrid">
        {cards.map((c) => (
          <a key={c.href} href={c.href} className="cardLink">
            <div className="card">
              <div className="cardTitle">{c.title}</div>
              <div className="cardSub">{c.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
