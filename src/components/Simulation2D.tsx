import React, { useEffect, useRef } from 'react';
import { GasState } from '../types';

interface Simulation2DProps {
  state: GasState;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const Simulation2D: React.FC<Simulation2DProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(null);

  // Constants for the cylinder - Shifted right and enlarged
  const CYLINDER_X = 300;
  const CYLINDER_WIDTH = 220;
  const CYLINDER_BOTTOM = 420;
  const CYLINDER_MAX_HEIGHT = 320;

  // Initialize particles
  useEffect(() => {
    const numParticles = 60; // More particles for larger cylinder
    const particles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: CYLINDER_X + Math.random() * CYLINDER_WIDTH,
        y: CYLINDER_BOTTOM - Math.random() * (state.volume / 100 * CYLINDER_MAX_HEIGHT),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 4, // Slightly larger particles for better visibility
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate piston position
      const volumeHeight = (state.volume / 100) * CYLINDER_MAX_HEIGHT;
      const pistonY = CYLINDER_BOTTOM - volumeHeight;

      // Draw Cylinder Background with subtle gradient
      const cylinderGradient = ctx.createLinearGradient(CYLINDER_X, 0, CYLINDER_X + CYLINDER_WIDTH, 0);
      cylinderGradient.addColorStop(0, '#f8fafc');
      cylinderGradient.addColorStop(0.5, '#ffffff');
      cylinderGradient.addColorStop(1, '#f1f5f9');
      
      // Temperature glow
      const tempFactor = Math.min(Math.max((state.temperature - 200) / 400, 0), 1);
      ctx.save();
      if (tempFactor > 0.5) {
        ctx.shadowColor = `rgba(255, 0, 0, ${(tempFactor - 0.5) * 0.5})`;
        ctx.shadowBlur = 20;
      }
      
      ctx.fillStyle = cylinderGradient;
      ctx.strokeStyle = tempFactor > 0.7 ? '#ef4444' : '#475569';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(CYLINDER_X, 60, CYLINDER_WIDTH, CYLINDER_BOTTOM - 60, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw Scale
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.textAlign = 'left';
      [0, 20, 40, 60, 80, 100].forEach(v => {
        const y = CYLINDER_BOTTOM - (v / 100) * CYLINDER_MAX_HEIGHT;
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.moveTo(CYLINDER_X + CYLINDER_WIDTH, y);
        ctx.lineTo(CYLINDER_X + CYLINDER_WIDTH + 15, y);
        ctx.stroke();
        ctx.fillText(`${v}L`, CYLINDER_X + CYLINDER_WIDTH + 20, y + 4);
      });

      // Physics update
      // Speed factor based on temperature (v ~ sqrt(T))
      const speedMultiplier = Math.sqrt(state.temperature / 300) * 2;
      
      // Color based on temperature (reusing tempFactor from above)
      const r = Math.floor(13 + tempFactor * 220); // From teal-600 (13, 148, 136) to red
      const g = Math.floor(148 - tempFactor * 100);
      const b = Math.floor(136 - tempFactor * 100);
      const particleColor = `rgb(${r}, ${g}, ${b})`;

      particlesRef.current.forEach((p, i) => {
        // Move
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wall collisions (Left/Right)
        if (p.x - p.radius < CYLINDER_X) {
          p.x = CYLINDER_X + p.radius;
          p.vx *= -1;
        } else if (p.x + p.radius > CYLINDER_X + CYLINDER_WIDTH) {
          p.x = CYLINDER_X + CYLINDER_WIDTH - p.radius;
          p.vx *= -1;
        }

        // Bottom collision
        if (p.y + p.radius > CYLINDER_BOTTOM) {
          p.y = CYLINDER_BOTTOM - p.radius;
          p.vy *= -1;
        }

        // Piston collision (Top)
        if (p.y - p.radius < pistonY) {
          p.y = pistonY + p.radius;
          p.vy = Math.abs(p.vy); // Bounce down
        }

        // Particle-Particle collisions (Simple)
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = p.radius + p2.radius;

          if (distance < minDistance) {
            // Collision response
            const angle = Math.atan2(dy, dx);
            const targetX = p.x + Math.cos(angle) * minDistance;
            const targetY = p.y + Math.sin(angle) * minDistance;
            const ax = (targetX - p2.x) * 0.1;
            const ay = (targetY - p2.y) * 0.1;
            p.vx -= ax;
            p.vy -= ay;
            p2.vx += ax;
            p2.vy += ay;
          }
        }

        // Draw Particle with highlight
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle highlight for 3D effect
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Piston with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(CYLINDER_X - 8, pistonY - 8, CYLINDER_WIDTH + 16, 16, 4);
      ctx.fill();
      ctx.restore();
      
      // Piston Rod
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(CYLINDER_X + CYLINDER_WIDTH / 2 - 8, 60, 16, pistonY - 8);
      
      // Handle
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(CYLINDER_X + CYLINDER_WIDTH / 2 - 50, 45, 100, 18, 10);
      ctx.fill();

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={500} 
        className="drop-shadow-2xl"
      />
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
        Kinetic Gas Simulator v3.0
      </div>
    </div>
  );
};
