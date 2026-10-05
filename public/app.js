// ─── DOM Elements ──────────────────────────────────────────
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');
const headerLogoutBtn = document.getElementById('headerLogoutBtn');

// Screens
const phoneSection = document.getElementById('phoneSection');
const pairingSection = document.getElementById('pairingSection');
const qrSection = document.getElementById('qrSection');
const connectedSection = document.getElementById('connectedSection');
const disconnectedSection = document.getElementById('disconnectedSection');

// Phone Form
const phoneForm = document.getElementById('phoneForm');
const phoneInput = document.getElementById('phoneInput');
const getPairingBtn = document.getElementById('getPairingBtn');
const startQrBtn = document.getElementById('startQrBtn');
const phoneError = document.getElementById('phoneError');

// Pairing Code Screen
const pairingCodeDisplay = document.getElementById('pairingCodeDisplay');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const copyBtnText = document.getElementById('copyBtnText');
const pairingTimerSec = document.getElementById('pairingTimerSec');
const pairingProgress = document.getElementById('pairingProgress');
const cancelPairingBtn = document.getElementById('cancelPairingBtn');

// QR Code Screen
const qrDisplay = document.getElementById('qrDisplay');
const qrTimerSec = document.getElementById('qrTimerSec');
const qrProgress = document.getElementById('qrProgress');
const cancelQrBtn = document.getElementById('cancelQrBtn');

// Connected Stats
const statName = document.getElementById('statName');
const statNumber = document.getElementById('statNumber');
const statPrefix = document.getElementById('statPrefix');
const statCommands = document.getElementById('statCommands');
const statUptime = document.getElementById('statUptime');

// Accounts Bar
const accountsList = document.getElementById('accountsList');
const addAccountBtn = document.getElementById('addAccountBtn');

// Logout
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

// ─── Authentication & Login Gate ─────────────────────────
const authGate = document.getElementById('authGate');
const dashboardApp = document.getElementById('dashboardApp');
const authLoginForm = document.getElementById('authLoginForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authErrorMsg = document.getElementById('authErrorMsg');
const authThemeToggleBtn = document.getElementById('authThemeToggleBtn');
const dashLogoutBtn = document.getElementById('dashLogoutBtn');

let isAuthenticated = false;

function showAuthGate() {
  isAuthenticated = false;
  if (authGate) authGate.classList.remove('hidden');
  if (dashboardApp) dashboardApp.classList.add('hidden');
}

function showDashboard() {
  isAuthenticated = true;
  if (authGate) authGate.classList.add('hidden');
  if (dashboardApp) dashboardApp.classList.remove('hidden');
}

function showAuthError(msg) {
  if (authErrorMsg) {
    authErrorMsg.textContent = msg;
    authErrorMsg.classList.remove('hidden');
  }
}

function hideAuthError() {
  if (authErrorMsg) {
    authErrorMsg.textContent = '';
    authErrorMsg.classList.add('hidden');
  }
}

// Intercept window.fetch to automatically include Bearer token & handle 401
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  config = config || {};
  config.headers = config.headers || {};

  const token = localStorage.getItem('wa_dash_token');
  if (token) {
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      config.headers.push(['Authorization', `Bearer ${token}`]);
    } else {
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const response = await originalFetch(resource, config);
  const url = typeof resource === 'string' ? resource : (resource?.url || '');
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('wa_dash_token');
    showAuthGate();
  }
  return response;
};

// Toggle Password Visibility
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
if (togglePasswordBtn && authPassword) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = authPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    authPassword.setAttribute('type', type);
    
    // Toggle icon
    if (type === 'text') {
      togglePasswordBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      togglePasswordBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  });
}

