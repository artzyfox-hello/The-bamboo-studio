const videoElement = document.getElementById('webcam');
const subtitleElement = document.getElementById('subtitles');
const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoElement.srcObject = stream;
    subtitleElement.innerText = "Camera active. Speak to test subtitles...";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
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
    } else {
      subtitleElement.innerText = "Speech recognition not supported on this browser.";
    }
  } catch (err) {
    alert("Please allow camera and microphone access!");
    console.error(err);
  }
});
