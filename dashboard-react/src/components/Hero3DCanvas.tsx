import { useEffect, useRef } from 'react';

export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const numParticles = 80;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        color: i % 3 === 0 ? '#2dd4bf' : i % 3 === 1 ? '#57f1db' : '#3c4a46',
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.fillStyle = 'rgba(14, 21, 19, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Glowing cursor light halo (Obsidian & Teal)
      const gradient1 = ctx.createRadialGradient(mouseX, mouseY, 5, mouseX, mouseY, 160);
      gradient1.addColorStop(0, 'rgba(45, 212, 191, 0.08)');
      gradient1.addColorStop(1, 'rgba(14, 21, 19, 0)');
      ctx.fillStyle = gradient1;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 160, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting node ring
      const time = Date.now() * 0.0005;
      const orbX = width / 2 + Math.cos(time) * 180;
      const orbY = height / 2 + Math.sin(time) * 100;
      const gradient2 = ctx.createRadialGradient(orbX, orbY, 4, orbX, orbY, 130);
      gradient2.addColorStop(0, 'rgba(87, 241, 219, 0.1)');
      gradient2.addColorStop(1, 'rgba(14, 21, 19, 0)');
      ctx.fillStyle = gradient2;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 130, 0, Math.PI * 2);
      ctx.fill();

      // Update & Draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Push away slightly from cursor
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          p.x -= (dx / dist) * 0.35;
          p.y -= (dy / dist) * 0.35;
        }

        // Bounce borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with hairline connections
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdx = p.x - p2.x;
          const pdy = p.y - p2.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 100) {
            ctx.strokeStyle = `rgba(60, 74, 70, ${0.15 * (1 - pdist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