// Handle Login Form Submission
if (authLoginForm) {
  authLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = authUsername ? authUsername.value.trim() : '';
    const password = authPassword ? authPassword.value : '';

    if (!username || !password) {
      showAuthError('Please enter both username and password.');
      return;
    }

    if (authSubmitBtn) {
      authSubmitBtn.disabled = true;
      authSubmitBtn.innerHTML = '<span>Signing In...</span>';
    }
    hideAuthError();

    try {
      const res = await originalFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('wa_dash_token', data.token);
        showDashboard();
        checkStatus();
        fetchLiveLogs(true);
      } else {
        showAuthError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      showAuthError('Connection error: ' + err.message);
    } finally {
      if (authSubmitBtn) {
        authSubmitBtn.disabled = false;
        authSubmitBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          <span>Sign In</span>
        `;
      }
    }
  });
}

// Dashboard Header Logout (Sign Out of Dashboard)
if (dashLogoutBtn) {
  dashLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('wa_dash_token');
    showAuthGate();
  });
}

// Verify saved token on initial load
async function initAuth() {
  const token = localStorage.getItem('wa_dash_token');
  if (!token) {
    showAuthGate();
    return;
  }
  try {
    const res = await originalFetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        showDashboard();
        checkStatus();
        fetchLiveLogs(true);
        return;
      }
    }
  } catch (err) {
    console.error('Failed to verify token:', err);
  }
  localStorage.removeItem('wa_dash_token');
  showAuthGate();
}

// ─── Theme Switcher (Dark / Light) ─────────────────────────
const themeToggleBtn = document.getElementById('themeToggleBtn');
const savedTheme = localStorage.getItem('wa_bot_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('wa_bot_theme', nextTheme);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}
if (authThemeToggleBtn) {
  authThemeToggleBtn.addEventListener('click', toggleTheme);
}

// ─── State Variables ───────────────────────────────────────
let activeSection = phoneSection;
let countdownInterval = null;
let currentCountdown = 60;
const TOTAL_TIMEOUT = 60; // 60 seconds
let isRequesting = false;
let isLoggingOut = false;
let currentQrDataUrl = null;
let rawPairingCode = '';
let currentSessionId = 'primary';
let allSessions = [];

const cleanInactiveBtn = document.getElementById('cleanInactiveBtn');

// ─── Accounts Bar Rendering ───────────────────────────────
function renderAccountsBar(sessions) {
  if (!accountsList) return;
  accountsList.innerHTML = '';

  // Show "Clean Inactive" button if there are unconnected extra accounts
  const inactiveCount = sessions.filter(s => s.id !== 'primary' && s.state !== 'connected').length;
  if (cleanInactiveBtn) {
    if (inactiveCount > 0) {
      cleanInactiveBtn.classList.remove('hidden');
      const textSpan = cleanInactiveBtn.querySelector('span');
      if (textSpan) textSpan.textContent = `Clean (${inactiveCount})`;
    } else {
      cleanInactiveBtn.classList.add('hidden');
    }
  }

  sessions.forEach(s => {
    const pill = document.createElement('div');
    const isActive = s.id === currentSessionId;
    pill.className = `account-pill ${isActive ? 'active' : ''}`;
    
    let dotClass = 'offline';
    if (s.state === 'connected') dotClass = 'online';
    else if (['starting', 'pairing_code', 'qr'].includes(s.state)) dotClass = 'pairing';
    
    const displayName = s.user?.name || s.name || s.id;
    const phoneShort = s.user?.number ? ` (+${s.user.number})` : '';

    pill.innerHTML = `
      <span class="pill-dot ${dotClass}"></span>
      <span class="pill-name" title="${displayName}">${displayName}${phoneShort}</span>
      <button class="pill-delete-btn" type="button" title="Delete account" onclick="window.deleteAccount('${s.id}', event)">✕</button>
    `;

    pill.addEventListener('click', (e) => {
      if (e.target.closest('.pill-delete-btn')) return;
      switchSession(s.id);
    });

    accountsList.appendChild(pill);
  });
}

function switchSession(sessionId) {
  if (currentSessionId === sessionId) return;
  currentSessionId = sessionId;
  stopCountdown();
  rawPairingCode = '';
  currentQrDataUrl = null;
  phoneInput.value = '';
  clearPhoneError();
  checkStatus();
}

window.deleteAccount = async function(sessionId, event) {
  if (event) event.stopPropagation();

  const session = allSessions.find(s => s.id === sessionId);
  const name = session?.user?.name || session?.name || sessionId;

  if (session?.state === 'connected') {
    if (!confirm(`Are you sure you want to disconnect and delete account "${name}"?`)) {
      return;
    }
  }

  try {
    await fetch(`/api/sessions/${sessionId}/delete`, { method: 'POST' });
    
    // If the deleted session was currently selected, pick another session
    if (currentSessionId === sessionId) {
      const remaining = allSessions.filter(s => s.id !== sessionId);
      const connected = remaining.find(s => s.state === 'connected');
      currentSessionId = connected ? connected.id : (remaining[0]?.id || 'primary');
    }

    await checkStatus();
  } catch (err) {
    alert('Failed to delete account: ' + err.message);
  }
};

window.cleanInactiveAccounts = async function() {
  if (cleanInactiveBtn) cleanInactiveBtn.disabled = true;
  try {
    const res = await fetch('/api/sessions/clear-inactive', { method: 'POST' });
    const data = await res.json();
    console.log(`Cleaned up ${data.deletedCount} accounts.`);
    
    // If current session was deleted, switch to primary or first available
    const remaining = allSessions.filter(s => s.state === 'connected' || s.id === 'primary');
    if (!remaining.some(s => s.id === currentSessionId)) {
      currentSessionId = remaining[0]?.id || 'primary';
    }
    await checkStatus();
  } catch (err) {
    alert('Error cleaning inactive accounts: ' + err.message);
  } finally {
    if (cleanInactiveBtn) cleanInactiveBtn.disabled = false;
  }
};

window.createNewAccount = async function() {
  const btn = document.getElementById('addAccountBtn');
  try {
    if (btn) btn.disabled = true;
    const res = await fetch('/api/sessions/create', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (data.success && data.session) {
      currentSessionId = data.session.id;
      showSection(phoneSection);
      setStatus('loading', 'Ready to Link');
      phoneInput.value = '';
      clearPhoneError();
      await checkStatus();
    }
  } catch (err) {
    alert('Error adding account: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

if (addAccountBtn) {
  addAccountBtn.addEventListener('click', window.createNewAccount);
}

// ─── Helpers ───────────────────────────────────────────────
function setStatus(type, text) {
  statusPill.className = 'status-pill';
  if (type === 'online') {
    statusPill.classList.add('status-online');
  } else if (type === 'offline') {
    statusPill.classList.add('status-offline');
  } else {
    statusPill.classList.add('status-loading');
  }
  statusText.textContent = text;
}

function showSection(section) {
  if (activeSection === section) return;
  [phoneSection, pairingSection, qrSection, connectedSection, disconnectedSection].forEach(s => {
    s.classList.add('hidden');
  });
  section.classList.remove('hidden');
  activeSection = section;

  if (section === connectedSection) {
    headerLogoutBtn.classList.remove('hidden');
  } else {
    headerLogoutBtn.classList.add('hidden');
  }
}

function showPhoneError(msg) {
  phoneError.textContent = msg;
  phoneError.classList.remove('hidden');
}

function clearPhoneError() {
  phoneError.textContent = '';
  phoneError.classList.add('hidden');
}

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

// ─── 60-Second Countdown Timer ────────────────────────────
function startCountdown(type) {
  stopCountdown();
  currentCountdown = TOTAL_TIMEOUT;

  function updateUi() {
    const percent = Math.max(0, (currentCountdown / TOTAL_TIMEOUT) * 100);
    if (type === 'pairing') {
      pairingTimerSec.textContent = `${currentCountdown}s`;
      pairingProgress.style.width = `${percent}%`;
    } else if (type === 'qr') {
      qrTimerSec.textContent = `${currentCountdown}s`;
      qrProgress.style.width = `${percent}%`;
    }
  }

  updateUi();

  countdownInterval = setInterval(async () => {
    currentCountdown--;
    updateUi();

    if (currentCountdown <= 0) {
      stopCountdown();
      console.log('⏰ Auth session timed out after 60s. Returning to phone input...');
      await cancelAuth();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function cancelAuth() {
  stopCountdown();
  try {
    await fetch(`/api/sessions/${currentSessionId}/auth/cancel`, { method: 'POST' });
  } catch (_) {}
  showSection(phoneSection);
  setStatus('loading', 'Ready');
}

// ─── Phone Form: Request Pairing Code ─────────────────────
phoneForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearPhoneError();

  const num = phoneInput.value.trim().replace(/[^0-9]/g, '');
  if (!num || num.length < 8) {
    showPhoneError('Please enter a valid phone number with your country code (e.g. 923321234567).');
    return;
  }

  isRequesting = true;
  getPairingBtn.disabled = true;
  getPairingBtn.innerHTML = `<span>Requesting Code...</span>`;
  setStatus('loading', 'Connecting...');

  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/auth/pairing-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: num })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to get pairing code');
    }

    if (data.pairingCode) {
      rawPairingCode = data.pairingCode;
      const formatted = data.pairingCode.length === 8 
        ? `${data.pairingCode.slice(0, 4)} - ${data.pairingCode.slice(4)}`
        : data.pairingCode;
      pairingCodeDisplay.textContent = formatted;
      showSection(pairingSection);
      setStatus('loading', 'Enter Code');
      startCountdown('pairing');
    }
  } catch (err) {
    showPhoneError(err.message);
    setStatus('loading', 'Ready');
  } finally {
    isRequesting = false;
    getPairingBtn.disabled = false;
    getPairingBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <span>Get 8-Digit Pairing Code</span>
    `;
  }
});

