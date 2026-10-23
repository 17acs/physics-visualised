"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type Params = {
  intensity: number; // 0..100
  fHz: number; // Hz
  emits: boolean;
  kmaxEv: number; // eV
};

const THETA = THREE.MathUtils.degToRad(46);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const IN_DIR = new THREE.Vector3(Math.sin(THETA), -Math.cos(THETA), 0).normalize();
const PERP_Z = new THREE.Vector3(0, 0, 1);
const PERP_SIDE = new THREE.Vector3().crossVectors(IN_DIR, PERP_Z).normalize();

const SLAB_C = -0.92;
const SLAB_H = 0.46;
const TOP_Y = SLAB_C + SLAB_H / 2;
const HIT = new THREE.Vector3(0, TOP_Y, 0);
const S0 = -6.05;
const S1 = -0.22;
const TUBE_END = -0.62;
const LAMP = HIT.clone().addScaledVector(IN_DIR, S0);
const LAMP_Q = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, IN_DIR);

const MAX_PHOTONS = 72;
const MAX_ELECTRONS = 96;
const MAX_PULSES = 40;
const RIBBON_N = 240;
const PHOTON_SPEED = 4.6;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type RGB = { r: number; g: number; b: number };

/** sRGB 0..1 for a photon of this frequency. Colour is the energy cue. */
function spectralRGB(fHz: number): RGB {
  const lambda = 2.99792458e17 / Math.max(fHz, 1); // nm
  let r = 0;
  let g = 0;
  let b = 0;

  if (lambda >= 380 && lambda < 440) {
    r = (440 - lambda) / 60;
    b = 1;
  } else if (lambda >= 440 && lambda < 490) {
    g = (lambda - 440) / 50;
    b = 1;
  } else if (lambda >= 490 && lambda < 510) {
    g = 1;
    b = (510 - lambda) / 20;
  } else if (lambda >= 510 && lambda < 580) {
    r = (lambda - 510) / 70;
    g = 1;
  } else if (lambda >= 580 && lambda < 645) {
    r = 1;
    g = (645 - lambda) / 65;
  } else if (lambda >= 645 && lambda <= 780) {
    r = 1;
  } else if (lambda > 780) {
    const t = clamp((lambda - 780) / 1400, 0, 1);
    r = 0.78 - 0.42 * t;
    g = 0.05 * (1 - t);
    b = 0.07;
  } else {
    const t = clamp((380 - lambda) / 220, 0, 1);
    r = 0.58 + 0.4 * t;
    g = 0.2 + 0.55 * t;
    b = 1;
  }

  return { r, g, b };
}

function applySpectral(fHz: number, out: THREE.Color) {
  const { r, g, b } = spectralRGB(fHz);
  out.setRGB(r, g, b, THREE.SRGBColorSpace);
  return out;
}

type Photon = { alive: boolean; s: number; side: number; z: number };
type Electron = { alive: boolean; age: number; p: THREE.Vector3; v: THREE.Vector3 };
type Pulse = { alive: boolean; age: number; heat: boolean; p: THREE.Vector3 };

function takeFree<T extends { alive: boolean }>(pool: T[]): T | null {
  for (let i = 0; i < pool.length; i++) if (!pool[i].alive) return pool[i];
  return null;
}

