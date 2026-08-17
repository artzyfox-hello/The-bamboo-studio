const videoElement = document.getElementById('webcam');
const subtitleElement = document.getElementById('subtitles');
const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', async () => {
  // 1. Check if button click is firing
  subtitleElement.innerText = "Requesting camera access...";

  try {
    // 2. Request Camera & Mic
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });

    videoElement.srcObject = stream;
    
    // Explicitly play video for Safari/iPad support
    await videoElement.play();
    
    subtitleElement.innerText = "Camera active! Initializing speech recognition...";

    // 3. Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      subtitleElement.innerText = "Camera works! Note: Web Speech API is not supported in this browser version. Try Chrome or Safari settings.";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      subtitleElement.innerText = "Listening... Speak into your mic.";
    };

    recognition.onerror = (event) => {
      subtitleElement.innerText = "Speech Error: " + event.error;
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      subtitleElement.innerText = transcript;
    };

    recognition.start();

  } catch (err) {
    alert("Error accessing camera/mic: " + err.message);
    subtitleElement.innerText = "Permission denied or camera error.";
    console.error(err);
  }
});
