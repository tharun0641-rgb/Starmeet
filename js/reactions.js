/**
 * StarMeet — Floating Emoji Reactions Physics Engine
 * Animates floating emoji particles (👍 ❤️ 👏 😂 😮 🎉 🙌) floating upward
 * across the screen with rotational oscillation and smooth opacity fadeout.
 */

class EmojiReactionsEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.width = window.innerWidth || 1200;
    this.height = window.innerHeight || 800;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  trigger(emojiSymbol) {
    const startX = this.width / 2 + (Math.random() - 0.5) * 400;
    const startY = this.height - 100;

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        emoji: emojiSymbol,
        x: startX + (Math.random() - 0.5) * 60,
        y: startY + Math.random() * 40,
        vy: -(Math.random() * 3 + 2.5),
        vx: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 18 + 28,
        alpha: 1.0,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        oscillation: Math.random() * Math.PI * 2
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.oscillation) * 1.2;
      p.oscillation += 0.05;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0 || p.y < 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.alpha;
      this.ctx.font = `${p.size}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.emoji, 0, 0);
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.EmojiReactionsEngine = EmojiReactionsEngine;
