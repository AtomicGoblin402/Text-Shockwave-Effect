// --- Configurable Constants ---
const KNOCKBACK_MULTIPLIER = 3; // Increase for more knockback, decrease for less
const OVERCHARGE_HOLD_TIME = 3000; // ms

// --- Terminal Text Animation ---

const targetText = "One can cook on and with an open fire. These are some of the ways to cook with fire outside. Cooking meat using a spit is a great way to evenly cook meat. In order to keep meat from burning, it's best to slowly rotate it. Hot stones can be used to toast bread. Coals are hot and can bring things to a boil quickly. If one is very adventurous, one can make a hole in the ground, fill it with coals and place foil-covered meat, veggies, and potatoes into the coals, and cover all of it with dirt. In a short period of time, the food will be baked. Campfire cooking can be done in many ways."
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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


// --- Power Meter Bar ---
let powerBar = null;
let powerStartTime = 0;
let powerValue = 0;
let powerBarVisible = false;
let mouseX = 0;
let mouseY = 0;
let powerBarRAF = null;
let mouseMoveHandler = null;
let shakeRAF = null;
let overchargeTimeout = null;
let isOvercharging = false;
let overchargeStartTime = null;
let overchargeColorRAF = null;
let overchargeFired = false;

function showPowerBar(x, y) {
  if (!powerBar) {
    powerBar = document.createElement('div');
    powerBar.style.position = 'fixed';
    powerBar.style.left = '0px';
    powerBar.style.top = '0px';
    powerBar.style.width = '120px';
    powerBar.style.height = '16px';
    powerBar.style.background = 'rgba(0,0,0,0.5)';
    powerBar.style.border = '2px solid #fff';
    powerBar.style.borderRadius = '8px';
    powerBar.style.pointerEvents = 'none';
    powerBar.style.zIndex = 10000;
    powerBar.style.transition = 'opacity 0.2s';
    document.body.appendChild(powerBar);
  }
  powerBar.style.opacity = '1';
  powerBarVisible = true;
  updatePowerBar(x, y, 0);
  // Add mousemove handler to follow mouse while holding
  if (!mouseMoveHandler) {
    mouseMoveHandler = function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updatePowerBar(mouseX, mouseY, powerValue);
    };
    document.addEventListener('mousemove', mouseMoveHandler);
  }
  // Set up overcharge timer
  isOvercharging = false;
  if (overchargeTimeout) clearTimeout(overchargeTimeout);
  if (overchargeColorRAF) cancelAnimationFrame(overchargeColorRAF);
  overchargeStartTime = null;
  overchargeFired = false;
}

function updatePowerBar(x, y, value, isOver) {
  // Clamp value between 0 and 1 for bar fill
  let fillValue = Math.min(Math.max(value, 0), 1);
  powerBar.style.left = (x - 60) + 'px';
  powerBar.style.top = (y - 40) + 'px';
  powerBar.innerHTML = '';
  let fill = document.createElement('div');
  fill.style.height = '100%';
  fill.style.width = (100 * fillValue) + '%';
  // Overcharge color animation
  if (isOver && overchargeStartTime) {
    let elapsed = (Date.now() - overchargeStartTime) / 1000;
    let t = Math.min(elapsed / (OVERCHARGE_HOLD_TIME / 1000), 1); // 0 to 1 over 3 seconds
    // Green: #0f0 (0,255,0), Purple: #a0f (160,0,255)
    let r = Math.round(0   + (160-0)   * t);
    let g = Math.round(255 - (255-0)   * t);
    let b = Math.round(0   + (255-0)   * t);
    fill.style.background = `rgb(${r},${g},${b})`;
  } else {
    fill.style.background = 'linear-gradient(90deg, #0ff, #0f0)';
  }
  fill.style.borderRadius = '8px';
  powerBar.appendChild(fill);
}

