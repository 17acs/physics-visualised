export default function AboutPage() {
  return (
    <main className="page prose">
      <a href="/" className="backLink">
        ← Back to Home
      </a>

      <div className="card stack">
        <h1 className="h1">About</h1>

        <p>
          I first started coding on Roblox, selling scripts. Lua was a lot easier than JavaScript, so I’m
          building this to sharpen my JS while making diagrams for tricky physics concepts.
        </p>

        <p>
          The foundation of the site has been built by me (it’s basic for now — I’ll polish it).
          Some complex parts (e.g. 3D visuals and a few nuclear equations) were assisted via AI and code-sharing
          sources like GitHub.
        </p>

        <p>
          Inquiries:{" "}
          <a href="mailto:ws.king@outlook.com">
            ws.king@outlook.com
          </a>
        </p>
      </div>
    </main>
  );
}
