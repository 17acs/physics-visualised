export default function WavesTopicPage() {
  const cards = [
    {
      title: "Superposition",
      sub: "Phase difference, interference, and resultant amplitude.",
      href: "/topics/waves/superposition",
    },
  ];

  return (
    <main className="page">
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Waves</h1>
        <div className="topicHeaderSub">
          Visual models for wave behaviour and how multiple waves combine.
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
