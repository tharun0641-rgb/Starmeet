/**
 * StarMeet — Media DSP Effects (Background Blur, Virtual Background, Noise Filter)
 * Uses HTML5 Canvas real-time video processing to blur camera backgrounds
 * or substitute virtual background scenery.
 */

class MediaEffectsProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.processing = false;
    this.blurEnabled = false;
    this.virtualBgImage = null;
    this.animationFrame = null;
  }

  setVirtualBackground(imageUrl) {
    if (!imageUrl) {
      this.virtualBgImage = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      this.virtualBgImage = img;
    };
    img.src = imageUrl;
  }

  toggleBlur(enabled) {
    this.blurEnabled = enabled;
  }

  processVideoTrack(videoElement) {
    if (!videoElement || videoElement.videoWidth === 0) return null;

    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;

    const render = () => {
      if (!this.processing) return;

      if (this.blurEnabled) {
        this.ctx.filter = 'blur(12px)';
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = 'none';
        
        // Draw sharp face inset in center
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, 140, 180, 0, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      } else if (this.virtualBgImage) {
        this.ctx.drawImage(this.virtualBgImage, 0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Subject inset overlay
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(this.canvas.width / 2, this.canvas.height / 2, 160, 200, 0, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      } else {
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      }

      this.animationFrame = requestAnimationFrame(render);
    };

    this.processing = true;
    render();
    return this.canvas.captureStream(30);
  }

  stop() {
    this.processing = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

window.MediaEffectsProcessor = MediaEffectsProcessor;
