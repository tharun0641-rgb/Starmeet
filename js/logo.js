/**
 * StarMeet — Application Logo Renderer
 * Animates a 5-point glowing star with a prominent video camera symbol centered in the middle
 * and pulsing communication radio waves.
 */

class StarLogoRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationFrame = null;
    this.angle = 0;
    this.pulse = 0;
    
    this.width = this.canvas.clientWidth || parseInt(this.canvas.getAttribute('width')) || 90;
    this.height = this.canvas.clientHeight || parseInt(this.canvas.getAttribute('height')) || 90;
    this.canvas.width = this.width * (window.devicePixelRatio || 2);
    this.canvas.height = this.height * (window.devicePixelRatio || 2);
    this.ctx.scale(window.devicePixelRatio || 2, window.devicePixelRatio || 2);

    this.start();
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
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

  render() {
    if (this.width === 0 && this.canvas.clientWidth > 0) {
      this.width = this.canvas.clientWidth;
      this.height = this.canvas.clientHeight;
      this.canvas.width = this.width * (window.devicePixelRatio || 2);
      this.canvas.height = this.height * (window.devicePixelRatio || 2);
      this.ctx.scale(window.devicePixelRatio || 2, window.devicePixelRatio || 2);
    }

    this.ctx.clearRect(0, 0, this.width || 90, this.height || 90);
    const cx = (this.width || 90) / 2;
    const cy = (this.height || 90) / 2;
    this.angle += 0.015;
    this.pulse += 0.04;
    const scalePulse = 1 + Math.sin(this.pulse) * 0.05;

    // 1. Outer Wave Communication Rings
    const waveRadius1 = (28 + (Math.sin(this.pulse * 0.8) + 1) * 8);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, waveRadius1, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(0, 102, 255, ${0.2 + Math.sin(this.pulse) * 0.1})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 2. 5-Point Star Body
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scalePulse, scalePulse);
    this.ctx.translate(-cx, -cy);

    const grad = this.ctx.createLinearGradient(cx - 30, cy - 30, cx + 30, cy + 30);
    grad.addColorStop(0, '#0066ff');
    grad.addColorStop(0.5, '#00b4d8');
    grad.addColorStop(1, '#4f46e5');

    this.ctx.shadowColor = 'rgba(0, 102, 255, 0.45)';
    this.ctx.shadowBlur = 16 + Math.sin(this.pulse) * 6;
    this.ctx.fillStyle = grad;

    this.drawStar(cx, cy, 5, 34, 17);
    this.ctx.fill();

    // 3. Video Camera Symbol Centered in the Middle of the Star
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';

    // Camera Main Body (Rect with rounded corners)
    const camW = 18;
    const camH = 13;
    const camX = cx - 11;
    const camY = cy - 6.5;
    this.drawRoundRect(this.ctx, camX, camY, camW, camH, 3.5);
    this.ctx.fill();

    // Camera Lens Triangle / Cone attached to the right of the body
    this.ctx.beginPath();
    this.ctx.moveTo(cx + 7, cy - 3.5);
    this.ctx.lineTo(cx + 14, cy - 7);
    this.ctx.lineTo(cx + 14, cy + 7);
    this.ctx.lineTo(cx + 7, cy + 3.5);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner Camera Lens Aperture Dot in Electric Blue
    this.ctx.fillStyle = '#0066ff';
    this.ctx.beginPath();
    this.ctx.arc(cx - 2, cy, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  start() {
    this.render();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

window.StarLogoRenderer = StarLogoRenderer;
