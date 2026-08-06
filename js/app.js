/**
 * StarMeet — Main Application Controller & View Router
 * Orchestrates Logo rendering, Space Engine background, Auth, WebRTC,
 * Bandwidth Manager, Chat, Reactions, Feedback, and History.
 */

class StarMeetApp {
  constructor() {
    this.auth = new window.AuthManager();
    this.webrtc = new window.WebRTCEngine();
    this.bandwidth = new window.BandwidthManager(this.webrtc);
    this.effects = new window.MediaEffectsProcessor();
    this.chat = new window.ChatEngine('chatMessagesContainer', 'chatUnreadBadge');
    this.reactions = new window.EmojiReactionsEngine('reactionCanvas');
    this.feedback = new window.FeedbackManager();
    this.history = new window.MeetingHistoryManager();

    this.currentMeetingId = null;
    this.isHost = false;
    this.meetingStartTime = null;
    this.timerInterval = null;
    this.selectedRating = 5;

    this.init();
  }

  async init() {
    // 1. Initialize Space Canvas Engine & Logo Renderers
    new window.SpaceEngine('spaceCanvas');
    new window.StarLogoRenderer('logoCanvasAuth');
    new window.StarLogoRenderer('logoCanvasDash');

    // 2. Check Auth State
    if (this.auth.isLoggedIn()) {
      this.showPage('dashboardPage');
      this.updateUserUI();
    } else {
      this.showPage('authPage');
    }

    // 3. Bind Event Listeners
    this.bindAuthEvents();
    this.bindDashboardEvents();
    this.bindMeetingEvents();
    this.bindFeedbackEvents();
    this.bindWebRTCCallbacks();
  }

