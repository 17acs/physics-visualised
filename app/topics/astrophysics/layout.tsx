"use client";

import "./astrophysics.css";
import React, { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;

    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    // Lock in non-null refs for TS + closures
    const canvas: HTMLCanvasElement = cnv;
    const context: CanvasRenderingContext2D = ctx;

    let raf = 0;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];

    function rebuild() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;

      // density scales with screen size
      const count = Math.floor((w * h) / 9000);
      const n = Math.max(240, Math.min(800, count));

      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.55 + 0.20,
        tw: Math.random() * 0.015 + 0.006,
      }));
    }

    function draw() {
      context.clearRect(0, 0, w, h);

      for (const s of stars) {
        // subtle twinkle
        s.a += (Math.random() - 0.5) * s.tw;
        if (s.a < 0.15) s.a = 0.15;
        if (s.a > 0.85) s.a = 0.85;

        context.beginPath();
        context.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${s.a})`;
        context.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    rebuild();
    raf = requestAnimationFrame(draw);

    const onResize = () => rebuild();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="astroSection">
      <canvas ref={canvasRef} className="astroStars" />
      <div className="astroContent">{children}</div>
    </div>
  );
}
