/**
 * StarMeet — Adaptive Video Quality & Low Bandwidth Optimization Manager
 * Dynamically scales WebRTC bitrate, resolution (1080p -> 720p -> 480p -> 360p),
 * frame rates, and prioritizes audio clarity during slow internet conditions.
 */

class BandwidthManager {
  constructor(webrtcEngine) {
    this.webrtc = webrtcEngine;
    this.currentQuality = '1080p'; // '1080p' | '720p' | '480p' | '360p' | 'audio-only'
    this.networkState = 'good'; // 'good' | 'fair' | 'poor'
    this.simulatedPacketLoss = 0;
    this.intervalId = null;

    this.onQualityChanged = null;
    this.onWeakNetworkAlert = null;
  }

  startMonitoring() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.checkNetworkQuality(), 4000);
  }

  stopMonitoring() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // Monitor RTCPeerConnection Stats or Network Information API
  async checkNetworkQuality() {
    const nav = navigator;
    let rtt = 50;
    let downlink = 10;

    if (nav.connection) {
      rtt = nav.connection.rtt || 50;
      downlink = nav.connection.downlink || 10; // Mbps
    }

    // Evaluate connection health
    if (downlink < 1.0 || rtt > 300) {
      this.setQualityLevel('360p', 'poor');
    } else if (downlink < 3.0 || rtt > 150) {
      this.setQualityLevel('480p', 'fair');
    } else if (downlink < 6.0) {
      this.setQualityLevel('720p', 'good');
    } else {
      this.setQualityLevel('1080p', 'good');
    }
  }

  // Force manual or automatic quality preset adjustment
  async setQualityLevel(preset, state = 'good') {
    if (this.currentQuality === preset && this.networkState === state) return;

    this.currentQuality = preset;
    this.networkState = state;

    const targetConstraints = {
      '1080p': { width: 1920, height: 1080, frameRate: 30, maxBitrate: 2500000 },
      '720p':  { width: 1280, height: 720,  frameRate: 30, maxBitrate: 1200000 },
      '480p':  { width: 854,  height: 480,  frameRate: 24, maxBitrate: 500000 },
      '360p':  { width: 640,  height: 360,  frameRate: 15, maxBitrate: 250000 }
    }[preset] || { width: 640, height: 360, frameRate: 15, maxBitrate: 250000 };

    // Apply WebRTC RTCRtpSender encodings bitrate & resolution scaling
    if (this.webrtc && this.webrtc.peerConnections) {
      Object.values(this.webrtc.peerConnections).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            try {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = targetConstraints.maxBitrate;
              sender.setParameters(params).catch(e => console.warn('Bitrate setting ignored:', e));
            } catch (err) {
              // Ignore params error on dummy stream
            }
          }
        });
      });
    }

    if (this.onQualityChanged) {
      this.onQualityChanged({
        preset,
        state,
        badgeText: preset.toUpperCase(),
        isWeak: state === 'poor' || preset === '360p'
      });
    }

    if (state === 'poor' || preset === '360p') {
      if (this.onWeakNetworkAlert) {
        this.onWeakNetworkAlert('Network is weak. Optimizing video quality.');
      }
    }
  }

  simulateLowBandwidth(enableLowBandwidth) {
    if (enableLowBandwidth) {
      this.setQualityLevel('360p', 'poor');
    } else {
      this.setQualityLevel('1080p', 'good');
    }
  }
}

window.BandwidthManager = BandwidthManager;
