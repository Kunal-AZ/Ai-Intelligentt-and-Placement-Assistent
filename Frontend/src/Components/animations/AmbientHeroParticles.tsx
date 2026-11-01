import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export function AmbientHeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Honor accessibility reduced motion setting
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let isVisible = true;
    let parent = canvas.parentElement;

    let width = (canvas.width = parent?.offsetWidth || window.innerWidth);
    let height = (canvas.height = parent?.offsetHeight || 600);
    let canvasRect = canvas.getBoundingClientRect();

    const updateDimensions = () => {
      if (!canvas || !canvas.parentElement) return;
      parent = canvas.parentElement;
      width = canvas.width = parent.offsetWidth;
      height = canvas.height = parent.offsetHeight;
      canvasRect = canvas.getBoundingClientRect();
    };

    window.addEventListener('resize', updateDimensions, { passive: true });

    // Colors aligned with dark/light themes
    const colors = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#a855f7'];

    // Optimize particle count based on screen width
    const count = Math.min(32, Math.max(16, Math.floor(width / 42)));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.35 + 0.15,
    }));

    let mouseX = -1000;
    let mouseY = -1000;
    let mouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Use cached canvas rect to avoid layout thrashing
      mouseX = e.clientX - canvasRect.left;
      mouseY = e.clientY - canvasRect.top;
      mouseActive = true;
    };

    const handleMouseLeave = () => {
      mouseActive = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const targetEl = parent || window;
    targetEl.addEventListener('mousemove', handleMouseMove as EventListener, { passive: true });
    targetEl.addEventListener('mouseleave', handleMouseLeave as EventListener, { passive: true });

    // Pause animation when hero scrolls off-screen or tab is backgrounded
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          canvasRect = canvas.getBoundingClientRect();
          render();
        } else if (!isVisible && animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleVisibilityChange = () => {
      if (document.hidden && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      } else if (!document.hidden && isVisible && !animationFrameId) {
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 9000) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 95) * 0.12})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Mouse repulsion
        if (mouseActive) {
          const mdx = p.x - mouseX;
          const mdy = p.y - mouseY;
          const mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < 8100 && mDistSq > 0) {
            const mDist = Math.sqrt(mDistSq);
            const force = (90 - mDist) / 90;
            p.x += (mdx / mDist) * force * 1.5;
            p.y += (mdy / mDist) * force * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateDimensions);
      targetEl.removeEventListener('mousemove', handleMouseMove as EventListener);
      targetEl.removeEventListener('mouseleave', handleMouseLeave as EventListener);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] opacity-70 w-full h-full"
      aria-hidden="true"
    />
  );
}
