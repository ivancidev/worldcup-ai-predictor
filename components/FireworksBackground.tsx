"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const rand = (min: number, max: number): number => Math.random() * (max - min) + min;
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min) + min);
const randColor = (): string => `hsl(${randInt(0, 360)}, 100%, 50%)`;

type Particle = {
  x: number; y: number; color: string;
  vx: number; vy: number; gravity: number; friction: number;
  alpha: number; decay: number; size: number;
  update(): void; draw(ctx: CanvasRenderingContext2D): void; isAlive(): boolean;
};

function createParticle(x: number, y: number, color: string, speed: number, dir: number, gravity: number, friction: number, size: number): Particle {
  const vx = Math.cos(dir) * speed, vy = Math.sin(dir) * speed;
  const decay = rand(0.005, 0.02);
  return {
    x, y, color, vx, vy, gravity, friction, alpha: 1, decay, size,
    update() { this.vx *= this.friction; this.vy *= this.friction; this.vy += this.gravity; this.x += this.vx; this.y += this.vy; this.alpha -= this.decay; },
    draw(ctx) { ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); ctx.restore(); },
    isAlive() { return this.alpha > 0; },
  };
}

type Firework = { x: number; y: number; targetY: number; color: string; speed: number; size: number; vx: number; vy: number; trail: {x:number;y:number}[]; trailLength: number; exploded: boolean; update(): boolean; explode(): void; draw(ctx: CanvasRenderingContext2D): void; };

function getRange(r: {min:number;max:number}|number): number { return typeof r === "number" ? r : rand(r.min, r.max); }
function getColor(c: string | string[] | undefined): string { return Array.isArray(c) ? (c[randInt(0,c.length)] ?? randColor()) : c ?? randColor(); }

function createFirework(x: number, y: number, targetY: number, color: string, speed: number, size: number, pSpeed: {min:number;max:number}|number, pSize: {min:number;max:number}|number, onExplode: (p: Particle[]) => void): Firework {
  const angle = -Math.PI / 2 + rand(-0.3, 0.3);
  const vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
  const trail: {x:number;y:number}[] = [], trailLength = randInt(10, 25);
  return {
    x, y, targetY, color, speed, size, vx, vy, trail, trailLength, exploded: false,
    update() {
      this.trail.push({x: this.x, y: this.y});
      if (this.trail.length > this.trailLength) this.trail.shift();
      this.x += this.vx; this.y += this.vy; this.vy += 0.02;
      if (this.vy >= 0 || this.y <= this.targetY) { this.explode(); return false; }
      return true;
    },
    explode() {
      const n = randInt(50, 150);
      const particles: Particle[] = [];
      for (let i = 0; i < n; i++) particles.push(createParticle(this.x, this.y, this.color, getRange(pSpeed), rand(0, Math.PI*2), 0.05, 0.98, getRange(pSize)));
      onExplode(particles);
    },
    draw(ctx) {
      ctx.save(); ctx.beginPath();
      if (this.trail.length > 1) { ctx.moveTo(this.trail[0]!.x, this.trail[0]!.y); for (const p of this.trail) ctx.lineTo(p.x, p.y); }
      else { ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y); }
      ctx.strokeStyle = this.color; ctx.lineWidth = this.size; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
    },
  };
}

type Props = Omit<React.ComponentProps<"div">, "color"> & {
  canvasProps?: React.ComponentProps<"canvas">;
  population?: number;
  color?: string | string[];
  fireworkSpeed?: {min:number;max:number}|number;
  fireworkSize?: {min:number;max:number}|number;
  particleSpeed?: {min:number;max:number}|number;
  particleSize?: {min:number;max:number}|number;
};

export function FireworksBackground({ className, canvasProps, population=1, color, fireworkSpeed={min:4,max:8}, fireworkSize={min:2,max:5}, particleSpeed={min:2,max:7}, particleSize={min:1,max:5}, ...props }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let maxX = window.innerWidth, ratio = container.offsetHeight / container.offsetWidth, maxY = maxX * ratio;
    canvas.width = maxX; canvas.height = maxY;

    const resize = () => { maxX = window.innerWidth; ratio = container.offsetHeight/container.offsetWidth; maxY = maxX*ratio; canvas.width=maxX; canvas.height=maxY; };
    window.addEventListener("resize", resize);

    const explosions: Particle[] = [], fireworks: Firework[] = [];
    const onExplode = (p: Particle[]) => explosions.push(...p);

    const launch = () => {
      const fw = createFirework(rand(maxX*0.1,maxX*0.9), maxY, rand(maxY*0.1,maxY*0.4), getColor(color), getRange(fireworkSpeed), getRange(fireworkSize), particleSpeed, particleSize, onExplode);
      fireworks.push(fw);
      setTimeout(launch, rand(300,800)/population);
    };
    launch();

    let raf: number;
    const animate = () => {
      ctx.clearRect(0,0,maxX,maxY);
      for (let i=fireworks.length-1;i>=0;i--) { if (!fireworks[i]!.update()) fireworks.splice(i,1); else fireworks[i]!.draw(ctx); }
      for (let i=explosions.length-1;i>=0;i--) { explosions[i]!.update(); if (explosions[i]!.isAlive()) explosions[i]!.draw(ctx); else explosions.splice(i,1); }
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, [population, color, fireworkSpeed, fireworkSize, particleSpeed, particleSize]);

  return (
    <div ref={containerRef} className={cn("relative size-full overflow-hidden", className)} {...props}>
      <canvas {...canvasProps} ref={canvasRef} className={cn("absolute inset-0 size-full", canvasProps?.className)} />
    </div>
  );
}
