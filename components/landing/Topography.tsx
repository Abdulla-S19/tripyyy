"use client";

import { useEffect, useRef } from "react";

// Deterministic value noise → fractal field → marching-squares contour lines, like a survey map.
function makeNoise(seed: number) {
  const hash = (x: number, y: number) => {
    let h = (x * 374761393 + y * 668265263 + seed * 144269504) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 4; o++) {
      v += amp * noise(x * f, y * f);
      amp *= 0.5;
      f *= 2.03;
    }
    return v;
  };
}

export function Topography({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const field = makeNoise(7);

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cell = 9;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      const scale = 1 / 260;
      const grid = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid[j * cols + i] = field(i * cell * scale + 3.1, j * cell * scale + 1.7);

      const LEVELS = 16;
      for (let l = 1; l < LEVELS; l++) {
        const iso = 0.18 + (l / LEVELS) * 0.64;
        const index = l % 4 === 0; // every fourth line is an "index contour", drawn stronger
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = grid[j * cols + i];
            const b = grid[j * cols + i + 1];
            const c = grid[(j + 1) * cols + i + 1];
            const d = grid[(j + 1) * cols + i];
            const code = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
            if (code === 0 || code === 15) continue;
            const x = i * cell;
            const y = j * cell;
            const t = (p: number, q: number) => (iso - p) / (q - p || 1e-6);
            const top: [number, number] = [x + t(a, b) * cell, y];
            const right: [number, number] = [x + cell, y + t(b, c) * cell];
            const bottom: [number, number] = [x + t(d, c) * cell, y + cell];
            const left: [number, number] = [x, y + t(a, d) * cell];
            const seg = (p: [number, number], q: [number, number]) => {
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(q[0], q[1]);
            };
            switch (code) {
              case 1: case 14: seg(left, bottom); break;
              case 2: case 13: seg(bottom, right); break;
              case 3: case 12: seg(left, right); break;
              case 4: case 11: seg(top, right); break;
              case 5: seg(left, top); seg(bottom, right); break;
              case 6: case 9: seg(top, bottom); break;
              case 7: case 8: seg(left, top); break;
              case 10: seg(left, bottom); seg(top, right); break;
            }
          }
        }
        ctx.strokeStyle = index ? "rgba(223,175,85,0.16)" : "rgba(146,153,168,0.075)";
        ctx.lineWidth = index ? 1.1 : 0.8;
        ctx.stroke();
      }
    };

    draw();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(draw, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
