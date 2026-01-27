export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>physics visualised</h1>
     <p style={{ fontSize: 18, maxWidth: 700, textIndent: 20 }}>
  by will king
</p>

<p style={{ fontSize: 18, maxWidth: 700, paddingLeft: 20, marginTop: 0 }}>
  WIP. Some aspects of the 3D modelling has used AI to code. The rest of the website   is self taught via youtube and google. See <a href="/about"><span style={{ textDecoration: "underline" }}>about</span></a> for more.
</p>

<section style={{ marginTop:28}}>
  <div className="card" style={{ padding:16}}>
    <h2 style={{ marginTop:0, marginBottom: 10}}>Updates</h2>

    <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.85, lineHeight: 1.7 }}>
      <li><b>27 Jan:</b></li>
      <li>Should be more compatable for devices with different screens e.g. mobile and laptops</li>
      <li>Inverse Square Law research project added</li>
      <li>Work has began on Phase Difference modelling</li>
    </ul>
  </div>
</section>
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <a
          href="/topics"
          style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10 }}
        >
          Browse topics
        </a>
        <a
          href="/about"
          style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10 }}
        >
          About
        </a>
      </div>
    </main>
  );
}
