// --- Terminal Text Animation ---

const targetText = "I'm so confused by your ridiculous meltdown that I must insist on some sort of explanation for your behavior towards me. It just doesn't make any sense. There's no way that I deserved the treatment you gave me without an explanation or an apology for how out of line you have been."
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const terminalText = document.getElementById("terminal-text");
let display = Array.from(targetText);

// Returns a random character from the chars string
let shockwaveActive = false; // Add this at the top if not present

let letterOffsets = new Array(targetText.length).fill(0); // X offset
let letterYOffset = new Array(targetText.length).fill(0); // Y offset
function randomChar() {
  return chars[Math.floor(Math.random() * chars.length)];
}
function renderText() {
  terminalText.innerHTML = '';
  for (let i = 0; i < display.length; i++) {
    const span = document.createElement('span');
    span.textContent = display[i];
    span.style.display = 'inline-block';
    span.style.transform = `translateX(${letterOffsets[i]}px) translateY(${letterYOffset[i]}px)`;
    if (display[i] === ' ') {
      span.style.minWidth = '0.7em';
    }
    terminalText.appendChild(span);
  }
}

function glitchShockwave(event) {

  renderText();

  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const spans = terminalText.querySelectorAll('span');
  for (let i = 0; i < spans.length; i++) {
  display[i] = targetText[i];
  letterOffsets[i] = 0;
  letterYOffset[i] = 0;
}
  let finishedCount = 0;

  // Store per-letter animation state
  const animStates = Array.from({ length: spans.length }, () => ({
    phase: 'out', t: 0, t2: 0, done: false
  }));
  for (let i = 0; i < spans.length; i++) {
  animStates[i].phase = 'out';
  animStates[i].t = 0;
  animStates[i].t2 = 0;
  animStates[i].done = false;
  animStates[i].delayFrames = 0;
  animStates[i].glitchFrames = 0;
  animStates[i].maxGlitch = 18 + Math.floor(Math.random() * 4);
  animStates[i].glitching = true;
}

  // Precompute all delays and directions
  const delays = [];
  const dirs = [];
  const maxOffsets = [];
  for (let i = 0; i < spans.length; i++) {
    const rect = spans[i].getBoundingClientRect();
    const letterX = rect.left + rect.width / 2;
    const letterY = rect.top + rect.height / 2;
    const dx = letterX - mouseX;
    const dy = letterY - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const frameDuration = 1000 / 60; // 60fps
    delays[i] = Math.round((dist * 1.1) / frameDuration); // delay in frames
    const mag = dist || 1;
    dirs[i] = { x: dx / mag, y: dy / mag };
    maxOffsets[i] = 40 - Math.min(dist / 3, 20); // Lowered for performance
  }

  const outFrames = 4;
  const inFrames = 6;
for (let i = 0; i < spans.length; i++) {
  animStates[i].glitchFrames = 0;
  animStates[i].maxGlitch = 8 + Math.floor(Math.random() * 4);
  animStates[i].glitching = true;
}
  // Animate all letters in a single frame loop
   function animateLetters() {
    let allDone = true;
    const now = performance.now();
    for (let i = 0; i < spans.length; i++) {
      if (animStates[i].done) continue;
      if (animStates[i].delayFrames === undefined) animStates[i].delayFrames = 0;
      if (animStates[i].delayFrames < delays[i]) {
          animStates[i].delayFrames++;
          allDone = false;
          continue;
}
if (animStates[i].glitching) {
  if (animStates[i].glitchFrames < animStates[i].maxGlitch) {
    const original = targetText[i];
    if (/[A-Za-z0-9]/.test(original)) {
      display[i] = randomChar();
    } else {
      display[i] = original;
    }
    animStates[i].glitchFrames++;
  } else {
    display[i] = targetText[i];
    animStates[i].glitching = false;
  }
}
      // Letter is animating
      allDone = false;
      if (animStates[i].phase === 'out') {
        const t = animStates[i].t++;
        if (t <= outFrames) {
          letterOffsets[i] = dirs[i].x * maxOffsets[i] * Math.sin((Math.PI / 2) * (t / outFrames));
          letterYOffset[i] = dirs[i].y * maxOffsets[i] * Math.sin((Math.PI / 2) * (t / outFrames));
        } else {
          animStates[i].phase = 'in';
        }
      }
      if (animStates[i].phase === 'in') {
        const t2 = animStates[i].t2++;
        if (t2 <= inFrames) {
          letterOffsets[i] = dirs[i].x * maxOffsets[i] * Math.cos((Math.PI / 2) * (t2 / inFrames));
          letterYOffset[i] = dirs[i].y * maxOffsets[i] * Math.cos((Math.PI / 2) * (t2 / inFrames));
        } else {
          letterOffsets[i] = 0;
          letterYOffset[i] = 0;
          animStates[i].done = true;
        }
      }
    }
    renderText();
    if (!allDone) {
      requestAnimationFrame(animateLetters);
    } else {
      shockwaveActive = false;
    }
  }
  requestAnimationFrame(animateLetters);
}

// On any click, trigger the shockwave glitch
document.addEventListener("click", glitchShockwave);

// On load, show the text
window.onload = () => {
  display = Array.from(targetText);
  letterOffsets = new Array(targetText.length).fill(0);
  renderText();
};