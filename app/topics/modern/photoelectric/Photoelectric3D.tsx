"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type Params = {
  intensity: number; // 0..100
  fHz: number; // Hz
  emits: boolean;
  kmaxEv: number; // eV
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function Scene({ intensity, fHz, emits, kmaxEv }: Params) {
  // map frequency -> visual wavelength (higher f = tighter wave)
  const fMin = 0;
  const fMax = 1.2e15;
  const ft = clamp((fHz - fMin) / (fMax - fMin), 0, 1);
  const lambda = lerp(3.2, 0.75, ft);
  const k = (2 * Math.PI) / lambda;

  // plate
  const slabY = -0.9;
  const slabW = 5.2;
  const slabT = 0.5;
  const slabD = 3.2;

  // incidence & emission
  const theta = THREE.MathUtils.degToRad(28);
  const inDir = new THREE.Vector3(Math.sin(theta), -Math.cos(theta), 0).normalize();
  const outDir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();

  const hitPoint = useMemo(() => new THREE.Vector3(0, slabY + slabT / 2 + 0.008, 0), [slabY, slabT]);

  // basis for ribbon
  const beamPerpZ = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const beamPerpSide = useMemo(() => {
    const v = new THREE.Vector3().crossVectors(inDir, beamPerpZ).normalize();
    return v.lengthSq() < 1e-6 ? new THREE.Vector3(1, 0, 0) : v;
  }, [inDir, beamPerpZ]);

  // intensity -> ribbon amplitude & opacity
  const amp = lerp(0.05, 0.22, intensity / 100);
  const ribbonOpacity = lerp(0.10, 0.24, intensity / 100);

  // ribbon geometry along beam
  const N = 140;
  const s0 = -12;
  const s1 = 0.38;

  const ribbonGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const verts = new Float32Array(N * 2 * 3);
    geom.setAttribute("position", new THREE.BufferAttribute(verts, 3));

    const indices: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    geom.setIndex(indices);
    return geom;
  }, []);

  const ribbonMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#7dd3fc"),
        transparent: true,
        opacity: ribbonOpacity,
        roughness: 0.85,
        metalness: 0.0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
        side: THREE.DoubleSide,
        emissive: new THREE.Color("#7dd3fc"),
        emissiveIntensity: 0.12,
      }),
    [] // updated in frame
  );

  const ribbonMesh = useMemo(() => new THREE.Mesh(ribbonGeom, ribbonMat), [ribbonGeom, ribbonMat]);

  // soft glow tube (always clean)
  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 30 }, (_, i) => {
        const u = i / 29;
        const s = lerp(s0, s1, u);
        return hitPoint.clone().addScaledVector(inDir, s);
      })
    );
    const geom = new THREE.TubeGeometry(curve, 160, 0.22, 10, false);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#a78bfa"),
      transparent: true,
      opacity: 0.06,
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color("#a78bfa"),
      emissiveIntensity: 0.16,
      depthWrite: false,
    });
    return new THREE.Mesh(geom, mat);
  }, [hitPoint, inDir]);

  // electrons instancing
  const maxE = 260;
  const instRef = useRef<THREE.InstancedMesh>(null);
  const electrons = useRef<{ p: THREE.Vector3; v: THREE.Vector3; age: number; alive: boolean }[]>([]);
  const spawnAcc = useRef(0);

  useMemo(() => {
    electrons.current = Array.from({ length: maxE }, () => ({
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
      age: 0,
      alive: false,
    }));
  }, []);

  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpS = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  const left = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // ribbon update
    {
      const pos = ribbonGeom.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      const v = 2.25;
      const halfWidth = 0.55;

      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const s = lerp(s0, s1, u);

        base.copy(hitPoint).addScaledVector(inDir, s);

        const phase = k * (s + v * t);
        const wiggle = amp * Math.sin(phase);

        left.copy(base).addScaledVector(beamPerpSide, -halfWidth).addScaledVector(beamPerpZ, wiggle);
        right.copy(base).addScaledVector(beamPerpSide, +halfWidth).addScaledVector(beamPerpZ, wiggle);

        const idx = i * 2 * 3;
        arr[idx + 0] = left.x;
        arr[idx + 1] = left.y;
        arr[idx + 2] = left.z;
        arr[idx + 3] = right.x;
        arr[idx + 4] = right.y;
        arr[idx + 5] = right.z;
      }

      pos.needsUpdate = true;
      ribbonGeom.computeVertexNormals();

      // intensity-driven opacity (live)
      ribbonMat.opacity = lerp(0.08, 0.24, intensity / 100);
      (tube.material as THREE.MeshStandardMaterial).opacity = lerp(0.03, 0.08, intensity / 100);
    }

    // spawn electrons (only if emits)
    const baseRate = 6.0;
    const rate = emits ? baseRate * (intensity / 100) : 0;
    spawnAcc.current += rate * dt;

    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;

      const idx = electrons.current.findIndex((e) => !e.alive);
      if (idx === -1) break;

      // spawn around hitpoint footprint
      const rSide = THREE.MathUtils.randFloatSpread(0.45);
      const rZ = THREE.MathUtils.randFloatSpread(0.50);

      const spawn = base
        .copy(hitPoint)
        .addScaledVector(beamPerpSide, rSide)
        .addScaledVector(beamPerpZ, rZ);

      spawn.y = slabY + slabT / 2 + 0.10;

      // speed depends on kmax
      const speed = clamp(0.9 + kmaxEv * 0.35, 0.8, 4.8);

      // emission dir with small spread
      const dir = outDir
        .clone()
        .add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.08), THREE.MathUtils.randFloatSpread(0.06), THREE.MathUtils.randFloatSpread(0.10)))
        .normalize();

      electrons.current[idx].p.copy(spawn);
      electrons.current[idx].v.copy(dir).multiplyScalar(speed);
      electrons.current[idx].age = 0;
      electrons.current[idx].alive = true;
    }

    // update electrons
    const mesh = instRef.current;
    if (!mesh) return;

    let aliveCount = 0;
    for (let i = 0; i < electrons.current.length; i++) {
      const e = electrons.current[i];
      if (!e.alive) continue;

      e.age += dt;

      e.v.y -= 0.10 * dt;
      e.p.addScaledVector(e.v, dt);

      if (e.age > 4.2 || e.p.x > 12 || Math.abs(e.p.y) > 6 || Math.abs(e.p.z) > 6) {
        e.alive = false;
        continue;
      }

      tmpS.setScalar(0.030);
      tmpM.compose(e.p, tmpQ, tmpS);
      mesh.setMatrixAt(aliveCount, tmpM);
      aliveCount++;
    }

    mesh.count = aliveCount;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <fog attach="fog" args={["#05060a", 14, 52]} />

      <ambientLight intensity={0.45} />
      <hemisphereLight intensity={0.55} groundColor={"#05060a"} />
      <directionalLight position={[10, 10, 8]} intensity={1.25} />
      <directionalLight position={[-8, 5, -6]} intensity={0.55} />

      {/* plate */}
      <mesh position={[0, slabY, 0]}>
        <boxGeometry args={[slabW, slabT, slabD]} />
        <meshPhysicalMaterial color="#0a0f1a" roughness={0.55} metalness={0.55} clearcoat={0.35} clearcoatRoughness={0.25} />
      </mesh>

      {/* top edge sheen */}
      <mesh position={[0, slabY + slabT / 2 + 0.01, 0]}>
        <boxGeometry args={[slabW * 0.98, 0.02, slabD * 0.98]} />
        <meshStandardMaterial color="#0b1220" emissive="#38bdf8" emissiveIntensity={0.10} />
      </mesh>

      {/* beam */}
      <primitive object={tube} />
      <primitive object={ribbonMesh} />

      {/* electrons */}
      <instancedMesh ref={instRef} args={[undefined as any, undefined as any, maxE]} frustumCulled={false}>
        <sphereGeometry args={[0.35, 18, 18]} />
        <meshStandardMaterial
          color={emits ? "#ef4444" : "#334155"}
          emissive={emits ? "#ef4444" : "#000000"}
          emissiveIntensity={emits ? 0.75 : 0.0}
          roughness={0.5}
          metalness={0.1}
        />
      </instancedMesh>

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={38}
        target={[0, -0.6, 0]}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI * 0.12}
      />
    </>
  );
}

export default function Photoelectric3D(props: Params) {
  return (
    <div className="card canvasCard">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [7.2, 4.8, 7.6], fov: 45, near: 0.1, far: 200 }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