  // Navigation Router
  showPage(pageId) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
  }

  updateUserUI() {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    document.getElementById('headerUserName').textContent = user.fullName;
    document.getElementById('headerUserAvatar').src = user.avatar;
  }

  // --- Auth Events ---
  bindAuthEvents() {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
    });

    // Avatar File Upload Preview
    const avatarInput = document.getElementById('regAvatarInput');
    const avatarPreview = document.getElementById('regAvatarPreview');
    let uploadedAvatarData = null;

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          uploadedAvatarData = evt.target.result;
          avatarPreview.src = uploadedAvatarData;
        };
        reader.readAsDataURL(file);
      }
    });

    // Login Submission
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('authError');

      try {
        errorEl.style.display = 'none';
        await this.auth.login(email, pass);
        this.updateUserUI();
        this.showPage('dashboardPage');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
    });

    // Registration Submission
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('regFullName').value;
      const email = document.getElementById('regEmail').value;
      const pass = document.getElementById('regPassword').value;
      const passConfirm = document.getElementById('regConfirmPassword').value;
      const errorEl = document.getElementById('authError');

      if (pass !== passConfirm) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.style.display = 'block';
        return;
      }

      try {
        errorEl.style.display = 'none';
        await this.auth.register({
          fullName,
          email,
          password: pass,
          avatarUrl: uploadedAvatarData
        });
        this.updateUserUI();
        this.showPage('dashboardPage');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
    });

    // Google Social Login
    document.getElementById('btnGoogleAuth').addEventListener('click', async () => {
      await this.auth.loginWithGoogle();
      this.updateUserUI();
      this.showPage('dashboardPage');
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
      this.auth.logout();
      this.showPage('authPage');
    });
  }

  // --- Dashboard Events ---
  bindDashboardEvents() {
    const btnCreateMeeting = document.getElementById('btnCreateMeeting');
    const btnJoinMeetingModal = document.getElementById('btnJoinMeetingModal');
    const btnAnalytics = document.getElementById('btnAnalytics');
    const btnHistory = document.getElementById('btnHistory');

    btnCreateMeeting.addEventListener('click', async () => {
      const meetingId = 'SM-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);
      this.startPreMeeting(meetingId, true);
    });

    btnJoinMeetingModal.addEventListener('click', () => {
      document.getElementById('joinMeetingModal').classList.add('active');
    });

    document.getElementById('btnJoinSubmit').addEventListener('click', () => {
      const code = document.getElementById('joinMeetingCodeInput').value.trim();
      if (!code) return alert('Please enter a valid Meeting Code or Link.');
      document.getElementById('joinMeetingModal').classList.remove('active');
      this.startPreMeeting(code, false);
    });

    // Analytics Modal
    btnAnalytics.addEventListener('click', () => {
      this.renderAnalyticsModal();
      document.getElementById('analyticsModal').classList.add('active');
    });

    // History Modal
    btnHistory.addEventListener('click', () => {
      this.renderHistoryModal();
      document.getElementById('historyModal').classList.add('active');
    });

    // Modal Closes
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal-overlay').classList.remove('active');
      });
    });
  }

  // --- Pre-Meeting & Meeting Room Setup ---
  async startPreMeeting(meetingId, isHost) {
    this.currentMeetingId = meetingId;
    this.isHost = isHost;

    const modal = document.getElementById('preMeetingModal');
    document.getElementById('preMeetingIdDisplay').textContent = meetingId;
    
    // Generate QR Code Canvas
    this.generateQrCode('preMeetingQrCanvas', window.location.origin + '?room=' + meetingId);

    modal.classList.add('active');

    // Request permissions and preview local video in modal
    await this.webrtc.initLocalStream('preMeetingLocalVideo');

    document.getElementById('btnEnterMeetingRoom').onclick = () => {
      modal.classList.remove('active');
      this.enterMeetingRoom();
    };
  }

  generateQrCode(canvasId, text) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#070913';
    
    for (let x = 10; x < canvas.width - 10; x += 12) {
      for (let y = 10; y < canvas.height - 10; y += 12) {
        if (Math.random() > 0.4) {
          ctx.fillRect(x, y, 9, 9);
        }
      }
    }
    // Corner finders
    ctx.fillRect(10, 10, 36, 36);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 16, 24, 24);
    ctx.fillStyle = '#070913';
    ctx.fillRect(22, 22, 12, 12);
  }

  enterMeetingRoom() {
    this.showPage('meetingPage');
    document.getElementById('displayMeetingId').textContent = this.currentMeetingId;

    const user = this.auth.getCurrentUser();
    const userName = user ? user.fullName : 'Guest';

    // Set local video stream in room
    const localVid = document.getElementById('localVideoElement');
    if (this.webrtc.localStream && localVid) {
      localVid.srcObject = this.webrtc.localStream;
      localVid.play().catch(e => console.log('Autoplay handled:', e));
    }

    // Connect BroadcastChannel signaling room
    this.webrtc.connectRoom(this.currentMeetingId, userName);

    // Start Bandwidth Monitoring & Timers
    this.bandwidth.startMonitoring();
    this.startMeetingTimer();
  }

  startMeetingTimer() {
    this.meetingStartTime = Date.now();
    const timerEl = document.getElementById('meetingTimerText');
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.meetingStartTime) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  // --- WebRTC & Signal Event Callbacks ---
  bindWebRTCCallbacks() {
    const grid = document.getElementById('videoGridContainer');

    // Handle Incoming WebRTC Signal Messages (Chat & Reactions)
    this.webrtc.onSignalMessage = (data) => {
      if (data.type === 'chat-message') {
        this.chat.addMessage({
          senderName: data.senderName || 'Participant',
          text: data.text,
          isSelf: false
        });
      } else if (data.type === 'reaction') {
        this.reactions.trigger(data.symbol);
      }
    };

    this.webrtc.onRemoteStreamAdded = (peerId, peerName, stream) => {
      let card = document.getElementById(`peer_card_${peerId}`);
      if (!card) {
        card = document.createElement('div');
        card.id = `peer_card_${peerId}`;
        card.className = `video-card peer-${peerId}`;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;
        video.play().catch(e => console.log('Remote video autoplay handled:', e));

        const overlay = document.createElement('div');
        overlay.className = 'video-card-overlay';
        overlay.innerHTML = `<span>${peerName}</span>`;

        card.appendChild(video);
        card.appendChild(overlay);
        grid.appendChild(card);
      }
      this.updateGridColumns();
    };

    this.webrtc.onRemoteStreamRemoved = (peerId) => {
      const card = document.getElementById(`peer_card_${peerId}`);
      if (card) card.remove();
      this.updateGridColumns();
    };

    this.bandwidth.onQualityChanged = (info) => {
      const badge = document.getElementById('qualityBadge');
      badge.textContent = `📶 ${info.badgeText}`;
      if (info.isWeak) {
        badge.classList.add('warning');
      } else {
        badge.classList.remove('warning');
      }
    };

    this.bandwidth.onWeakNetworkAlert = (msg) => {
      const banner = document.getElementById('networkAlertBanner');
      document.getElementById('networkAlertText').textContent = msg;
      banner.style.display = 'flex';
      setTimeout(() => banner.style.display = 'none', 5000);
    };
  }

  updateGridColumns() {
    const grid = document.getElementById('videoGridContainer');
    const count = grid.children.length;
    grid.className = `video-grid-container grid-${Math.min(count, 4)}`;
  }

  // --- Toolbar & Controls Events ---
  bindMeetingEvents() {
    let micOn = true;
    let camOn = true;

    // Mic Toggle
    document.getElementById('btnToggleMic').addEventListener('click', (e) => {
      micOn = !micOn;
      this.webrtc.toggleMic(micOn);
      const btn = e.currentTarget;
      btn.classList.toggle('active-off', !micOn);
      btn.innerHTML = micOn ? '🎙️' : '🔇';
    });

    // Cam Toggle
    document.getElementById('btnToggleCam').addEventListener('click', (e) => {
      camOn = !camOn;
      this.webrtc.toggleCam(camOn);
      const btn = e.currentTarget;
      btn.classList.toggle('active-off', !camOn);
      btn.innerHTML = camOn ? '📹' : '🚫';
    });

    // Screen Share
    document.getElementById('btnScreenShare').addEventListener('click', async () => {
      const screenStream = await this.webrtc.startScreenShare();
      if (screenStream) {
        const localVid = document.getElementById('localVideoElement');
        localVid.srcObject = screenStream;
        localVid.play().catch(e => console.log('Screen share autoplay:', e));
      }
    });

    // Chat Drawer Toggle
    document.getElementById('btnToggleChat').addEventListener('click', () => {
      const drawer = document.getElementById('chatDrawer');
      const isActive = drawer.classList.toggle('active');
      this.chat.setDrawerOpen(isActive);
    });

    document.getElementById('btnCloseChat').addEventListener('click', () => {
      document.getElementById('chatDrawer').classList.remove('active');
      this.chat.setDrawerOpen(false);
    });

    // Chat Sending
    document.getElementById('btnSendChat').addEventListener('click', () => {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      const user = this.auth.getCurrentUser();

      this.chat.addMessage({
        senderName: user ? user.fullName : 'You',
        text,
        isSelf: true
      });

      this.webrtc.sendSignal({
        type: 'chat-message',
        senderName: user ? user.fullName : 'Participant',
        text
      });

      input.value = '';
    });

    // Reaction Popover Toggle & Triggers
    document.getElementById('btnReactions').addEventListener('click', () => {
      document.getElementById('emojiPopover').classList.toggle('active');
    });

    document.querySelectorAll('.emoji-option').forEach(el => {
      el.addEventListener('click', (e) => {
        const symbol = e.target.textContent;
        this.reactions.trigger(symbol);
        this.webrtc.sendSignal({ type: 'reaction', symbol });
        document.getElementById('emojiPopover').classList.remove('active');
      });
    });

    // Low Bandwidth Simulation Toggle
    document.getElementById('btnSimulateWeakNetwork').addEventListener('click', (e) => {
      const isWeak = e.currentTarget.classList.toggle('active-off');
      this.bandwidth.simulateLowBandwidth(isWeak);
    });

    // Leave & End Meeting
    document.getElementById('btnLeaveMeeting').addEventListener('click', () => {
      this.exitMeeting();
    });

    document.getElementById('btnEndMeeting').addEventListener('click', () => {
      this.exitMeeting();
    });
  }

  exitMeeting() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.bandwidth.stopMonitoring();
    this.webrtc.leaveRoom();

    const elapsed = this.meetingStartTime ? Math.round((Date.now() - this.meetingStartTime) / 60000) : 10;
    const user = this.auth.getCurrentUser();

    // Record Meeting History
    this.history.recordMeeting({
      meetingTitle: `Meeting ${this.currentMeetingId}`,
      meetingId: this.currentMeetingId,
      hostName: user ? user.fullName : 'Host',
      duration: `${elapsed || 5} mins`,
      participants: document.getElementById('videoGridContainer').children.length
    });

    // Show Feedback Modal
    this.openFeedbackModal();
  }

  // --- Post-Meeting Feedback Events ---
  bindFeedbackEvents() {
    const stars = document.querySelectorAll('#starRatingPicker .star-icon');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        this.selectedRating = Number(e.target.dataset.val);
        stars.forEach(s => {
          s.classList.toggle('filled', Number(s.dataset.val) <= this.selectedRating);
        });
      });
    });

    document.getElementById('btnSubmitFeedback').addEventListener('click', () => {
      const comment = document.getElementById('feedbackCommentInput').value;
      const user = this.auth.getCurrentUser();
      const userEmail = user ? user.email : 'guest@gmail.com';
      const userName = user ? user.fullName : 'Guest User';

      try {
        this.feedback.submitFeedback({
          meetingId: this.currentMeetingId,
          userEmail,
          userName,
          rating: this.selectedRating,
          comment
        });

        document.getElementById('feedbackModal').classList.remove('active');
        this.showPage('dashboardPage');
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById('btnSkipFeedback').addEventListener('click', () => {
      document.getElementById('feedbackModal').classList.remove('active');
      this.showPage('dashboardPage');
    });
  }

  openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const user = this.auth.getCurrentUser();
    const userEmail = user ? user.email : 'guest@gmail.com';

    if (this.feedback.hasUserSubmitted(this.currentMeetingId, userEmail)) {
      this.showPage('dashboardPage');
      return;
    }

    modal.classList.add('active');
  }

  renderAnalyticsModal() {
    const data = this.feedback.getAnalytics();
    document.getElementById('analyticsAvgRating').textContent = data.avgRating;
    document.getElementById('analyticsTotalCount').textContent = data.totalFeedback;

    for (let i = 1; i <= 5; i++) {
      const count = data.distribution[i] || 0;
      const pct = data.totalFeedback > 0 ? (count / data.totalFeedback) * 100 : 0;
      const fillEl = document.getElementById(`starBarFill${i}`);
      if (fillEl) fillEl.style.width = `${pct}%`;
    }

    const container = document.getElementById('analyticsCommentsFeed');
    if (data.recentComments.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">No reviews yet.</div>`;
    } else {
      container.innerHTML = data.recentComments.map(c => `
        <div style="padding:12px; background:rgba(255,255,255,0.04); border-radius:8px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
            <strong style="color:var(--primary-cyan);">${c.userName}</strong>
            <span style="color:var(--accent-amber);">★ ${c.rating}/5</span>
          </div>
          <div style="font-size:14px;">"${c.comment}"</div>
        </div>
      `).join('');
    }
  }

  renderHistoryModal() {
    const historyList = this.history.getHistory();
    const container = document.getElementById('historyTableBody');
    if (historyList.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No past meetings.</td></tr>`;
      return;
    }

    container.innerHTML = historyList.map(h => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding:12px;"><strong>${h.meetingTitle}</strong><br/><small style="color:var(--text-muted);">${h.meetingId}</small></td>
        <td style="padding:12px;">${h.hostName}</td>
        <td style="padding:12px;">${new Date(h.date).toLocaleDateString()}</td>
        <td style="padding:12px;">${h.duration}</td>
        <td style="padding:12px; color:var(--accent-amber);">★ ${h.rating}/5</td>
      </tr>
    `).join('');
  }
}

window.StarMeetApp = StarMeetApp;

window.addEventListener('DOMContentLoaded', () => {
  window.starMeetApp = new StarMeetApp();
});
