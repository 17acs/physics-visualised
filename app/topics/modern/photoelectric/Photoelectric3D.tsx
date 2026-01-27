"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type Params = {
  intensity: number; // 0..100
  fHz: number; // frequency in Hz
  emits: boolean;
  kmaxEv: number; // max KE (eV)
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function Scene({ intensity, fHz, emits, kmaxEv }: Params) {
  // Frequency -> wavelength (purely visual)
  const fMin = 0;
  const fMax = 1.2e15;
  const ft = clamp((fHz - fMin) / (fMax - fMin), 0, 1);
  const lambda = lerp(3.2, 0.7, ft);
  const k = (2 * Math.PI) / lambda;

  // Plate
  const slabY = -0.9;
  const slabW = 5.0;
  const slabT = 0.45;
  const slabD = 3.0;

  // Incidence / emission geometry (V-shape about the normal)
  const theta = THREE.MathUtils.degToRad(28);
  const inDir = new THREE.Vector3(Math.sin(theta), -Math.cos(theta), 0).normalize(); // toward surface
  const outDir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize(); // away from surface

  // Where the beam hits (center)
  const hitPoint = useMemo(
  () => new THREE.Vector3(0, slabY + slabT / 2 + 0.005, 0),
  [slabY, slabT]
);

  // Beam "cross-section" basis vectors (perpendicular to inDir)
  const beamPerpZ = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const beamPerpSide = useMemo(() => {
    // perpendicular to both inDir and Z, gives sideways spread in the plane of incidence
    const v = new THREE.Vector3().crossVectors(inDir, beamPerpZ).normalize();
    // if something weird happens, fallback
    if (v.lengthSq() < 1e-6) return new THREE.Vector3(1, 0, 0);
    return v;
  }, [inDir, beamPerpZ]);

  // Photon “beam” density driven by intensity
  const maxWaves = 60;
const waveCount = Math.round(lerp(12, maxWaves, intensity / 100));
  const waveAmp = lerp(0.05, 0.22, intensity / 100);

  // Wave geometry
  const N = 90;
  const s0 = -12;
const s1 = 0.35; // goes THROUGH the hit point slightly

  const waveGeoms = useMemo(() => {
    return Array.from({ length: maxWaves }, () => {
      const geom = new THREE.BufferGeometry();
      const arr = new Float32Array(N * 3);
      geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      return geom;
    });
  }, []);
const ribbonGeom = useMemo(() => {
  const geom = new THREE.BufferGeometry();
  const verts = new Float32Array(N * 2 * 3); // 2 verts per segment (a strip)
  geom.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  return geom;
}, [N]);

const ribbonMesh = useMemo(() => {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#a78bfa"),
    transparent: true,
    opacity: 0.10,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(ribbonGeom, mat);
}, [ribbonGeom]);

  // Give each “strand” its own fixed offset + phase (so it looks like a natural beam)
  function randn() {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const waveOffsets = useMemo(() => {
  return Array.from({ length: maxWaves }, () => ({
    side: randn() * 0.75, // clustered near centre
    z: randn() * 0.95,
    phase: Math.random() * Math.PI * 2,
  }));
}, []);


  const waveLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#a78bfa"),
      transparent: true,
      opacity: 0.24,
    });
    return waveGeoms.map((g) => new THREE.Line(g, mat));
  }, [waveGeoms]);

  // Electrons as instanced spheres
  const maxE = 260;
  const instRef = useRef<THREE.InstancedMesh>(null);
  const electrons = useRef<{ p: THREE.Vector3; v: THREE.Vector3; age: number; alive: boolean }[]>([]);
  const spawnAcc = useRef(0);

  useMemo(() => {
    electrons.current = Array.from({ length: maxE }, () => ({
      p: new THREE.Vector3(0, 0, 0),
      v: new THREE.Vector3(0, 0, 0),
      age: 0,
      alive: false,
    }));
  }, []);

  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpS = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

