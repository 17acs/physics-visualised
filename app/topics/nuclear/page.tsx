export default function NuclearTopicPage() {
  const cards = [
    {
      title: "Inverse Square Law (γ)",
      sub: "Research project",
      href: "/topics/nuclear/inverse-square",
    },
    {
      title: "Rutherford Alpha-Scattering",
      sub: "Derivation and the experiment",
      href: "/topics/nuclear/rutherford",
    },
  ];

  return (
    <main className="page">
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Nuclear Physics</h1>
        <div className="topicHeaderSub">
          In case you enjoyed Oppenheimer and wanted to model your personality around it.
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