function hidePowerBar() {
  if (powerBar) {
    powerBar.style.opacity = '0';
    setTimeout(() => { if (powerBar) powerBar.innerHTML = ''; }, 200);
  }
  powerBarVisible = false;
  // Remove mousemove handler
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler);
    mouseMoveHandler = null;
  }
  // Remove shake effect
  if (shakeRAF) {
    cancelAnimationFrame(shakeRAF);
    shakeRAF = null;
  }
  document.body.style.transform = '';
  // Remove overcharge timer
  if (overchargeTimeout) {
    clearTimeout(overchargeTimeout);
    overchargeTimeout = null;
  }
  if (overchargeColorRAF) {
    cancelAnimationFrame(overchargeColorRAF);
    overchargeColorRAF = null;
  }
  overchargeStartTime = null;
  isOvercharging = false;
}

function startPowerBar(e) {
  powerStartTime = performance.now();
  powerValue = 0;
  mouseX = e.clientX;
  mouseY = e.clientY;
  showPowerBar(mouseX, mouseY);
  let wasAtMax = false;
  function overchargeColorAnim() {
    if (!powerBarVisible || !overchargeStartTime) return;
    updatePowerBar(mouseX, mouseY, powerValue, true);
    overchargeColorRAF = requestAnimationFrame(overchargeColorAnim);
  }
  function grow() {
    if (!powerBarVisible) return;
    powerValue = Math.min((performance.now() - powerStartTime) / 1600, 1.5);
    // If we just reached max charge, start overcharge color and timer
    if (powerValue >= 1.5 && !overchargeStartTime) {
      overchargeStartTime = Date.now();
      overchargeColorAnim();
      if (overchargeTimeout) clearTimeout(overchargeTimeout);
      overchargeTimeout = setTimeout(() => {
        if (powerBarVisible && overchargeStartTime) {
          isOvercharging = true;
          overchargeFired = true;
          hidePowerBar();
          glitchShockwave({ clientX: mouseX, clientY: mouseY, overcharge: true }, 2.0);
        }
      }, OVERCHARGE_HOLD_TIME);
    }
    // If we drop below max charge, cancel overcharge
    if (powerValue < 1.5 && overchargeStartTime) {
      overchargeStartTime = null;
      if (overchargeTimeout) clearTimeout(overchargeTimeout);
      if (overchargeColorRAF) cancelAnimationFrame(overchargeColorRAF);
      updatePowerBar(mouseX, mouseY, powerValue);
    }
    updatePowerBar(mouseX, mouseY, powerValue, !!overchargeStartTime);
    powerBarRAF = requestAnimationFrame(grow);
  }
  // Persistent shake function
  function shake() {
    if (!powerBarVisible) return;
    let shakeStrength = Math.max(0, Math.min(powerValue / 1.5, 1));
    let amp, freq;
    if (powerValue >= 1.5) {
      // Max/overcharge: violent, chaotic shake
      shakeStrength = 1;
      // Add random jitter to amplitude and frequency
      amp = 10 + Math.random() * 8 - 4; // 10±4 px
      freq = 50 + Math.random() * 30 - 15; // 50±15 Hz
    } else {
      amp = 1 * shakeStrength + 9 * Math.pow(shakeStrength, 2);
      freq = 18 + 32 * shakeStrength;
    }
    const t = performance.now() / 1000;
    const x = Math.sin(t * freq) * amp + (powerValue >= 1.5 ? (Math.random()-0.5)*4 : 0);
    const y = Math.cos(t * freq * 0.7) * amp + (powerValue >= 1.5 ? (Math.random()-0.5)*4 : 0);
    document.body.style.transform = `translate(${x}px, ${y}px)`;
    shakeRAF = requestAnimationFrame(shake);
  }
  if (!shakeRAF) shake();
  grow();
}

function stopPowerBar(e) {
  hidePowerBar();
  if (powerBarRAF) cancelAnimationFrame(powerBarRAF);
  // If overcharging, or if overchargeFired, don't send another shockwave (already sent)
  if (isOvercharging || overchargeFired) {
    overchargeFired = false;
    return;
  }
  // Use the last powerValue for the shockwave
  glitchShockwave(e, Math.min(powerValue, 1.5));
}

// --- End Power Meter Bar ---