// --- Update ribbon sheet (a thin surface wave) ---
{
  const pos = ribbonGeom.getAttribute("position") as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;

  const v = 2.2;
  const halfWidth = 0.55; // ribbon width
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const s = lerp(s0, s1, u);

    const base = hitPoint.clone().addScaledVector(inDir, s);

    const phase = k * (s + v * t);
    const wiggle = waveAmp * 0.9 * Math.sin(phase);

    // two edge points of the ribbon
    const left = base
      .clone()
      .addScaledVector(beamPerpSide, -halfWidth)
      .addScaledVector(beamPerpZ, wiggle);

    const right = base
      .clone()
      .addScaledVector(beamPerpSide, +halfWidth)
      .addScaledVector(beamPerpZ, wiggle);

    const idx = i * 2 * 3;
    arr[idx + 0] = left.x;
    arr[idx + 1] = left.y;
    arr[idx + 2] = left.z;

    arr[idx + 3] = right.x;
    arr[idx + 4] = right.y;
    arr[idx + 5] = right.z;
  }

  // build strip indices once (cheap)
  if (!ribbonGeom.index) {
    const indices: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    ribbonGeom.setIndex(indices);
  }

  pos.needsUpdate = true;
  ribbonGeom.computeVertexNormals();
}


    // --- Update wave lines (many strands, jittered = natural beam) ---
    for (let wi = 0; wi < waveGeoms.length; wi++) {
        
      const geom = waveGeoms[wi];
      const pos = geom.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      const active = wi < waveCount;
      waveLines[wi].visible = active;
      if (!active) continue;
      const off = waveOffsets[wi];

      // mild drift so the beam looks alive
      const driftSide = 0.10 * Math.sin(t * 0.6 + off.phase);
      const driftZ = 0.12 * Math.cos(t * 0.55 + off.phase);

      // wave motion speed
      const v = 2.2;

      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const s = lerp(s0, s1, u);

        // base point along the beam
        const p = hitPoint.clone().addScaledVector(inDir, s);

        // spread beam cross-section
        if (active) {
          p.addScaledVector(beamPerpSide, off.side * 0.35 + driftSide);
          p.addScaledVector(beamPerpZ, off.z * 0.35 + driftZ);

          // oscillation (mostly in Z to read like “waves”)
          const phase = k * (s + v * t) + off.phase;
          p.addScaledVector(beamPerpZ, waveAmp * Math.sin(phase));
        }

        const idx = i * 3;
        arr[idx + 0] = p.x;
        arr[idx + 1] = p.y;
        arr[idx + 2] = p.z;
      }

      pos.needsUpdate = true;
      geom.computeBoundingSphere();
    }

    // --- Spawn electrons (FROM THE INCIDENT SPOT / beam footprint) ---
    const baseRate = 6.0; // more active by default
    const rate = emits ? baseRate * (intensity / 100) : 0;
    spawnAcc.current += rate * dt;

    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;

      const pool = electrons.current;
      const idx = pool.findIndex((e) => !e.alive);
      if (idx === -1) break;

      // sample a point in the beam footprint around the hitPoint
      const rSide = THREE.MathUtils.randFloatSpread(0.55);
      const rZ = THREE.MathUtils.randFloatSpread(0.65);

      const spawn = hitPoint
        .clone()
        .addScaledVector(beamPerpSide, rSide)
        .addScaledVector(beamPerpZ, rZ);

      // lift slightly off the surface
      spawn.y = slabY + slabT / 2 + 0.08;

      // speed depends on Kmax
      const speed = clamp(0.9 + kmaxEv * 0.35, 0.8, 4.8);

      // symmetric emission direction, small spread
      const dir = outDir
        .clone()
        .add(
          new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(0.10),
            THREE.MathUtils.randFloatSpread(0.08),
            THREE.MathUtils.randFloatSpread(0.14)
          )
        )
        .normalize();

      pool[idx].p.copy(spawn);
      pool[idx].v.copy(dir).multiplyScalar(speed);
      pool[idx].age = 0;
      pool[idx].alive = true;
    }

    // --- Update electrons positions & write matrices ---
    const mesh = instRef.current;
    if (!mesh) return;

    let aliveCount = 0;
    for (let i = 0; i < electrons.current.length; i++) {
      const e = electrons.current[i];
      if (!e.alive) continue;

      e.age += dt;

      // tiny drift
      e.v.y -= 0.15 * dt;
      e.p.addScaledVector(e.v, dt);

      if (e.age > 5.0 || e.p.x > 12 || Math.abs(e.p.y) > 6 || Math.abs(e.p.z) > 6) {
        e.alive = false;
        continue;
      }

      const s = 0.045 + 0.012 * Math.sin(10 * (t + i));
      tmpS.setScalar(s);
      tmpM.compose(e.p, tmpQ, tmpS);

      mesh.setMatrixAt(aliveCount, tmpM);
      aliveCount++;
    }

    mesh.count = aliveCount;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 8, 6]} intensity={1.1} />

      {/* plate (calmer dark metal) */}
      <mesh position={[0, slabY, 0]}>
        <boxGeometry args={[slabW, slabT, slabD]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.65} metalness={0.35} />
      </mesh>

      {/* subtle glow on top surface */}
      <mesh position={[0, slabY + slabT / 2 + 0.01, 0]}>
        <boxGeometry args={[slabW * 0.98, 0.02, slabD * 0.98]} />
        <meshStandardMaterial color="#111827" emissive="#38bdf8" emissiveIntensity={0.14} />
      </mesh>

<primitive object={ribbonMesh} />


      {/* photon beam */}
      {waveLines.map((ln, i) => (
        <primitive key={i} object={ln} />
      ))}

      {/* electrons (RED) */}
      <instancedMesh ref={instRef} args={[undefined as any, undefined as any, maxE]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={emits ? "#c1121f" : "#334155"}
          emissive={emits ? "#c1121f" : "#000000"}
          emissiveIntensity={emits ? 0.9 : 0.0}
        />
      </instancedMesh>

      <OrbitControls enablePan={false} minDistance={6} maxDistance={60} />
    </>
  );
}

export default function Photoelectric3D(props: Params) {
 return (
  <div className="card" style={{ height: 620, overflow: "hidden" }}>
    <Canvas camera={{ position: [6.5, 4.8, 7.5], fov: 45, near: 0.1, far: 200 }}>
      <Scene {...props} />
    </Canvas>
  </div>
);

}
