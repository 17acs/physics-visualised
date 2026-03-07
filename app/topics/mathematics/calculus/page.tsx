import Link from "next/link";

export default function CalculusPage() {
  return (
    <main className="page">
      <Link href="/topics/mathematics" className="backLink">
        ← Back to Mathematics
      </Link>

      <section className="topicHeader card">
        <div className="topicHeaderTitle">Calculus</div>
        <p className="topicHeaderSub">
          Derivatives, integrals and how things change.
        </p>
      </section>

      <section className="card">
        <div className="cardGrid">
          <Link
            href="/topics/mathematics/calculus/derivatives"
            className="card cardLink"
          >
            <div className="cardTitle">Derivatives</div>
            <p className="cardSub">
              See how a secant line becomes a tangent.
            </p>
          </Link>

          <div className="card">
            <div className="cardTitle">Integrals</div>
            <p className="cardSub">Coming soon.</p>
          </div>

          <div className="card">
            <div className="cardTitle">Haven't decided yet</div>
            <p className="cardSub">Coming soon.</p>
          </div>
        </div>
      </section>
    </main>
  );
}