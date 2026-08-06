# StarMeet — Next-Generation AI Video Conferencing Platform

A futuristic, production-ready video conferencing web app built with pure HTML5, CSS3, and JavaScript. Features WebRTC peer-to-peer video calls, animated space background, real-time chat, emoji reactions, feedback analytics, and meeting history.

## Features

- 🎥 **WebRTC Video Conferencing** — Real peer-to-peer camera/mic streaming
- 🌌 **Animated Space Background** — Dynamic particle & camera engine
- 🔐 **Authentication** — Register/Login with SHA-256 password hashing
- 💬 **Live Chat** — Real-time in-meeting text chat
- 😃 **Emoji Reactions** — Floating animated emoji reactions
- 📊 **Analytics Dashboard** — Star rating distribution and meeting quality metrics
- 📜 **Meeting History** — Full log of past meetings
- 📶 **Adaptive Bandwidth** — Auto-adjusts video quality for slow connections
- 🎨 **White/Light Theme** — Clean, modern premium design

## Live Demo

Deployed on Render: [https://starmeet.onrender.com](https://starmeet.onrender.com)

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **WebRTC**: Browser-native RTCPeerConnection + BroadcastChannel signaling
- **Storage**: LocalStorage (client-side authentication & data)
- **Deployment**: Render Static Sites + GitHub

## Local Development

```bash
# Option 1: Python HTTP Server
python server.py

# Option 2: Any static server
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000)

## Deployment

This project is configured for **Render Static Site** deployment via `render.yaml`.

### Steps to Deploy on Render:
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Static Site
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` and deploys
5. Your site is live at `https://your-site-name.onrender.com`

## Demo Credentials

- **Email**: `alex@gmail.com`
- **Password**: `Password123!`

Or register a new account — data is stored in your browser's LocalStorage.

## Project Structure

```
project_video/
├── index.html          # Main app (single-page application)
├── css/
│   └── styles.css      # Design system (white theme, glassmorphism)
├── js/
│   ├── app.js          # Main controller & view router
│   ├── auth.js         # Authentication & user management
│   ├── webrtc.js       # WebRTC engine & media permissions
│   ├── bandwidth.js    # Adaptive video quality manager
│   ├── chat.js         # Live in-meeting chat
│   ├── reactions.js    # Floating emoji reactions
│   ├── feedback.js     # Post-meeting star rating feedback
│   ├── history.js      # Meeting history manager
│   ├── logo.js         # Animated star-camera logo
│   ├── mediaEffects.js # Background blur & noise suppression
│   └── spaceEngine.js  # Animated background canvas engine
├── render.yaml         # Render deployment configuration
└── server.py           # Local Python dev server
```
