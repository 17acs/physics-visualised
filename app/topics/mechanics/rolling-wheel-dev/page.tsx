"use client";

import React from "react";
import RollingWheelDiagram from "./RollingWheelDiagram";

export default function Page() {
  return (
    <main className="page">
      <a href="/topics/mechanics" className="backLink">← Back to Mechanics</a>

      <div className="card topicHeader">
        <h1 className="topicHeaderTitle">Rolling Wheel: why different points have different speeds</h1>
        <p className="heroText">
          A rigid wheel has one angular speed, but points on it can have different linear speeds.
          When the wheel rolls without slipping, the point touching the ground is instantaneously at rest,
          while the top point moves at twice the wheel’s centre speed.
        </p>
      </div>

      <div className="topicGrid">
        {/* LEFT: canvas */}
        <div className="card canvasCard">
          <RollingWheelDiagram />
        </div>

        {/* RIGHT: explanation + equations */}
        <div className="stickyCol stack12">
          <div className="card cardPad">
            <h2 className="sectionTitle">Key equations</h2>

            <div className="eq">speed due to rotation about the centre = angular speed × distance from centre</div>
            <div className="eq">wheel centre speed (no slipping) = angular speed × wheel radius</div>
            <div className="eq">ground velocity of a point = centre velocity + rotational velocity</div>

            <p className="para">
              On a rolling wheel (no slipping), the bottom point’s forward centre speed is exactly cancelled by its backward
              rotational speed, so it has zero ground speed at the contact point. The top point adds them, giving double.
            </p>
          </div>

          <div className="card cardPad">
            <h2 className="sectionTitle">What to look for</h2>
            <p className="para">
              Turn on the arrows one-by-one. You’ll see that the centre velocity is the same everywhere, while the rotational
              contribution points in different directions around the wheel. The resultant changes around the rim.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}