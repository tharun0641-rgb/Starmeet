/**
 * StarMeet — WebRTC Engine & Media Permissions Handler
 * Manages camera/microphone access, handles permission denial gracefully,
 * and handles WebRTC RTCPeerConnection peer-to-peer streaming.
 */

class WebRTCEngine {
  constructor() {
    this.localStream = null;
    this.screenStream = null;
    this.peerConnections = {}; // peerId -> RTCPeerConnection
    this.channel = null;
    this.meetingId = null;
    this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    this.userName = 'Participant';
    this.cameraDenied = false;

    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onSignalMessage = null;
    this.onCameraPermissionState = null;

    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  // Request Camera & Microphone permissions & local stream
  async initLocalStream(videoContainerId) {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        this.cameraDenied = false;
        if (this.onCameraPermissionState) this.onCameraPermissionState(true);
      } else {
        throw new Error('getUserMedia not supported in this environment');
      }

      if (videoContainerId) {
        const localVideoEl = document.getElementById(videoContainerId);
        if (localVideoEl) {
          localVideoEl.srcObject = this.localStream;
          localVideoEl.play().catch(e => console.log('Autoplay handled:', e));
        }
      }

      return this.localStream;
    } catch (err) {
      console.warn('Camera/Microphone permission denied or not available:', err);
      this.cameraDenied = true;
      if (this.onCameraPermissionState) this.onCameraPermissionState(false);

      // Create clean fallback stream indicating permission denied
      this.localStream = this.createDummyStream(true);

      if (videoContainerId) {
        const localVideoEl = document.getElementById(videoContainerId);
        if (localVideoEl) {
          localVideoEl.srcObject = this.localStream;
          localVideoEl.play().catch(e => console.log('Autoplay handled:', e));
        }
      }

      return this.localStream;
    }
  }

  createDummyStream(isDenied = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    const drawFallback = () => {
      // Clean high-contrast card background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 640, 480);

      // Card border
      ctx.strokeStyle = isDenied ? '#f43f5e' : '#0066ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 620, 460);

      // Icon & Message
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isDenied) {
        ctx.font = '48px sans-serif';
        ctx.fillText('📷🚫', 320, 180);

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.fillText('Camera Access Not Allowed', 320, 240);

        ctx.fillStyle = '#475569';
        ctx.font = '15px Outfit, sans-serif';
        ctx.fillText('Please allow camera & microphone permissions in your browser', 320, 280);
        ctx.fillText('address bar to enable your video feed.', 320, 305);
      } else {
        ctx.font = '48px sans-serif';
        ctx.fillText('📹', 320, 180);

        ctx.fillStyle = '#0066ff';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.fillText('Camera Feed Paused', 320, 240);

        ctx.fillStyle = '#475569';
        ctx.font = '15px Outfit, sans-serif';
        ctx.fillText(`User ID: ${this.userId.substr(0, 8)}`, 320, 280);
      }
    };

    drawFallback();
    setInterval(drawFallback, 500);

    const stream = canvas.captureStream(10);
    return stream;
  }

  // Start Meeting BroadcastChannel Signaling
  connectRoom(meetingId, userName) {
    this.meetingId = meetingId;
    this.userName = userName || 'Participant';

    if (this.channel) this.channel.close();
    this.channel = new BroadcastChannel(`starmeet_room_${meetingId}`);

    this.channel.onmessage = async (event) => {
      const data = event.data;
      if (!data || data.senderId === this.userId) return;

      if (this.onSignalMessage) {
        this.onSignalMessage(data);
      }

      switch (data.type) {
        case 'user-joined':
          this.sendSignal({ type: 'room-presence', targetId: data.senderId, userName: this.userName });
          await this.initiateOffer(data.senderId, data.userName);
          break;
        case 'room-presence':
          break;
        case 'offer':
          if (data.targetId && data.targetId !== this.userId) return;
          await this.handleOffer(data.senderId, data.offer, data.userName);
          break;
        case 'answer':
          if (data.targetId && data.targetId !== this.userId) return;
          await this.handleAnswer(data.senderId, data.answer);
          break;
        case 'ice-candidate':
          if (data.targetId && data.targetId !== this.userId) return;
          await this.handleIceCandidate(data.senderId, data.candidate);
          break;
        case 'user-left':
          this.handleUserLeft(data.senderId);
          break;
      }
    };

    this.sendSignal({ type: 'user-joined', senderId: this.userId, userName: this.userName });
  }

  sendSignal(data) {
    if (this.channel) {
      this.channel.postMessage({ ...data, senderId: this.userId });
    }
  }

  async createPeerConnection(peerId, peerName) {
    if (this.peerConnections[peerId]) return this.peerConnections[peerId];

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections[peerId] = pc;

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (this.onRemoteStreamAdded) {
        this.onRemoteStreamAdded(peerId, peerName, event.streams[0]);
      }
    };

    return pc;
  }

  async initiateOffer(peerId, peerName) {
    const pc = await this.createPeerConnection(peerId, peerName);
    if (pc.signalingState !== 'stable') return;
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      targetId: peerId,
      offer: offer,
      userName: this.userName
    });
  }

  async handleOffer(peerId, offer, peerName) {
    const pc = await this.createPeerConnection(peerId, peerName);
    if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      targetId: peerId,
      answer: answer
    });
  }

  async handleAnswer(peerId, answer) {
    const pc = this.peerConnections[peerId];
    if (pc && pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(peerId, candidate) {
    const pc = this.peerConnections[peerId];
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('ICE candidate error:', e);
      }
    }
  }

  handleUserLeft(peerId) {
    if (this.peerConnections[peerId]) {
      this.peerConnections[peerId].close();
      delete this.peerConnections[peerId];
    }
    if (this.onRemoteStreamRemoved) {
      this.onRemoteStreamRemoved(peerId);
    }
  }

  toggleMic(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleCam(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async startScreenShare() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        return this.screenStream;
      }
    } catch (e) {
      console.warn('Screen share cancelled or failed:', e);
    }
    return null;
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  leaveRoom() {
    this.sendSignal({ type: 'user-left', senderId: this.userId });
    if (this.channel) this.channel.close();
    
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.peerConnections = {};

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

window.WebRTCEngine = WebRTCEngine;
