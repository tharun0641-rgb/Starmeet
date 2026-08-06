/**
 * StarMeet — Post-Meeting Feedback & Analytics Dashboard Engine
 * Handles 5-star ratings, review comments, duplicate submission prevention per meeting/user,
 * and renders live analytics metrics (average score, star distribution, recent feedback list).
 */

class FeedbackManager {
  constructor() {
    this.storageKey = 'starmeet_meeting_feedbacks';
  }

  getFeedbacks() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  hasUserSubmitted(meetingId, userEmail) {
    const feedbacks = this.getFeedbacks();
    return feedbacks.some(f => f.meetingId === meetingId && f.userEmail.toLowerCase() === userEmail.toLowerCase());
  }

  submitFeedback({ meetingId, userEmail, userName, rating, comment }) {
    if (this.hasUserSubmitted(meetingId, userEmail)) {
      throw new Error('You have already submitted feedback for this meeting.');
    }

    const feedbackItem = {
      id: 'fb_' + Date.now(),
      meetingId,
      userEmail: userEmail.toLowerCase(),
      userName,
      rating: Number(rating),
      comment: comment ? comment.trim() : '',
      timestamp: new Date().toISOString()
    };

    const list = this.getFeedbacks();
    list.push(feedbackItem);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return feedbackItem;
  }

  getAnalytics() {
    const feedbacks = this.getFeedbacks();
    if (feedbacks.length === 0) {
      return {
        avgRating: 0,
        totalFeedback: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentComments: []
      };
    }

    const totalFeedback = feedbacks.length;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = (sum / totalFeedback).toFixed(1);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => {
      if (distribution[f.rating] !== undefined) {
        distribution[f.rating]++;
      }
    });

    const recentComments = [...feedbacks]
      .filter(f => f.comment && f.comment.length > 0)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return {
      avgRating,
      totalFeedback,
      distribution,
      recentComments
    };
  }
}

window.FeedbackManager = FeedbackManager;
