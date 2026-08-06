/**
 * StarMeet — Space Particle & Animated Video Camera Background Engine (Light Theme)
 * Renders traveling glowing video cameras, star particles, connecting laser light beams,
 * communication wave ripples, and mouse magnetic attraction.
 */

class SpaceEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.cameraNodes = [];
    this.numParticles = 60;
    this.numCameras = 18;
    this.mouse = { x: -1000, y: -1000, radius: 180 };
    
    this.resize();
    this.init();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth || 1200;
    this.height = window.innerHeight || 800;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  init() {
    this.particles = [];
    this.cameraNodes = [];

    // Ambient Particles for Light Theme
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 1.0,
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        color: i % 2 === 0 ? 'rgba(0, 102, 255, ' : 'rgba(79, 70, 229, '
      });
    }

    // Traveling & Rotating Video Camera Nodes
    for (let i = 0; i < this.numCameras; i++) {
      this.cameraNodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        scale: Math.random() * 0.5 + 0.6,
        glow: Math.random() * 10 + 10,
        pulse: Math.random() * Math.PI * 2,
        color: i % 3 === 0 ? '#0066ff' : i % 3 === 1 ? '#00b4d8' : '#4f46e5'
      });
    }
  }

  drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  drawCameraIcon(ctx, x, y, scale, rotation, color, glowPulse) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.shadowColor = color;
    ctx.shadowBlur = 10 + Math.sin(glowPulse) * 6;
    ctx.fillStyle = color;

    // Body
    this.drawRoundRect(ctx, -12, -8, 16, 14, 3);
    ctx.fill();

    // Lens triangle
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(13, -8);
    ctx.lineTo(13, 6);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

    // Center lens highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Ambient Particles
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += Math.sin(Date.now() * 0.002 + p.pulseSpeed) * 0.01;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse influence
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius && dist > 0) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.x -= (dx / dist) * force * 3;
        p.y -= (dy / dist) * force * 3;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${Math.max(0.15, Math.min(0.6, p.alpha))})`;
      this.ctx.fill();
    }

    // 2. Beams
    for (let i = 0; i < this.cameraNodes.length; i++) {
      for (let j = i + 1; j < this.cameraNodes.length; j++) {
        const c1 = this.cameraNodes[i];
        const c2 = this.cameraNodes[j];
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.3;
          const grad = this.ctx.createLinearGradient(c1.x, c1.y, c2.x, c2.y);
          grad.addColorStop(0, c1.color);
          grad.addColorStop(1, c2.color);

          this.ctx.beginPath();
          this.ctx.moveTo(c1.x, c1.y);
          this.ctx.lineTo(c2.x, c2.y);
          this.ctx.strokeStyle = grad;
          this.ctx.globalAlpha = alpha;
          this.ctx.lineWidth = 1.2;
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
      }
    }

    // 3. Camera Nodes
    for (let c of this.cameraNodes) {
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotSpeed;
      c.pulse += 0.04;

      if (c.x < 20 || c.x > this.width - 20) c.vx *= -1;
      if (c.y < 20 || c.y > this.height - 20) c.vy *= -1;

      // Mouse attraction
      const dx = this.mouse.x - c.x;
      const dy = this.mouse.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius && dist > 0) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        c.x += (dx / dist) * force * 1.5;
        c.y += (dy / dist) * force * 1.5;
      }

      this.drawCameraIcon(this.ctx, c.x, c.y, c.scale, c.rotation, c.color, c.pulse);

      // Communication Wave Rings
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 22 + Math.sin(c.pulse) * 6, 0, Math.PI * 2);
      this.ctx.strokeStyle = c.color;
      this.ctx.globalAlpha = 0.2 + Math.sin(c.pulse) * 0.15;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.SpaceEngine = SpaceEngine;
