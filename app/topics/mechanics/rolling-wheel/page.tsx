import Link from "next/link";

export default function Page() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <Link href="/topics/mechanics" className="backLink">
        ← Back to Mechanics
      </Link>

      <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 12 }}>
        <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>Rolling Wheel</h1>
        <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.65, maxWidth: 900 }}>
          Coming soon.
        </p>
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 18, marginTop: 14, opacity: 0.9 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>What I'm making:</div>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.9 }}>
          <li>Frictionless rolling wheel</li>
          <li>Velocity vectors around the rim (hence why I need to do some work on angular velocity)</li>
          <li>Shows why points on a wheel are different speed</li>
        </ul>
      </div>
    </main>
  );
}