function Scene({ intensity, fHz, emits, kmaxEv }: Params) {
  const photonRef = useRef<THREE.InstancedMesh>(null);
  const photonCoreRef = useRef<THREE.InstancedMesh>(null);
  const electronRef = useRef<THREE.InstancedMesh>(null);
  const tailRef = useRef<THREE.InstancedMesh>(null);
  const pulseRef = useRef<THREE.InstancedMesh>(null);
  const seaRef = useRef<THREE.InstancedMesh>(null);
  const spotRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  const lampCoreRef = useRef<THREE.MeshBasicMaterial>(null);
  const lampGlowRef = useRef<THREE.MeshBasicMaterial>(null);
  const lampRingRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampLightRef = useRef<THREE.PointLight>(null);
  const hitLightRef = useRef<THREE.PointLight>(null);

  const spec = useMemo(() => new THREE.Color(), []);
  const heat = useMemo(() => new THREE.Color().setRGB(1, 0.45, 0.12, THREE.SRGBColorSpace), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpS = useMemo(() => new THREE.Vector3(), []);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const elecColor = useMemo(() => new THREE.Color(), []);
  const pulseColor = useMemo(() => new THREE.Color(), []);

  const photons = useRef<Photon[] | null>(null);
  const electrons = useRef<Electron[] | null>(null);
  const pulses = useRef<Pulse[] | null>(null);
  const spawnAcc = useRef(0);
  const flash = useRef(0);
  const heatFlash = useRef(0);

  if (!photons.current) {
    photons.current = Array.from({ length: MAX_PHOTONS }, () => ({
      alive: false,
      s: S0,
      side: 0,
      z: 0,
    }));
  }
  if (!electrons.current) {
    electrons.current = Array.from({ length: MAX_ELECTRONS }, () => ({
      alive: false,
      age: 0,
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }));
  }
  if (!pulses.current) {
    pulses.current = Array.from({ length: MAX_PULSES }, () => ({
      alive: false,
      age: 0,
      heat: false,
      p: new THREE.Vector3(),
    }));
  }

  const seaPos = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const ring = 0.28 + (i % 2) * 0.22;
      arr.push(new THREE.Vector3(Math.cos(a) * ring, 0, Math.sin(a) * ring * 0.85));
    }
    return arr;
  }, []);

  const ribbon = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const verts = new Float32Array(RIBBON_N * 2 * 3);
    geom.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    const indices: number[] = [];
    for (let i = 0; i < RIBBON_N - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    geom.setIndex(indices);
    geom.computeBoundingSphere();

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.frustumCulled = false;
    return { geom, mat, mesh };
  }, []);

  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 28 }, (_, i) => {
        const s = lerp(S0, TUBE_END, i / 27);
        return HIT.clone().addScaledVector(IN_DIR, s);
      })
    );
    const geom = new THREE.TubeGeometry(curve, 90, 0.28, 10, false);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.frustumCulled = false;
    return { geom, mat, mesh };
  }, []);

  useEffect(() => {
    const ribbonGeom = ribbon.geom;
    const ribbonMat = ribbon.mat;
    const tubeGeom = tube.geom;
    const tubeMat = tube.mat;
    return () => {
      ribbonGeom.dispose();
      ribbonMat.dispose();
      tubeGeom.dispose();
      tubeMat.dispose();
    };
  }, [ribbon, tube]);

  useLayoutEffect(() => {
    for (const mesh of [
      photonRef.current,
      photonCoreRef.current,
      electronRef.current,
      tailRef.current,
      pulseRef.current,
      seaRef.current,
    ]) {
      if (mesh) mesh.count = 0;
    }
  }, []);

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.05);
    const t = state.clock.getElapsedTime();
    const bright = clamp(intensity / 100, 0, 1);
    applySpectral(fHz, spec);

    const fMax = 1.2e15;
    const ft = clamp(fHz / fMax, 0, 1);
    const lambda = lerp(3.5, 0.42, ft);
    const k = (2 * Math.PI) / lambda;
    const amp = lerp(0.34, 0.18, ft);

    {
      const pos = ribbon.geom.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const halfWidth = 0.42;
      const waveSpeed = 2.6;

      for (let i = 0; i < RIBBON_N; i++) {
        const u = i / (RIBBON_N - 1);
        const s = lerp(S0, S1, u);
        tmpA.copy(HIT).addScaledVector(IN_DIR, s);
        const wiggle = amp * Math.sin(k * (s - waveSpeed * t));
        tmpB.copy(tmpA).addScaledVector(PERP_Z, -halfWidth).addScaledVector(PERP_SIDE, wiggle);
        const idx = i * 6;
        arr[idx] = tmpB.x;
        arr[idx + 1] = tmpB.y;
        arr[idx + 2] = tmpB.z;
        tmpB.copy(tmpA).addScaledVector(PERP_Z, halfWidth).addScaledVector(PERP_SIDE, wiggle);
        arr[idx + 3] = tmpB.x;
        arr[idx + 4] = tmpB.y;
        arr[idx + 5] = tmpB.z;
      }
      pos.needsUpdate = true;
      ribbon.mat.color.copy(spec);
      ribbon.mat.opacity = bright * 0.42;
      tube.mat.color.copy(spec);
      tube.mat.opacity = bright * 0.1;
    }

    if (lampCoreRef.current) lampCoreRef.current.color.copy(bright > 0.01 ? spec : white).multiplyScalar(bright > 0.01 ? 1 : 0.15);
    if (lampGlowRef.current) {
      lampGlowRef.current.color.copy(spec);
      lampGlowRef.current.opacity = bright * 0.55;
    }
    if (lampRingRef.current) {
      lampRingRef.current.emissive.copy(spec);
      lampRingRef.current.emissiveIntensity = 0.25 + bright * 1.5;
    }
    if (lampLightRef.current) {
      lampLightRef.current.color.copy(spec);
      lampLightRef.current.intensity = bright * 10;
    }

    flash.current = Math.max(0, flash.current - step * 2.2);
    heatFlash.current = Math.max(0, heatFlash.current - step * 1.6);

    if (spotRef.current) {
      spotRef.current.color.copy(heatFlash.current > flash.current ? heat : spec);
      spotRef.current.opacity = bright * 0.32 + flash.current * 0.28 + heatFlash.current * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.color.copy(spec);
      ringRef.current.opacity = bright * 0.9;
    }
    if (hitLightRef.current) {
      hitLightRef.current.color.copy(heatFlash.current > 0.05 && !emits ? heat : spec);
      hitLightRef.current.intensity = bright * 3.5 + flash.current * 6 + heatFlash.current * 5;
    }

    const rate = bright * 11;
    spawnAcc.current += rate * step;
    let spawned = 0;
    while (spawnAcc.current >= 1 && spawned < 6) {
      spawnAcc.current -= 1;
      spawned++;
      const photon = takeFree(photons.current!);
      if (!photon) break;
      photon.alive = true;
      photon.s = S0 + 0.45;
      photon.side = THREE.MathUtils.randFloatSpread(0.22);
      photon.z = THREE.MathUtils.randFloatSpread(0.28);
    }

    const photonMesh = photonRef.current;
    const photonCore = photonCoreRef.current;
    if (photonMesh && photonCore) {
      let n = 0;
      for (let i = 0; i < photons.current!.length; i++) {
        const p = photons.current![i];
        if (!p.alive) continue;
        p.s += PHOTON_SPEED * step;
        if (p.s >= -0.02) {
          p.alive = false;
          const pulse = takeFree(pulses.current!);
          tmpA.copy(HIT).addScaledVector(PERP_SIDE, p.side).addScaledVector(PERP_Z, p.z);
          tmpA.y = TOP_Y + 0.05;
          if (pulse) {
            pulse.alive = true;
            pulse.age = 0;
            pulse.heat = !emits;
            pulse.p.copy(tmpA);
          }
          if (emits) {
            flash.current = Math.min(1.2, flash.current + 0.7);
            const electron = takeFree(electrons.current!);
            if (electron) {
              const share = Math.pow(Math.random(), 1.15);
              const ke = Math.max(kmaxEv, 0) * share;
              const speed = 1.25 + 4.1 * Math.sqrt(ke);
              const theta = Math.pow(Math.random(), 0.65) * 0.58;
              const phi = Math.random() * Math.PI * 2;
              dir.set(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
              electron.alive = true;
              electron.age = 0;
              electron.p.copy(tmpA);
              electron.p.y = TOP_Y + 0.12;
              electron.v.copy(dir).multiplyScalar(speed);
            }
          } else {
            heatFlash.current = Math.min(1.2, heatFlash.current + 0.55);
          }
          continue;
        }

        tmpA.copy(HIT).addScaledVector(IN_DIR, p.s).addScaledVector(PERP_SIDE, p.side).addScaledVector(PERP_Z, p.z);
        tmpQ.identity();
        tmpS.setScalar(0.13);
        tmpM.compose(tmpA, tmpQ, tmpS);
        photonMesh.setMatrixAt(n, tmpM);
        tmpS.setScalar(0.055);
        tmpM.compose(tmpA, tmpQ, tmpS);
        photonCore.setMatrixAt(n, tmpM);
        n++;
      }
      photonMesh.count = n;
      photonCore.count = n;
      photonMesh.instanceMatrix.needsUpdate = true;
      photonCore.instanceMatrix.needsUpdate = true;
      const mat = photonMesh.material as THREE.MeshBasicMaterial;
      mat.color.copy(spec);
    }

    const pulseMesh = pulseRef.current;
    if (pulseMesh) {
      let n = 0;
      for (let i = 0; i < pulses.current!.length; i++) {
        const p = pulses.current![i];
        if (!p.alive) continue;
        p.age += step;
        const u = p.age / (p.heat ? 0.55 : 0.32);
        if (u >= 1) {
          p.alive = false;
          continue;
        }
        tmpQ.identity();
        if (p.heat) {
          const spread = 0.16 + u * 0.5;
          tmpS.set(spread, 0.04 + u * 0.03, spread);
        } else {
          tmpS.setScalar(0.05 + u * 0.2);
        }
        tmpM.compose(p.p, tmpQ, tmpS);
        pulseMesh.setMatrixAt(n, tmpM);
        pulseColor.copy(p.heat ? heat : white).multiplyScalar(1 - u);
        pulseMesh.setColorAt(n, pulseColor);
        n++;
      }
      pulseMesh.count = n;
      pulseMesh.instanceMatrix.needsUpdate = true;
      if (pulseMesh.instanceColor) pulseMesh.instanceColor.needsUpdate = true;
    }

    const elecMesh = electronRef.current;
    const tailMesh = tailRef.current;
    if (elecMesh && tailMesh) {
      let n = 0;
      for (let i = 0; i < electrons.current!.length; i++) {
        const e = electrons.current![i];
        if (!e.alive) continue;
        e.age += step;
        e.p.addScaledVector(e.v, step);
        const speed = e.v.length();
        if (e.age > 1.85 || e.p.y > 6.2 || Math.abs(e.p.x) > 6.5 || Math.abs(e.p.z) > 5) {
          e.alive = false;
          continue;
        }
        dir.copy(e.v).multiplyScalar(1 / Math.max(speed, 1e-5));
        tmpQ.setFromUnitVectors(Y_AXIS, dir);
        const stretch = 1 + Math.min(1.7, speed * 0.16);
        tmpS.set(0.08, 0.08 * stretch, 0.08);
        tmpM.compose(e.p, tmpQ, tmpS);
        elecMesh.setMatrixAt(n, tmpM);

        const hue = clamp((speed - 0.6) / 5.5, 0, 1);
        elecColor.setRGB(lerp(0.25, 0.92, hue), lerp(0.62, 0.96, hue), 1, THREE.SRGBColorSpace);
        elecMesh.setColorAt(n, elecColor);

        tmpB.copy(e.p).addScaledVector(dir, -0.26);
        tmpS.setScalar(0.035);
        tmpQ.identity();
        tmpM.compose(tmpB, tmpQ, tmpS);
        tailMesh.setMatrixAt(n, tmpM);
        n++;
      }
      elecMesh.count = n;
      tailMesh.count = n;
      elecMesh.instanceMatrix.needsUpdate = true;
      tailMesh.instanceMatrix.needsUpdate = true;
      if (elecMesh.instanceColor) elecMesh.instanceColor.needsUpdate = true;
    }

    const sea = seaRef.current;
    if (sea) {
      for (let i = 0; i < seaPos.length; i++) {
        const bob = emits ? Math.sin(t * 5.2 + i * 1.3) * 0.028 : Math.sin(t * 1.3 + i) * 0.006;
        tmpA.copy(seaPos[i]);
        tmpA.y = TOP_Y + 0.045 + bob;
        tmpQ.identity();
        tmpS.setScalar(emits ? 0.034 : 0.026);
        tmpM.compose(tmpA, tmpQ, tmpS);
        sea.setMatrixAt(i, tmpM);
      }
      sea.count = seaPos.length;
      sea.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <color attach="background" args={["#070814"]} />
      <fog attach="fog" args={["#070814", 18, 40]} />

      <hemisphereLight args={["#e8eefc", "#24180f", 0.7]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[7, 9, 6]} intensity={1.7} />
      <directionalLight position={[-6, 3, -4]} intensity={0.35} />
      <pointLight ref={lampLightRef} position={[LAMP.x, LAMP.y, LAMP.z]} distance={14} decay={2} />
      <pointLight ref={hitLightRef} position={[0, TOP_Y + 0.4, 0]} distance={7} decay={2} />

      <gridHelper args={[16, 32, "#1e3a8a", "#12182c"]} position={[0, SLAB_C - SLAB_H / 2 - 0.04, 0]} />

      <mesh position={[0, SLAB_C - 0.08, 0]}>
        <boxGeometry args={[5.55, 0.1, 3.55]} />
        <meshStandardMaterial color="#3a3128" metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh position={[0, SLAB_C, 0]}>
        <boxGeometry args={[5.25, SLAB_H, 3.25]} />
        <meshStandardMaterial color="#8e9aab" metalness={0.84} roughness={0.32} />
      </mesh>
      <mesh position={[0, TOP_Y + 0.008, 0]}>
        <boxGeometry args={[5.05, 0.028, 3.05]} />
        <meshStandardMaterial color="#e7eef8" metalness={0.7} roughness={0.18} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP_Y + 0.03, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial
          ref={spotRef}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP_Y + 0.034, 0]}>
        <ringGeometry args={[0.62, 0.68, 56]} />
        <meshBasicMaterial
          ref={ringRef}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <instancedMesh ref={seaRef} args={[undefined, undefined, 10]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#dbe7f5" toneMapped={false} />
      </instancedMesh>

      <primitive object={tube.mesh} />
      <primitive object={ribbon.mesh} />

      <group position={[LAMP.x, LAMP.y, LAMP.z]} quaternion={LAMP_Q}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.032, 12, 28]} />
          <meshStandardMaterial ref={lampRingRef} color="#0f172a" emissive="#ffffff" metalness={0.45} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.15, 28, 28]} />
          <meshBasicMaterial ref={lampCoreRef} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.36, 20, 20]} />
          <meshBasicMaterial
            ref={lampGlowRef}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <instancedMesh ref={photonRef} args={[undefined, undefined, MAX_PHOTONS]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={photonCoreRef} args={[undefined, undefined, MAX_PHOTONS]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={pulseRef} args={[undefined, undefined, MAX_PULSES]} frustumCulled={false}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={electronRef} args={[undefined, undefined, MAX_ELECTRONS]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={tailRef} args={[undefined, undefined, MAX_ELECTRONS]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#bfdbfe" transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={20}
        target={[0.1, 0.35, 0]}
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={Math.PI * 0.16}
      />
    </>
  );
}

export default function Photoelectric3D(props: Params) {
  return (
    <div className="card canvasCard" style={{ padding: 0, height: "clamp(440px, 68vh, 780px)" }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [7.8, 4.9, 8.4], fov: 42, near: 0.1, far: 80 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
