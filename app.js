// --- DOM Elements ---
const authBox = document.getElementById('authBox');
const studioBox = document.getElementById('studioBox');
const paymentBox = document.getElementById('paymentBox');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuth = document.getElementById('toggleAuth');
const signUpFields = document.getElementById('signUpFields');

const displayName = document.getElementById('displayName');
const displayPronouns = document.getElementById('displayPronouns');
const tierBadge = document.getElementById('tierBadge');
const trialCountdown = document.getElementById('trialCountdown');
const logoutBtn = document.getElementById('logoutBtn');

const videoCanvas = document.getElementById('videoCanvas');
const videoElement = document.getElementById('webcam');
const subtitleElement = document.getElementById('subtitles');

// Master Security Passcode for Staff Registration
const TEACHER_SECRET = "bambooteacher15";

let isSignUpMode = false;
let currentUser = null;

// --- 1. Registration, Login & Passcode Logic ---

toggleAuth.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  authTitle.innerText = isSignUpMode ? "Sign Up & Start 30-Day Trial" : "Sign In";
  authSubmitBtn.innerText = isSignUpMode ? "Create Account" : "Log In";
  toggleAuth.innerText = isSignUpMode ? "Already have an account? Log in" : "Need an account? Sign up";
  signUpFields.style.display = isSignUpMode ? "block" : "none";
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (isSignUpMode) {
    if (localStorage.getItem('bamboo_user_' + username)) {
      alert("Username already taken! Please choose another.");
      return;
    }

    const teacherCodeEntered = document.getElementById('teacherCode').value.trim();
    let assignedTier = document.getElementById('planTier').value;

    // Verify Teacher Access Passcode
    if (teacherCodeEntered.length > 0) {
      if (teacherCodeEntered === TEACHER_SECRET) {
        assignedTier = "teacher";
      } else {
        alert("Invalid Teacher Passcode. Registered as standard student.");
      }
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 Days

    currentUser = {
      username: username,
      password: password,
      prefName: document.getElementById('prefName').value.trim() || username,
      pronouns: document.getElementById('pronouns').value.trim() || "they/them",
      age: document.getElementById('age').value || 18,
      tier: assignedTier,
      signUpDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      isPaid: false
    };

    localStorage.setItem('bamboo_user_' + username, JSON.stringify(currentUser));
    localStorage.setItem('bamboo_active_session', username);
    checkTrialAndRoute(currentUser);

  } else {
    const storedData = localStorage.getItem('bamboo_user_' + username);

    if (!storedData) {
      alert("User not found. Please sign up first!");
      return;
    }

    const userData = JSON.parse(storedData);
    if (userData.password !== password) {
      alert("Incorrect password.");
      return;
    }

    currentUser = userData;
    localStorage.setItem('bamboo_active_session', username);
    checkTrialAndRoute(currentUser);
  }
});

// --- 2. Trial Period & Payment Gate Routing ---

function checkTrialAndRoute(user) {
  authBox.style.display = 'none';

  // Teachers skip trial limits
  if (user.tier === 'teacher' || user.isPaid) {
    loadStudioUI(user);
    return;
  }

  const now = new Date();
  const trialExpiration = new Date(user.trialEndDate);

  if (now > trialExpiration && user.tier !== 'visitor') {
    // Trial expired -> show Plan Payment Gate
    paymentBox.style.display = 'block';
    studioBox.style.display = 'none';
  } else {
    // Active trial
    const daysLeft = Math.ceil((trialExpiration - now) / (1000 * 60 * 60 * 24));
    trialCountdown.innerText = `30-Day Free Trial: ${daysLeft} days remaining`;
    loadStudioUI(user);
  }
}

function selectPlanPayment(selectedTier) {
  currentUser.tier = selectedTier;
  currentUser.isPaid = true; // Mark account as active paid plan

  localStorage.setItem('bamboo_user_' + currentUser.username, JSON.stringify(currentUser));
  alert(`Plan updated to ${selectedTier}! Routing to Studio...`);

  paymentBox.style.display = 'none';
  loadStudioUI(currentUser);
}

function loadStudioUI(user) {
  displayName.innerText = user.prefName;
  displayPronouns.innerText = `(${user.pronouns})`;
  tierBadge.innerText = user.tier.replace('_', ' ');
  tierBadge.className = `badge badge-${user.tier}`;

  studioBox.style.display = 'flex';
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('bamboo_active_session');
  studioBox.style.display = 'none';
  paymentBox.style.display = 'none';
  authBox.style.display = 'block';
  authForm.reset();
});

// Auto-login on reload
window.addEventListener('DOMContentLoaded', () => {
  const activeUser = localStorage.getItem('bamboo_active_session');
  if (activeUser) {
    const storedData = localStorage.getItem('bamboo_user_' + activeUser);
    if (storedData) {
      currentUser = JSON.parse(storedData);
      checkTrialAndRoute(currentUser);
    }
  }
});

// --- 3. Room Access & Video Camera Functions ---

function tryJoinRoom(roomId) {
  if (currentUser.tier === 'visitor' && roomId === 'group') {
    alert("Visitor tier provides access to Solo Practice rooms and resources only.");
    return;
  }
  alert(`Joining ${roomId} studio...`);
  videoCanvas.style.display = 'block';
}
