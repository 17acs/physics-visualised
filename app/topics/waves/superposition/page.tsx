import Superposition2D from "./Superposition2D";

export default function SuperpositionPage() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a
        href="/topics/waves"
        style={{ textDecoration: "none", display: "inline-block", marginBottom: 12 }}
      >
        ← Back to Waves
      </a>

      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Superposition</h1>
      <p style={{ opacity: 0.85, marginBottom: 14 }}>
        When two waves meet, the resultant displacement at a point is given by adding their
        displacements (remember displacement is vector). This is the <b>principle of superposition</b>.
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <Superposition2D />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>What the sliders mean</h2>

        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.92 }}>
          <li>
            <b>Wave 1</b>: amplitude of wave 1.
          </li>
          <li>
            <b>Wave 2</b>: amplitude of wave 2.
          </li>
          <li>
            <b>Phase (φ)</b>: the phase difference — controls the shift of wave 2 compared to wave 1. It is assumed you have a pretty decent understanding of phase difference already.
          </li>
        </ul>

        <div style={{ marginTop: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
            Phase difference and interference
          </h2>
          <div style={{ lineHeight: 1.7, opacity: 0.92 }}>
            <p style={{ marginTop: 0 }}>
              Phase difference controls whether the waves reinforce or cancel:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                <b>In phase:</b> constructive so maximum resultant.
              </li>
              <li>
                <b>In antiphase:</b> destructive so minimum resultant.
              </li>
              <li>Anything else: slight reinforcement/cancellation.</li>
            </ul>
            <p style={{ marginBottom: 0 }}>
              In A-level we describe phase difference using fractions of a cycle
              (p.55 of oxford aqa textbook). The slider just controls the phase difference between wave 1 and 2. I coded it to change the phase of wave 2 because I feel like it makes more sense to move wave 2 and keep wave 1 stationary, though either could move and it would give the same result.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
            How the model works
          </h2>

          <div style={{ lineHeight: 1.7, opacity: 0.92 }}>
            <p style={{ marginTop: 0 }}>
              Each point on a wave oscillates up and down consistently. I modelled this using a sine wave, which is in accordance with A-level teachings. Please note that this is not reality due to energy losses and distortions from external sources. The displacement depends on:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>where you are along the wave (position)</li>
              <li>the point in time</li>
            </ul>

            <p style={{ marginBottom: 0 }}>
              I chose not to include the proper wave equations because it is simply unnecessary - <b>not</b> due to lack of interest. If, like me, you are interested in the further reading, see the {" "}
              <a
                href="https://en.wikipedia.org/wiki/Wave_equation"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                wave equation wikipedia
              </a>
              . F=ma seems to be everywhere in physics.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 14, lineHeight: 1.7, opacity: 0.92 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Even further reading</h2>
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            Another thing I stumbled across was phasors, which seems to model waves using rotating vectors. I have not yet (03/02/26) explored it because my maths is lacking, but for the more developed reader, see {" "}
            <a
              href="https://en.wikipedia.org/wiki/Phasor"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
            >
              phasors
            </a>
            .
          </p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
