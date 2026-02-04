"use client";

import React from "react";
import "./rutherford.css";
import RutherfordDiagram from "./RutherfordDiagram";

export default function Page() {
  return (
    <main className="page ruthWrap" style={{ maxWidth: 1500 }}>
      <a href="/topics/nuclear" className="backLink">
        ← Back to Nuclear
      </a>

      <div className="ruthHero">
        <div className="ruthHeroInner">
          <h1 className="ruthTitle">Rutherford α-Scattering</h1>
          <div className="ruthSub">
            This is the experiment that basically forced the nuclear model. Most α particles go straight through the foil.
            Some deflect slightly. A tiny fraction deflect massively (even backwards). That only makes sense if the atom is
            mostly empty space with a very small, very concentrated positive nucleus.
          </div>

          <div className="ruthChipRow">
            <div className="ruthChip"><span className="ruthDot" />most go straight</div>
            <div className="ruthChip"><span className="ruthDot" style={{ background: "var(--ruth-violet)" }} />some large angles</div>
            <div className="ruthChip"><span className="ruthDot" style={{ background: "var(--ruth-cyan)" }} />rare backscatter</div>
          </div>
        </div>
      </div>

      <div className="topicGrid" style={{ ["--aside" as any]: "680px", marginTop: 16 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 12 }}>
          <div className="ruthCard">
            <div className="ruthSectionTitle">What you’re actually counting</div>
            <p className="ruthP">
              The detector is basically a screen where you see flashes when α particles hit. So the data isn’t “force” or
              “field strength” — it’s just how often particles show up at certain angles.
            </p>
            <p className="ruthP">
              The headline result: large-angle scattering exists but is rare. That’s the bit that destroys any model where
              positive charge is spread out.
            </p>
          </div>

          <div className="ruthCard">
            <div className="ruthSectionTitle">The rough model for nuclear size</div>
            <p className="ruthP">
              A big deflection happens only if the α passes close enough to or collides with the nucleus.
            </p>
            <p className="ruthP">
              If <b>D</b> is the atom diameter and <b>d</b> is the nucleus diameter, then for one layer of atoms the chance
              of a close pass is shown by the ratio of the cross-sectional areas of the nucleus to the atom:
            </p>

            <div className="ruthEq">P(1 layer) ≈ π(d/2)² / π(D/2)² = d² / D²</div>

            <p className="ruthP">
              If the foil has <b>n</b> layers, the α gets <b>n</b> chances. So we multiply the probability of it passing an atom per layer by the amount of layers.
            </p>

            <div className="ruthEq">P(total) ≈ n · (d² / D²)</div>

            <div className="ruthCallout">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Where the 10000 comes from</div>
              <div className="ruthP" style={{ marginBottom: 0 }}>
                Experimentally, only about <b>1 in 10,000</b> α particles show a huge deflection. So:
              </div>
              <div className="ruthEq" style={{ marginBottom: 0 }}>P(total) ≈ 1/10000</div>
            </div>

            <p className="ruthP" style={{ marginTop: 10 }}>
              So:
            </p>

            <div className="ruthEq">n · (d² / D²) = 1/10000</div>

            <p className="ruthP">Rearrange:</p>

            <div className="ruthEq">d² = D² / (10000 n)</div>

            <div className="ruthSmall">
              This is a rough estimation.
            </div>
          </div>

          <div className="ruthCard">
            <div className="ruthSectionTitle">Why this works conceptually</div>
            <p className="ruthP">
              Since the nucleus is so small, the large deflections are rare as collisions with the nucleus are rare (remember every atom passes through at least one atom). The derived equation supports the idea that <b>d is less than D</b>. I intend on adding the distance of closest approach equation to this page soon enough.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="stickyCol">
          <RutherfordDiagram />
        </div>
      </div>
    </main>
  );
}
