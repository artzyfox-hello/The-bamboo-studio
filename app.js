// --- DOM Elements ---
const authBox = document.getElementById('authBox');
const studioBox = document.getElementById('studioBox');
const scheduleBox = document.getElementById('scheduleBox');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuth = document.getElementById('toggleAuth');
const signUpFields = document.getElementById('signUpFields');

const displayName = document.getElementById('displayName');
const displayPronouns = document.getElementById('displayPronouns');
const tierBadge = document.getElementById('tierBadge');
const logoutBtn = document.getElementById('logoutBtn');

const videoCanvas = document.getElementById('videoCanvas');
const videoElement = document.getElementById('webcam');
const subtitleElement = document.getElementById('subtitles');
const startCamBtn = document.getElementById('startCamBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');

const lessonCodeInput = document.getElementById('lessonCodeInput');
const joinLessonBtn = document.getElementById('joinLessonBtn');

let isSignUpMode = false;
let currentUser = null;
let cameraStream = null;

// Mock Schedule Database for Lesson Codes
const scheduledLessons = {
  "LESSON-101": { isOpen: true, title: "Beginner D-Key Dizi Basics", scheduledTime: "Live Now" },
  "LESSON-102": { isOpen: false, title: "Jianpu Sight-Reading Workshop", scheduledTime: "4:00 PM CDT" }
};

// Mock Room Capacity Trackers
const roomState = {
  solo: { name: "Solo Practice", maxCapacity: 1, currentCount: 0, type: "solo" },
  group: { name: "Group Studio", maxCapacity: 5, currentCount: 4, type: "group" }
};

// --- 1. Toggle & Auth Form Handler ---

toggleAuth.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  authTitle.innerText = isSignUpMode ? "Sign Up & Create Profile" : "Sign In";
  authSubmitBtn.innerText = isSignUpMode ? "Create Account & Enter" : "Log In";
  toggleAuth.innerText = isSignUpMode ? "Already have an account? Log in" : "Need an account? Sign up";
  signUpFields.style.display = isSignUpMode ? "block" : "none";
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (isSignUpMode) {
    // Check if user already exists
    if (localStorage.getItem('bamboo_user_' + username)) {
      alert("Username already exists! Please choose another or log in.");
      return;
    }

    currentUser = {
      username: username,
      password: password,
      prefName: document.getElementById('prefName').value.trim() || username,
      pronouns: document.getElementById('pronouns').value.trim() || "they/them",
      age: document.getElementById('age').value || 18,
      tier: document.getElementById('planTier').value
    };

    localStorage.setItem('bamboo_user_' + username, JSON.stringify(currentUser));
    localStorage.setItem('bamboo_active_session', username);
    loadProfileUI(currentUser);

  } else {
    // Log In existing user
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
    loadProfileUI(currentUser);
  }
});

function loadProfileUI(user) {
  displayName.innerText = user.prefName;
  displayPronouns.innerText = `(${user.pronouns})`;
  tierBadge.innerText = user.tier.replace('_', ' ');
  tierBadge.className = `badge badge-${user.tier}`;

  authBox.style.display = 'none';
  scheduleBox.style.display = 'none';
  studioBox.style.display = 'flex';
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('bamboo_active_session');
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
  studioBox.style.display = 'none';
  authBox.style.display = 'block';
  authForm.reset();
});

// Auto-login on page load if session exists
window.addEventListener('DOMContentLoaded', () => {
  const activeUser = localStorage.getItem('bamboo_active_session');
  if (activeUser) {
    const storedData = localStorage.getItem('bamboo_user_' + activeUser);
    if (storedData) {
      currentUser = JSON.parse(storedData);
      loadProfileUI(currentUser);
    }
  }
});

// --- 2. Meeting Room Access & Capacity Enforcement ---

function tryJoinRoom(roomId) {
  const room = roomState[roomId];

  if (!currentUser) return alert("Please log in first.");

  // Visitor Tier Restriction: Cannot join group rooms
  if (currentUser.tier === 'visitor' && room.type === 'group') {
    alert("Visitor tier gives access to Solo Practice rooms and resources only. Upgrade your tier to join Group classes!");
    return;
  }

  // Capacity Limit Check
  if (room.currentCount >= room.maxCapacity) {
    alert(`The ${room.name} is full! Maximum capacity is ${room.maxCapacity} participant(s).`);
    return;
  }

  alert(`Joining ${room.name}...`);
  videoCanvas.style.display = 'block';
  startCamera();
}

// --- 3. Lesson Code & Scheduled Waiting Room Gate ---

joinLessonBtn.addEventListener('click', () => {
  const code = lessonCodeInput.value.trim().toUpperCase();
  const lesson = scheduledLessons[code];

  if (!lesson) {
    alert("Lesson code not found. Please check your code!");
    return;
  }

  if (lesson.isOpen) {
    alert(`Joining ${lesson.title}!`);
    videoCanvas.style.display = 'block';
    startCamera();
  } else {
    // Show Schedule Waiting Room
    studioBox.style.display = 'none';
    document.getElementById('scheduleTitle').innerText = lesson.title;
    document.getElementById('scheduleTime').innerText = `Scheduled Time: ${lesson.scheduledTime}`;
    scheduleBox.style.display = 'block';
  }
});

function backToStudio() {
  scheduleBox.style.display = 'none';
  studioBox.style.display = 'flex';
}

// --- 4. Camera, Screen Share & Subtitles ---

startCamBtn.addEventListener('click', startCamera);

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });
    videoElement.srcObject = cameraStream;
    await videoElement.play();
    videoCanvas.style.display = 'block';
    subtitleElement.innerText = "Camera active! Listening...";
    startSpeech();
  } catch (err) {
    alert("Camera/Mic error: " + err.message);
  }
}

function startSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    subtitleElement.innerText = "Camera connected! (Speech recognition not available)";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    subtitleElement.innerText = transcript;
  };

  recognition.start();
}

shareScreenBtn.addEventListener('click', async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    videoElement.srcObject = screenStream;
    await videoElement.play();
    subtitleElement.innerText = "Sharing screen...";

    screenStream.getVideoTracks()[0].onended = () => {
      if (cameraStream) {
        videoElement.srcObject = cameraStream;
        subtitleElement.innerText = "Returned to webcam feed.";
      }
    };
  } catch (err) {
    console.error("Screen share canceled:", err);
  }
});
