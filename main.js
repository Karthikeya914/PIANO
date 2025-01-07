const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const keys = document.querySelectorAll('.key');
const noteDisplay = document.getElementById('noteDisplay');
const instrumentSelect = document.getElementById('instrument');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');

let isRecording = false;
let recording = [];
let startTime;

const oscillators = {};

function createOscillator(frequency) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = instrumentSelect.value;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

  return { oscillator, gainNode };
}

function getNoteFrequency(note) {
  const baseFrequencies = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
    'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30,
    'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  const noteWithoutOctave = note.replace(/[0-9]/g, '');
  const octave = parseInt(note.match(/[0-9]/)[0]);
  const baseFreq = baseFrequencies[noteWithoutOctave];

  return baseFreq * Math.pow(2, octave - 4);
}

function animateNote(note) {
  noteDisplay.textContent = note;
  noteDisplay.classList.remove('note-animation');
  void noteDisplay.offsetWidth; // Trigger reflow
  noteDisplay.classList.add('note-animation');
}

function playNote(key) {
  const note = key.dataset.note;
  const frequency = getNoteFrequency(note);

  if (oscillators[note]) {
    return;
  }

  const { oscillator, gainNode } = createOscillator(frequency);
  oscillators[note] = { oscillator, gainNode };

  oscillator.start();
  key.classList.add('active');
  animateNote(note);

  // Add ripple effect
  const ripple = document.createElement('div');
  ripple.classList.add('ripple');
  key.appendChild(ripple);
  setTimeout(() => {
    if (ripple.parentElement) {
      ripple.remove();
    }
  }, 1000);

  if (isRecording) {
    recording.push({
      note,
      time: Date.now() - startTime
    });
  }
}

function stopNote(key) {
  const note = key.dataset.note;
  if (!oscillators[note]) return;

  const { gainNode } = oscillators[note];
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  setTimeout(() => {
    oscillators[note].oscillator.stop();
    oscillators[note].oscillator.disconnect();
    oscillators[note].gainNode.disconnect();
    delete oscillators[note];
  }, 100);

  key.classList.remove('active');
}

keys.forEach(key => {
  key.addEventListener('mousedown', () => playNote(key));
  key.addEventListener('mouseup', () => stopNote(key));
  key.addEventListener('mouseleave', () => stopNote(key));
});

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
  if (key) playNote(key);
});

document.addEventListener('keyup', (e) => {
  const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
  if (key) stopNote(key);
});

recordBtn.addEventListener('click', () => {
  if (!isRecording) {
    isRecording = true;
    recording = [];
    startTime = Date.now();
    recordBtn.textContent = 'Stop Recording';
    recordBtn.style.background = '#ff4444';
    playBtn.disabled = true;
  } else {
    isRecording = false;
    recordBtn.textContent = 'Record';
    recordBtn.style.background = '';
    playBtn.disabled = false;
  }
});

playBtn.addEventListener('click', () => {
  playBtn.disabled = true;
  recordBtn.disabled = true;

  recording.forEach(note => {
    setTimeout(() => {
      const key = document.querySelector(`[data-note="${note.note}"]`);
      playNote(key);
      setTimeout(() => stopNote(key), 200);
    }, note.time);
  });

  const playbackDuration = recording[recording.length - 1]?.time + 300 || 0;
  setTimeout(() => {
    playBtn.disabled = false;
    recordBtn.disabled = false;
  }, playbackDuration);
});

instrumentSelect.addEventListener('change', () => {
  keys.forEach(key => stopNote(key));
});

// Add hover effect for keys
keys.forEach(key => {
  key.addEventListener('mouseenter', () => {
    if (!key.classList.contains('active')) {
      key.style.transform = 'translateY(-2px)';
      key.style.boxShadow = key.classList.contains('black') 
        ? '0 4px 10px rgba(0,0,0,0.5)'
        : '0 4px 8px rgba(0,0,0,0.2)';
    }
  });

  key.addEventListener('mouseleave', () => {
    if (!key.classList.contains('active')) {
      key.style.transform = '';
      key.style.boxShadow = '';
    }
  });
});
