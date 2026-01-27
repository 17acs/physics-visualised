"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";

function Scene({ rM, intensity }: { rM: number; intensity: number }) {
  // scale metres -> scene units
  const detectorX = rM * 4.0;

  const count = 180;

  const dirs = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      arr.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        )
      );
    }
    return arr;
  }, []);

  const photons = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dir: dirs[i],
        t: Math.random(),
        speed: 0.35 + Math.random() * 0.35,
      })),
    [dirs]
  );

  const tmp = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock, scene }) => {
    const t = clock.getElapsedTime();
    const mesh = scene.getObjectByName("photons") as THREE.InstancedMesh | null;
    if (!mesh) return;

    for (let i = 0; i < count; i++) {
      const p = photons[i];
      const phase = (p.t + t * p.speed) % 1;
      const dist = phase * 6.2;

      tmp.position.copy(p.dir).multiplyScalar(dist);
      const s = 0.03 + 0.02 * Math.sin((t + i) * 3.0);
      tmp.scale.setScalar(s);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  // sparkle count based on net rate (clamped)
  const sparkCount = Math.floor(40 + Math.min(140, Math.max(0, intensity) * 0.6));

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[7, 7, 6]} intensity={1.1} />

      <gridHelper args={[14, 40, "#1e3a8a", "#0b1220"]} position={[0, -1.05, 0]} />

      {/* source */}
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={1.1} />
      </mesh>

      {/* sphere hint (area grows as r^2) */}
      <mesh>
        <sphereGeometry args={[Math.min(5.5, Math.max(0.6, detectorX)), 32, 32]} />
        <meshStandardMaterial color="#a78bfa" transparent opacity={0.05} />
      </mesh>

      {/* detector */}
      <group position={[detectorX, -0.25, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.20, 0.20, 1.6, 28]} />
          <meshStandardMaterial color="#0a0f1a" roughness={0.7} metalness={0.35} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 1.65, 28]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#7dd3fc"
            emissiveIntensity={0.18}
            transparent
            opacity={0.10}
          />
        </mesh>
      </group>

      {/* photons */}
      <instancedMesh name="photons" args={[undefined as any, undefined as any, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#a78bfa"
          emissiveIntensity={0.9}
          transparent
          opacity={0.35}
        />
      </instancedMesh>

      <Sparkles count={sparkCount} scale={[8, 4, 8]} size={1.8} speed={0.35} color="#7dd3fc" />

      <OrbitControls enablePan={false} minDistance={4} maxDistance={18} />
    </>
  );
}

export default function InverseSquare3D({ rM, intensity }: { rM: number; intensity: number }) {
  return (
    <div className="card" style={{ height: "clamp(320px, 55vh, 620px)", overflow: "hidden" }}>
      <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [6.5, 4.2, 7.5], fov: 45 }}>
        <Scene rM={rM} intensity={intensity} />
      </Canvas>
    </div>
  );
}
