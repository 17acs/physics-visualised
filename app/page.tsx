export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>physics visualised</h1>
     <p style={{ fontSize: 18, maxWidth: 700, textIndent: 20 }}>
  personal portfolio by will king
</p>

<p style={{ fontSize: 18, maxWidth: 700, textIndent: 20, marginTop: 0 }}>
  science isn't as boring as you think
</p>


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
