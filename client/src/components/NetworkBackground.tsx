import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let particles: Particle[] = [];
    let animationId = 0;
    let width = 0;
    let height = 0;
    let time = 0;

    const DENSITY = 7000; // higher = fewer particles
    const MAX_DISTANCE = 150;
    const SPEED = 0.15;
    const MOUSE_RADIUS = 160; // how far the mouse influence reaches

    // Mouse position in local (canvas) coordinates. null when not hovering.
    const mouse = { x: 0, y: 0, active: false };

    const resize = () => {
      width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      height = canvas.parentElement?.clientHeight ?? window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const count = Math.min(80, Math.floor((width * height) / DENSITY));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
      }

      // Precompute a soft "display" position for each particle: nearby particles
      // get gently pulled toward the mouse (parallax/attract), without altering
      // their real simulation position, so they settle back naturally.
      const displayPositions = particles.map((p) => {
        if (!mouse.active || prefersReducedMotion) return { x: p.x, y: p.y, boost: 0 };
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= MOUSE_RADIUS || dist === 0) return { x: p.x, y: p.y, boost: 0 };
        const strength = (1 - dist / MOUSE_RADIUS) * 14; // max pixel pull
        return {
          x: p.x + (dx / dist) * strength,
          y: p.y + (dy / dist) * strength,
          boost: 1 - dist / MOUSE_RADIUS,
        };
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = displayPositions[i];
          const b = displayPositions[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DISTANCE) {
            const baseAlpha = 0.22 * (1 - dist / MAX_DISTANCE);
            // Gentle global pulse so connections breathe over time.
            const pulse = 0.75 + 0.25 * Math.sin(time * 0.02 + i * 0.3 + j * 0.15);
            const mouseGlow = Math.max(a.boost, b.boost);
            const alpha = baseAlpha * pulse + mouseGlow * 0.25;

            ctx.save();
            if (mouseGlow > 0) {
              ctx.shadowColor = 'rgba(99, 102, 241, 0.9)';
              ctx.shadowBlur = 8 * mouseGlow;
            }
            ctx.strokeStyle = `rgba(76, 111, 255, ${Math.min(alpha, 0.6)})`;
            ctx.lineWidth = 1 + mouseGlow * 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const { x, y, boost } = displayPositions[i];
        const radius = 3 + boost * 2.5;

        ctx.save();
        if (boost > 0) {
          ctx.shadowColor = 'rgba(99, 102, 241, 0.9)';
          ctx.shadowBlur = 10 * boost;
        }
        ctx.fillStyle = `rgba(76, 111, 255, ${0.75 + boost * 0.25})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}