function glitchShockwave(event, power = 1) {
  renderText();
  // Support overcharge event
  const overcharge = event.overcharge === true;
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const spans = terminalText.querySelectorAll('span');
  for (let i = 0; i < spans.length; i++) {
    display[i] = targetText[i];
    letterOffsets[i] = 0;
    letterYOffset[i] = 0;
  }
  // Store per-letter animation state
  const now = performance.now();
  const animStates = Array.from({ length: spans.length }, () => ({
    phase: 'out', t: 0, t2: 0, done: false
  }));
  // Precompute all delays, directions, maxOffsets, and glitching state
  // Overcharge: longer glitch, more knockback
  const minGlitchFrames = overcharge ? 8 : 2;
  const maxGlitchFrames = overcharge ? 48 : 24;
  // Knockback is always proportional to power and KNOCKBACK_MULTIPLIER
  const knockbackScale = (overcharge ? 1.7 : 1.0) * KNOCKBACK_MULTIPLIER;
  for (let i = 0; i < spans.length; i++) {
    animStates[i].phase = 'out';
    animStates[i].t = 0;
    animStates[i].t2 = 0;
    animStates[i].done = false;
    animStates[i].delayFrames = 0;
    // We'll set glitching and glitchFrames below, after radius check
    animStates[i].glitching = false;
    animStates[i].glitchFrames = 0;
  }
  const delays = [];
  const dirs = [];
  const maxOffsets = [];
  // Set max shockwave radius (in px) for full power
  const maxRadius = window.innerWidth > window.innerHeight ? window.innerWidth * 0.6 : window.innerHeight * 0.6;
  const effectivePower = overcharge ? power : Math.min(power, 0.75);
  const shockwaveRadius = 60 + (maxRadius - 60) * effectivePower; // min 60px, max ~screen size
  for (let i = 0; i < spans.length; i++) {
    const rect = spans[i].getBoundingClientRect();
    const letterX = rect.left + rect.width / 2;
    const letterY = rect.top + rect.height / 2;
    const dx = letterX - mouseX;
    const dy = letterY - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Only affect letters within the shockwave radius
    if (dist > shockwaveRadius) {
      // Mark as instantly done, no animation, no glitch
      animStates[i].done = true;
      animStates[i].glitching = false;
      animStates[i].glitchFrames = 0;
      delays[i] = 0;
      dirs[i] = { x: 0, y: 0 };
      maxOffsets[i] = 0;
      continue;
    }
    const frameDuration = 1000 / 60; // 60fps
    delays[i] = Math.round((dist * 1.1) / frameDuration); // delay in frames
    const mag = dist || 1;
    dirs[i] = { x: dx / mag, y: dy / mag };
    // Scale maxOffsets by power (but only for affected letters)
    // Movement is proportional to power, and even more for overcharge
    maxOffsets[i] = ((40 - Math.min(dist / 3, 20)) * (0.5 + power)) * knockbackScale;
    // Set glitching state and glitchFrames for affected letters
    animStates[i].glitching = true;
    animStates[i].glitchFrames = Math.round(minGlitchFrames + (maxGlitchFrames - minGlitchFrames) * Math.min(power, 1));
  }
  const outFrames = 4;
  const inFrames = 6;
  // Animate all letters in a single frame loop
  function animateLetters() {
    let allDone = true;
    for (let i = 0; i < spans.length; i++) {
      // If either animating or glitching, we're not done
      if (!animStates[i].done || animStates[i].glitching) {
        allDone = false;
      }
      if (animStates[i].done && !animStates[i].glitching) {
        // Letter is fully done, skip
        continue;
      }
      if (animStates[i].delayFrames === undefined) animStates[i].delayFrames = 0;
      if (!animStates[i].done && animStates[i].delayFrames < delays[i]) {
        animStates[i].delayFrames++;
        continue;
      }
      // Glitch effect (frame-based)
      if (animStates[i].glitching) {
        if (animStates[i].glitchFrames > 0) {
          const original = targetText[i];
          if (/[A-Za-z0-9]/.test(original)) {
            display[i] = randomChar();
          } else {
            display[i] = original;
          }
          animStates[i].glitchFrames--;
        } else {
          display[i] = targetText[i];
          animStates[i].glitching = false;
        }
      }
      // Letter is animating
      if (!animStates[i].done) {
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
document.addEventListener("mousedown", startPowerBar);
document.addEventListener("mouseup", stopPowerBar);

// On load, show the text
window.onload = () => {
  display = Array.from(targetText);
  letterOffsets = new Array(targetText.length).fill(0);
  renderText();
};
