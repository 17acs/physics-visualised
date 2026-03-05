export default function MechanicsPage() {
  const cards = [
  {
    title: "Projectile motion",
    sub: "This should help with your three-pointers",
    href: "/topics/mechanics/projectile",
  },
  {
    title: "Rolling wheel",
    sub: "Why different points on a wheel have different ground speeds",
    href: "/topics/mechanics/rolling-wheel",
  },
];

  return (
    <main className="page">
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Mechanics</h1>
        <div className="topicHeaderSub">
          Models of motion.
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