// ─── Copy Pairing Code to Clipboard ───────────────────────
copyCodeBtn.addEventListener('click', async () => {
  if (!rawPairingCode) return;
  try {
    await navigator.clipboard.writeText(rawPairingCode.replace(/[^a-zA-Z0-9]/g, ''));
    copyBtnText.textContent = 'Copied! ✓';
    copyCodeBtn.style.background = 'rgba(37, 211, 102, 0.35)';
    setTimeout(() => {
      copyBtnText.textContent = 'Copy Code';
      copyCodeBtn.style.background = '';
    }, 2500);
  } catch (err) {
    const input = document.createElement('input');
    input.value = rawPairingCode.replace(/[^a-zA-Z0-9]/g, '');
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    copyBtnText.textContent = 'Copied! ✓';
    setTimeout(() => {
      copyBtnText.textContent = 'Copy Code';
    }, 2500);
  }
});

cancelPairingBtn.addEventListener('click', cancelAuth);

// ─── QR Code Flow ─────────────────────────────────────────
startQrBtn.addEventListener('click', async () => {
  clearPhoneError();
  startQrBtn.disabled = true;
  startQrBtn.innerHTML = `<span>Starting QR...</span>`;
  setStatus('loading', 'Generating QR...');

  try {
    showSection(qrSection);
    qrDisplay.innerHTML = `
      <div class="qr-spinner"></div>
      <p class="qr-loading-text">Generating QR code...</p>
    `;
    startCountdown('qr');

    const res = await fetch(`/api/sessions/${currentSessionId}/auth/start-qr`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to start QR code');
    }

    if (data.qrDataUrl) {
      currentQrDataUrl = data.qrDataUrl;
      qrDisplay.innerHTML = `<img src="${data.qrDataUrl}" alt="WhatsApp Login QR Code" />`;
      setStatus('loading', 'Scan QR Code');
    }
  } catch (err) {
    showPhoneError(err.message);
    showSection(phoneSection);
    stopCountdown();
  } finally {
    startQrBtn.disabled = false;
    startQrBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      <span>Scan with QR Code</span>
    `;
  }
});

cancelQrBtn.addEventListener('click', cancelAuth);

// ─── Status Polling ───────────────────────────────────────
async function checkStatus() {
  if (!isAuthenticated || isLoggingOut || isRequesting) return;

  try {
    const res = await fetch('/api/sessions', { cache: 'no-store' });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    allSessions = data.sessions || [];

    renderAccountsBar(allSessions);

    let current = allSessions.find(s => s.id === currentSessionId);
    if (!current && allSessions.length > 0) {
      current = allSessions[0];
      currentSessionId = current.id;
    }

    if (!current) return;

    if (current.state === 'connected') {
      stopCountdown();
      setStatus('online', `Active: ${current.user?.name || current.name}`);
      showSection(connectedSection);

      statName.textContent = current.user?.name || current.name || 'WhatsApp User';
      statNumber.textContent = current.user?.number ? `+${current.user.number}` : 'Connected';
      if (statPrefix) statPrefix.textContent = current.prefix || '.';
      if (statCommands) statCommands.textContent = `${current.commandsCount || 12} loaded`;
      statUptime.textContent = formatUptime(current.uptime);

      const termPrompt = document.querySelector('.term-prompt');
      if (termPrompt) {
        const displayNum = current.user?.number || (current.id === 'primary' ? 'bot' : current.id);
        termPrompt.textContent = `xortlogix@${displayNum}:~$`;
      }
    } 
    else if (current.state === 'pairing_code') {
      if (activeSection !== pairingSection) {
        showSection(pairingSection);
        startCountdown('pairing');
      }
      if (current.pairingCode && current.pairingCode !== rawPairingCode) {
        rawPairingCode = current.pairingCode;
        const formatted = current.pairingCode.length === 8 
          ? `${current.pairingCode.slice(0, 4)} - ${current.pairingCode.slice(4)}`
          : current.pairingCode;
        pairingCodeDisplay.textContent = formatted;
      }
      setStatus('loading', 'Enter Code');
    }
    else if (current.state === 'qr') {
      if (activeSection !== qrSection) {
        showSection(qrSection);
        startCountdown('qr');
      }
      if (current.qrDataUrl && current.qrDataUrl !== currentQrDataUrl) {
        currentQrDataUrl = current.qrDataUrl;
        qrDisplay.innerHTML = `<img src="${current.qrDataUrl}" alt="WhatsApp Login QR Code" />`;
      }
      setStatus('loading', 'Scan QR Code');
    }
    else if (current.state === 'idle') {
      if (activeSection !== phoneSection) {
        stopCountdown();
        showSection(phoneSection);
      }
      setStatus('loading', 'Ready to Link');
    }
    else if (current.state === 'disconnected') {
      stopCountdown();
      showSection(disconnectedSection);
      setStatus('offline', 'Disconnected');
    }
  } catch (err) {
    setStatus('offline', 'Server Offline');
  }
}

// ─── Logout Handlers ──────────────────────────────────────
function openLogoutModal() {
  logoutModal.classList.remove('hidden');
}

function closeLogoutModal() {
  logoutModal.classList.add('hidden');
}

if (logoutBtn) logoutBtn.addEventListener('click', openLogoutModal);
if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', openLogoutModal);
if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeLogoutModal);

logoutModal.addEventListener('click', (e) => {
  if (e.target === logoutModal) closeLogoutModal();
});

confirmLogoutBtn.addEventListener('click', async () => {
  isLoggingOut = true;
  confirmLogoutBtn.disabled = true;
  confirmLogoutBtn.innerHTML = `<span>Unlinking...</span>`;

  try {
    setStatus('loading', 'Logging out...');
    await fetch(`/api/sessions/${currentSessionId}/logout`, { method: 'POST' });
    closeLogoutModal();

    rawPairingCode = '';
    currentQrDataUrl = null;
    phoneInput.value = '';
    showSection(phoneSection);
    setStatus('loading', 'Ready');

    setTimeout(() => {
      isLoggingOut = false;
      confirmLogoutBtn.disabled = false;
      confirmLogoutBtn.innerHTML = `<span>Yes, Log Out</span>`;
      checkStatus();
    }, 1200);
  } catch (err) {
    alert('Failed to log out: ' + err.message);
    isLoggingOut = false;
    confirmLogoutBtn.disabled = false;
    confirmLogoutBtn.innerHTML = `<span>Yes, Log Out</span>`;
    closeLogoutModal();
  }
});

// Start authentication verification and interval polling
initAuth();
setInterval(() => {
  if (isAuthenticated) checkStatus();
}, 2000);

// ─── Interactive Web Terminal / Live Logs Portal ────────────
const terminalBody = document.getElementById('terminalBody');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');
const terminalTabCmd = document.getElementById('terminalTabCmd');
const terminalTabLogs = document.getElementById('terminalTabLogs');
const terminalClearBtn = document.getElementById('terminalClearBtn');
const terminalToggleCollapseBtn = document.getElementById('terminalToggleCollapseBtn');
const terminalCard = document.querySelector('.terminal-card');

if (terminalToggleCollapseBtn && terminalCard) {
  terminalToggleCollapseBtn.addEventListener('click', () => {
    terminalCard.classList.toggle('collapsed');
  });
}

let activeTerminalTab = 'cmd'; // 'cmd' | 'logs'
let commandHistory = [];
let historyIndex = -1;
let lastLogCount = 0;

function appendTerminalLine(text, className = '') {
  if (!terminalBody) return;
  const line = document.createElement('div');
  line.className = `term-line ${className}`;
  line.textContent = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

async function clearTerminal() {
  if (!terminalBody) return;
  terminalBody.innerHTML = '';
  lastLogCount = 0;

  if (activeTerminalTab === 'cmd') {
    appendTerminalLine('Xortlogix Bot Terminal [Web Console v1.0]', 'term-system');
    appendTerminalLine('Type "help" for commands, "status" for stats, or click Live Logs.', 'term-dim');
    appendTerminalLine('────────────────────────────────────────────────────────────────', 'term-dim');
  } else if (activeTerminalTab === 'logs') {
    terminalBody.innerHTML = '<div class="term-line term-dim">Logs cleared. Waiting for new events...</div>';
    try {
      await fetch('/api/terminal/logs/clear', { method: 'POST' });
    } catch (_) {}
  }
}

if (terminalClearBtn) {
  terminalClearBtn.addEventListener('click', clearTerminal);
}

if (terminalTabCmd && terminalTabLogs && terminalForm) {
  terminalTabCmd.addEventListener('click', () => {
    activeTerminalTab = 'cmd';
    terminalTabCmd.classList.add('active');
    terminalTabLogs.classList.remove('active');
    terminalForm.style.display = 'flex';
    clearTerminal();
  });

  terminalTabLogs.addEventListener('click', () => {
    activeTerminalTab = 'logs';
    terminalTabLogs.classList.add('active');
    terminalTabCmd.classList.remove('active');
    terminalForm.style.display = 'none';
    if (terminalBody) {
      terminalBody.innerHTML = '<div class="term-line term-dim">Streaming live container logs...</div>';
    }
    fetchLiveLogs(true);
  });
}

// Arrow Up / Down History Navigation
if (terminalInput) {
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        terminalInput.value = '';
      }
    }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.insertTerminalCmd = function(cmd) {
  if (terminalInput) {
    terminalInput.value = cmd;
    terminalInput.focus();
    if (terminalCard) {
      terminalCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};

// Execute Command Form Submit
if (terminalForm && terminalInput) {
  terminalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cmd = terminalInput.value.trim();
    if (!cmd) return;

    // Save to history
    commandHistory.push(cmd);
    historyIndex = -1;
    terminalInput.value = '';

    // Render user command
    const userLine = document.createElement('div');
    userLine.className = 'term-line term-user-cmd';
    userLine.innerHTML = `<span class="term-green">xortlogix@bot:~$</span> <strong>${escapeHtml(cmd)}</strong>`;
    if (terminalBody) {
      terminalBody.appendChild(userLine);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();

      if (data.clear) {
        clearTerminal();
        return;
      }

      if (data.output && terminalBody) {
        const outputLine = document.createElement('div');
        outputLine.className = 'term-line term-output';
        outputLine.textContent = data.output;
        terminalBody.appendChild(outputLine);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
    } catch (err) {
      appendTerminalLine(`Error: ${err.message}`, 'term-error');
    }
  });
}

// Live Logs Polling
async function fetchLiveLogs(forceRerender = false) {
  if (!isAuthenticated || activeTerminalTab !== 'logs' || !terminalBody) return;

  try {
    const res = await fetch('/api/terminal/logs', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const logs = data.logs || [];

    if (forceRerender || logs.length !== lastLogCount) {
      lastLogCount = logs.length;
      terminalBody.innerHTML = '';
      if (logs.length === 0) {
        terminalBody.innerHTML = '<div class="term-line term-dim">No logs recorded yet.</div>';
        return;
      }
      logs.slice(-100).forEach(log => {
        const line = document.createElement('div');
        const colorClass = log.type === 'error' ? 'term-error' :
                           log.type === 'warn' ? 'term-warn' :
                           log.type === 'command' ? 'term-cyan' : 'term-output';
        line.className = `term-line ${colorClass}`;
        line.innerHTML = `<span class="term-dim">[${log.time}]</span> ${escapeHtml(log.text)}`;
        terminalBody.appendChild(line);
      });
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  } catch (_) {}
}

setInterval(() => {
  if (isAuthenticated && activeTerminalTab === 'logs') fetchLiveLogs(false);
}, 2500);

