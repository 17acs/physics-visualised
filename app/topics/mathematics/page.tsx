export default function MathematicsTopic() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a href="/topics" className="backLink">
        ← Back to Topics
      </a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Mathematics</h1>
        <div className="topicHeaderSub">
          What did the drowning number theorist say? Log log log log
        </div>
      </div>

      <div className="cardGrid">
        <a href="/topics/mathematics/small-angle" className="cardLink">
          <div className="card">
            <div className="cardTitle">Small-angle approximations</div>
            <div className="cardSub">
              Compare sinθ, cosθ, tanθ with their approximations (θ in radians).
            </div>
          </div>
        </a>

        <a href="/topics/mathematics/calculus" className="cardLink">
  <div className="card">
    <div className="cardTitle">Calculus</div>
    <div className="cardSub">
      Continuous change.
    </div>
  </div>
</a>

      </div>
    </main>
  );
}