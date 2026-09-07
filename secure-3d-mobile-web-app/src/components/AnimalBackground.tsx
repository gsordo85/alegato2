"use client";

import { useEffect, useRef } from "react";

const ANIMALS = ["🐶", "🐱", "🐴", "🐮", "🐷", "🐔", "🐰", "🦜", "🐢", "🦉", "🐐", "🐕", "🐈", "🦴", "🐾"];

type Sprite = {
  x: number;
  y: number;
  z: number; // depth 0..1 (1 = closest)
  vx: number;
  vy: number;
  char: string;
  rot: number;
  vr: number;
};

export default function AnimalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const sprites: Sprite[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const build = () => {
      sprites.length = 0;
      const count = Math.min(28, Math.max(14, Math.floor((w * h) / 60000)));
      for (let i = 0; i < count; i++) {
        const z = Math.random();
        sprites.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          vx: (Math.random() - 0.5) * (0.2 + z * 0.5),
          vy: (Math.random() - 0.5) * (0.2 + z * 0.5) - 0.1,
          char: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    resize();
    build();

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / w;
      mouse.current.y = e.clientY / h;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouse.current.x = e.touches[0].clientX / w;
        mouse.current.y = e.touches[0].clientY / h;
      }
    };
    const onResize = () => {
      resize();
      build();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", onResize);

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = (mouse.current.x - 0.5) * 2; // -1..1
      const my = (mouse.current.y - 0.5) * 2;

      for (const s of sprites) {
        // drift
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;

        // wrap around
        const size = 18 + s.z * 46;
        if (s.x < -60) s.x = w + 60;
        if (s.x > w + 60) s.x = -60;
        if (s.y < -60) s.y = h + 60;
        if (s.y > h + 60) s.y = -60;

        // parallax offset from mouse (closer = moves more) -> pseudo 3D
        const px = mx * s.z * 40;
        const py = my * s.z * 40;

        ctx.save();
        ctx.translate(s.x + px, s.y + py);
        ctx.rotate(Math.sin(s.rot) * 0.25);
        // depth-based scale pulse
        const scale = 0.85 + s.z * 0.4;
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.12 + s.z * 0.4;
        ctx.font = `${size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.char, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04170f] via-[#04120c] to-[#020a07]" />
      {/* glow blobs */}
      <div className="blob absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-500/25" />
      <div
        className="blob absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-400/20"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-lime-500/15"
        style={{ animationDelay: "4s" }}
      />
      {/* animal sprites */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
