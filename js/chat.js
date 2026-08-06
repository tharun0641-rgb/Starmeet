/**
 * StarMeet — Live Meeting Chat Engine
 * Handles text messages, emojis, images, file attachments, typing indicators,
 * timestamps, and unread notification badges.
 */

class ChatEngine {
  constructor(containerId, unreadBadgeId) {
    this.container = document.getElementById(containerId);
    this.unreadBadge = document.getElementById(unreadBadgeId);
    this.messages = [];
    this.unreadCount = 0;
    this.isDrawerOpen = false;

    this.onNewMessage = null;
  }

  setDrawerOpen(isOpen) {
    this.isDrawerOpen = isOpen;
    if (isOpen) {
      this.unreadCount = 0;
      this.updateUnreadBadge();
    }
  }

  updateUnreadBadge() {
    if (!this.unreadBadge) return;
    if (this.unreadCount > 0 && !this.isDrawerOpen) {
      this.unreadBadge.style.display = 'block';
      this.unreadBadge.textContent = this.unreadCount;
    } else {
      this.unreadBadge.style.display = 'none';
    }
  }

  addMessage({ senderName, text, isSelf, image = null, file = null }) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: 'msg_' + Date.now(),
      senderName,
      text,
      isSelf,
      image,
      file,
      timestamp
    };

    this.messages.push(msg);

    if (!isSelf && !this.isDrawerOpen) {
      this.unreadCount++;
      this.updateUnreadBadge();
    }

    this.renderMessage(msg);
  }

  renderMessage(msg) {
    if (!this.container) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${msg.isSelf ? 'self' : 'other'}`;

    let contentHtml = '';
    if (msg.text) {
      contentHtml += `<div>${this.escapeHtml(msg.text)}</div>`;
    }
    if (msg.image) {
      contentHtml += `<img src="${msg.image}" class="msg-image" alt="Attachment" />`;
    }
    if (msg.file) {
      contentHtml += `<div style="margin-top:4px;"><a href="${msg.file.url}" download="${msg.file.name}" style="color:var(--primary-cyan); text-decoration:underline;">📎 ${msg.file.name}</a></div>`;
    }

    msgEl.innerHTML = `
      <div class="msg-sender">${this.escapeHtml(msg.senderName)} • ${msg.timestamp}</div>
      <div class="msg-bubble">${contentHtml}</div>
    `;

    this.container.appendChild(msgEl);
    this.container.scrollTop = this.container.scrollHeight;
  }

  showTypingIndicator(senderName) {
    const existing = document.getElementById('typingIndicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.style.fontSize = '12px';
    indicator.style.color = 'var(--primary-cyan)';
    indicator.style.padding = '4px 8px';
    indicator.style.fontStyle = 'italic';
    indicator.textContent = `${senderName} is typing...`;

    this.container.appendChild(indicator);
    this.container.scrollTop = this.container.scrollHeight;

    setTimeout(() => {
      if (indicator.parentNode) indicator.remove();
    }, 2500);
  }

  escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  clear() {
    this.messages = [];
    if (this.container) this.container.innerHTML = '';
    this.unreadCount = 0;
    this.updateUnreadBadge();
  }
}

window.ChatEngine = ChatEngine;
