/**
 * StarMeet — Authentication & User Management Engine
 * Provides SHA-256 Web Crypto hashing, user registration with profile avatar,
 * persistent session management via JWT simulation in LocalStorage.
 */

class AuthManager {
  constructor() {
    this.currentUserKey = 'starmeet_current_user';
    this.usersKey = 'starmeet_registered_users';
    this.initDefaultUser();
  }

  // Pre-seed a default demo user if empty
  async initDefaultUser() {
    const existing = localStorage.getItem(this.usersKey);
    if (!existing) {
      const defaultHash = await this.hashPassword('Password123!');
      const defaultUser = {
        fullName: 'Alex Vance',
        email: 'alex@gmail.com',
        passwordHash: defaultHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(this.usersKey, JSON.stringify([defaultUser]));
    }
  }

  // Web Crypto SHA-256 Password Hashing with fallback
  async hashPassword(password) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('WebCrypto not available, using fallback hash:', e);
    }
    // Simple fallback string hash
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash);
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(this.currentUserKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Register New User
  async register({ fullName, email, password, avatarUrl }) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(password);
    const avatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`;

    const newUser = {
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      avatar,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    // Auto login
    this.createSession(newUser);
    return newUser;
  }

  // Login Existing User
  async login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const inputHash = await this.hashPassword(password);
    if (inputHash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    user.lastLogin = new Date().toISOString();
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    this.createSession(user);
    return user;
  }

  // Simulated Google Social Login
  async loginWithGoogle() {
    const googleUser = {
      fullName: 'Google User',
      email: 'user.google@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const users = this.getUsers();
    if (!users.some(u => u.email === googleUser.email)) {
      users.push(googleUser);
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    this.createSession(googleUser);
    return googleUser;
  }

  createSession(user) {
    // Generate simulated JWT Token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: user.email, name: user.fullName, exp: Date.now() + 86400000 }));
    const signature = btoa('starmeet_secret_signature');
    const token = `${header}.${payload}.${signature}`;

    const sessionData = {
      ...user,
      token
    };

    localStorage.setItem(this.currentUserKey, JSON.stringify(sessionData));
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }
}

window.AuthManager = AuthManager;
