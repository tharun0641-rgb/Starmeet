/**
 * StarMeet — User Profile & Meeting History Manager
 * Tracks previous video meetings with meeting title, ID, host, date, duration,
 * participant count, and provides search and filter capabilities.
 */

class MeetingHistoryManager {
  constructor() {
    this.storageKey = 'starmeet_meeting_history';
    this.initDefaultHistory();
  }

  initDefaultHistory() {
    if (!localStorage.getItem(this.storageKey)) {
      const demoHistory = [
        {
          id: 'hist_1',
          meetingTitle: 'AI Architecture & Roadmap Sync',
          meetingId: 'SM-892-410',
          hostName: 'Alex Vance',
          date: new Date(Date.now() - 86400000).toISOString(),
          duration: '42 mins',
          participants: 6,
          rating: 5
        },
        {
          id: 'hist_2',
          meetingTitle: 'WebRTC Low Bandwidth Performance Test',
          meetingId: 'SM-104-992',
          hostName: 'Sarah Connor',
          date: new Date(Date.now() - 172800000).toISOString(),
          duration: '28 mins',
          participants: 4,
          rating: 4
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(demoHistory));
    }
  }

  getHistory() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  recordMeeting({ meetingTitle, meetingId, hostName, duration, participants, rating = 5 }) {
    const history = this.getHistory();
    const entry = {
      id: 'hist_' + Date.now(),
      meetingTitle: meetingTitle || `Meeting ${meetingId}`,
      meetingId,
      hostName,
      date: new Date().toISOString(),
      duration: duration || '15 mins',
      participants: participants || 1,
      rating
    };

    history.unshift(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
    return entry;
  }

  searchHistory(query = '') {
    const list = this.getHistory();
    if (!query || query.trim() === '') return list;

    const q = query.toLowerCase().trim();
    return list.filter(item =>
      item.meetingTitle.toLowerCase().includes(q) ||
      item.meetingId.toLowerCase().includes(q) ||
      item.hostName.toLowerCase().includes(q)
    );
  }
}

window.MeetingHistoryManager = MeetingHistoryManager;
