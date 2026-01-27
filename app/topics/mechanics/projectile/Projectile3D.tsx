"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Trail} from "@react-three/drei";

type Pt = { x: number; y: number };

function Scene({
  points,
  ball,
  range,
  maxHeight,
  vx,
  vy,
}: {
  points: Pt[];
  ball: Pt;
  range: number;
  maxHeight: number;
  vx: number;
  vy: number;
}) {
  const controlsRef = useRef<any>(null);

  const arrow = useMemo(() => {
    const dir = new THREE.Vector3(1, 0, 0);
    const origin = new THREE.Vector3(0, 0, 0);
    const color = 0x7dd3fc; // soft cyan
    return new THREE.ArrowHelper(dir, origin, 5, color, 1.1, 0.7);
  }, []);


  const traj = useMemo(() => points.map((p) => new THREE.Vector3(p.x, p.y, 0)), [points]);
  const ballPos = useMemo(() => new THREE.Vector3(ball.x, ball.y, 0), [ball.x, ball.y]);

  // Make orbit target follow the ball (so you rotate around it)
   useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(ballPos, 0.25);
      controlsRef.current.update();
    }

    // velocity arrow
    const v = new THREE.Vector3(vx, vy, 0);
    const speed = v.length();

    if (speed > 1e-6) {
      v.normalize();
      arrow.position.copy(ballPos);
      arrow.setDirection(v);

      // scale arrow length so it looks good at different speeds
      const L = Math.min(14, Math.max(3, speed * 0.25));
      arrow.setLength(L, 1.2, 0.8);
      arrow.visible = true;
    } else {
      arrow.visible = false;
    }
  });


  const safeRange = Math.max(range, 10);
  const safeHeight = Math.max(maxHeight, 10);
  const groundSize = Math.max(safeRange * 2.0, 180);
  const groundDivs = Math.min(160, Math.max(60, Math.round(groundSize / 3)));
  const groundX = safeRange / 2;


  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[safeRange, safeHeight, safeRange]} intensity={1.0} />

    <primitive object={arrow} />


      {/* Ground / grid (centered under the trajectory) */}
<gridHelper
  args={[groundSize, groundDivs, "#1e3a8a", "#0b1220"]}
  position={[groundX, 0, 0]}
/>

<mesh rotation={[-Math.PI / 2, 0, 0]} position={[groundX, -0.01, 0]}>
  <planeGeometry args={[groundSize, groundSize]} />
  <meshStandardMaterial color="#05060a" roughness={1} metalness={0} />
</mesh>


      {/* Trajectory line */}
      <Line points={traj} lineWidth={2} color="#cbd5e1" transparent opacity={0.55} />

      {/* Ball (deep crimson, bright) */}
      <Trail width={1.2} length={10} color={"#9b1c31"} attenuation={(t) => t * t}>
  <mesh position={ballPos}>
    <sphereGeometry args={[0.55, 32, 32]} />
    <meshStandardMaterial
      color="#9b1c31"
      emissive="#9b1c31"
      emissiveIntensity={1.1}
    />
  </mesh>
</Trail>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxPolarAngle={Math.PI * 0.49}
        minDistance={6}
        maxDistance={600}
      />
    </>
  );
}

export default function Projectile3D(props: {
  points: Pt[];
  ball: Pt;
  range: number;
  maxHeight: number;
  vx: number;
  vy: number;
}) {
  const safeRange = Math.max(props.range, 10);
  const safeHeight = Math.max(props.maxHeight, 10);

  // camera scales with the shot size
  const camPos: [number, number, number] = [
    safeRange * 0.6,
    safeHeight * 0.6,
    Math.max(safeRange, safeHeight) * 0.9,
  ];

  return (
  <div
    className="card"
    style={{
      height: "clamp(320px, 70vh, 820px)",
      overflow: "hidden",
    }}
  >
    <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: camPos, fov: 45 }}>
      <Scene {...props} />
    </Canvas>
  </div>
);

}
