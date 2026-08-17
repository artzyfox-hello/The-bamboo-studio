// DOM Elements
const authBox = document.getElementById('authBox');
const studioBox = document.getElementById('studioBox');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const userDisplay = document.getElementById('userDisplay');
const logoutBtn = document.getElementById('logoutBtn');

const videoElement = document.getElementById('webcam');
const subtitleElement = document.getElementById('subtitles');
const startBtn = document.getElementById('startBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');

let cameraStream = null;
let isSignUp = false;

// --- 1. Authentication Logic ---

toggleAuthMode.addEventListener('click', () => {
  isSignUp = !isSignUp;
  authTitle.innerText = isSignUp ? 'Create Account' : 'Sign In';
  authSubmitBtn.innerText = isSignUp ? 'Sign Up' : 'Log In';
  toggleAuthMode.innerText = isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up';
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!user || !pass) return;

  const storedUser = localStorage.getItem('bamboo_user_' + user);

  if (isSignUp) {
    if (storedUser) {
      alert('Username already exists. Please pick another or log in.');
      return;
    }
    localStorage.setItem('bamboo_user_' + user, JSON.stringify({ password: pass }));
    alert('Account created successfully! Logging you in...');
    loginUser(user);
  } else {
    if (!storedUser) {
      alert('User not found. Please sign up first.');
      return;
    }
    const userData = JSON.parse(storedUser);
    if (userData.password !== pass) {
      alert('Incorrect password.');
      return;
    }
    loginUser(user);
  }
});

function loginUser(username) {
  localStorage.setItem('bamboo_active_session', username);
  userDisplay.innerText = username;
  authBox.style.display = 'none';
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
  const activeSession = localStorage.getItem('bamboo_active_session');
  if (activeSession) {
    loginUser(activeSession);
  }
});

// --- 2. Camera & Speech Recognition ---

startBtn.addEventListener('click', async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });
    videoElement.srcObject = cameraStream;
    await videoElement.play();
    subtitleElement.innerText = "Camera active! Listening...";

    startSpeechRecognition();
  } catch (err) {
    alert("Error accessing camera/mic: " + err.message);
  }
});

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    subtitleElement.innerText = "Speech recognition is not supported in this browser.";
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

// --- 3. Screen Sharing Logic ---

shareScreenBtn.addEventListener('click', async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    // Swap webcam stream with screen share stream
    videoElement.srcObject = screenStream;
    await videoElement.play();
    subtitleElement.innerText = "Sharing screen...";

    // Handle user stopping screen share via browser bar
    screenStream.getVideoTracks()[0].onended = () => {
      if (cameraStream) {
        videoElement.srcObject = cameraStream;
        subtitleElement.innerText = "Returned to camera feed.";
      }
    };
  } catch (err) {
    console.error("Screen share canceled or error:", err);
  }
});
