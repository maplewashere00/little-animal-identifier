'use strict';
const input = document.getElementById('photo');
const preview = document.getElementById('preview');
const canvas = document.getElementById('overlay');
const statusEl = document.getElementById('status');
const button = document.getElementById('identify');
const results = document.getElementById('results');
const modes = [...document.querySelectorAll('input[name="mode"]')];
let imageUrl = null;
let readyPhoto = false;
let running = false;
const models = { cat: null, general: null };
const loading = { cat: null, general: null };

function setStatus(message) { statusEl.textContent = message; }
function clearResults() { results.replaceChildren(); results.hidden = true; canvas.hidden = true; }
function addLine(parent, tag, message, className) {
  const node = document.createElement(tag);
  node.textContent = message;
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}
function updateButton() { button.disabled = !readyPhoto || running; }
function selectedMode() { return modes.find(mode => mode.checked).value; }
function setBusy(busy) {
  running = busy;
  input.disabled = busy;
  modes.forEach(mode => { mode.disabled = busy; });
  updateButton();
}
function percent(score) { return `${(score * 100).toFixed(1)}%`; }

// Load only the selected model. Keeping both unloaded until needed makes
// a first visit lighter for phones and tablets.
async function getModel(mode) {
  if (models[mode]) return models[mode];
  if (!loading[mode]) {
    loading[mode] = (async () => {
      if (!window.tf) throw new Error('TensorFlow.js is unavailable');
      if (mode === 'cat') {
        if (!window.cocoSsd) throw new Error('COCO-SSD is unavailable');
        return cocoSsd.load({ base: 'lite_mobilenet_v2' });
      }
      if (!window.mobilenet) throw new Error('MobileNet is unavailable');
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  try {
    models[mode] = await loading[mode];
    return models[mode];
  } finally {
    loading[mode] = null; // failed downloads may be retried
  }
}

function drawCatBoxes(cats) {
  if (!cats.length) return;
  canvas.width = preview.naturalWidth;
  canvas.height = preview.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const lineWidth = Math.max(3, Math.min(canvas.width, canvas.height) / 130);
  ctx.lineWidth = lineWidth;
  ctx.font = `${Math.max(18, lineWidth * 5)}px system-ui`;
  for (const cat of cats) {
    const [x, y, w, h] = cat.bbox;
    ctx.strokeStyle = cat.score >= CatLogic.STRONG_THRESHOLD ? '#22e0a0' : '#ffc55c';
    ctx.strokeRect(x, y, w, h);
    const label = `Cat ${percent(cat.score)}`;
    const labelWidth = ctx.measureText(label).width + 14;
    const labelHeight = Math.max(22, lineWidth * 6);
    const labelY = Math.max(0, y - labelHeight);
    ctx.fillStyle = 'rgba(30, 26, 40, .88)';
    ctx.fillRect(x, labelY, labelWidth, labelHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 7, labelY + labelHeight * .76);
  }
  canvas.hidden = false;
}

async function showCatResult(detections) {
  const outcome = CatLogic.assess(detections);
  if (outcome.verdict === 'detected') {
    addLine(results, 'h2', outcome.cats.length > 1 ? '🐱 Cats detected!' : '🐱 Cat detected!', 'guess');
    addLine(results, 'p', `Top detection score: ${percent(outcome.topScore)}. This is not a measured accuracy percentage.`);
  } else if (outcome.verdict === 'possible') {
    addLine(results, 'h2', '🐱 Possible cat — uncertain', 'guess');
    addLine(results, 'p', `Top detection score: ${percent(outcome.topScore)}. Try a clearer or closer photo.`);
  } else {
    addLine(results, 'h2', 'No cat detected', 'guess');
    addLine(results, 'p', 'That does not mean there is definitely no cat! The model can miss cats, especially when they are small, partly hidden, or poorly lit.');
  }
  if (outcome.cats.length > 1) addLine(results, 'p', `${outcome.cats.length} possible cat locations found.`);
  addLine(results, 'p', 'Cat Detective is an experimental detector, not a guarantee.', 'disclaimer');
  drawCatBoxes(outcome.cats);
  results.hidden = false;
  if (outcome.cats.length) {
    addLine(results, 'h3', 'What kind of cat does it resemble?');
    addLine(results, 'p', 'These are appearance guesses, not verified breeds. Tabby describes a coat pattern.', 'disclaimer');
    try {
      const generalModel = await getModel('general');
      const cat = outcome.cats[0];
      const [x, y, width, height] = cat.bbox;
      const crop = document.createElement('canvas');
      const left = Math.max(0, Math.floor(x));
      const top = Math.max(0, Math.floor(y));
      const cropWidth = Math.min(preview.naturalWidth - left, Math.ceil(width));
      const cropHeight = Math.min(preview.naturalHeight - top, Math.ceil(height));
      if (cropWidth <= 0 || cropHeight <= 0) throw new Error('Invalid cat crop');
      crop.width = cropWidth;
      crop.height = cropHeight;
      const context = crop.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(preview, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const guesses = await generalModel.classify(crop, 5);
      const look = CatLogic.catLook(guesses);
      if (look) {
        addLine(results, 'p', `Best appearance guess: ${look.label}`);
        addLine(results, 'p', `${look.note} Model score: ${percent(look.score)} (not breed certainty).`, 'disclaimer');
      } else {
        addLine(results, 'p', 'Cat type unclear from this photo. Try a closer, brighter picture.');
      }
      if (outcome.cats.length > 1) addLine(results, 'p', 'Appearance guess is for the highest-scoring cat only.', 'disclaimer');
    } catch (error) {
      console.warn('Optional cat appearance estimate failed:', error);
      addLine(results, 'p', 'Cat detected, but appearance analysis is unavailable right now.');
    }
  }
}

async function showGeneralResult(predictions, classifier) {
  if (!Array.isArray(predictions) || predictions.length === 0) throw new Error('No predictions');
  const best = predictions[0];
  addLine(results, 'h2', `Best guess: ${best.className}`, 'guess');
  addLine(results, 'p', `Model score: ${percent(best.probability)} (not a calibrated probability of being correct)`);
  if (best.probability < 0.35) addLine(results, 'p', 'Low score: the model may be unsure.', 'warning');
  addLine(results, 'h3', 'Other possibilities');
  const list = document.createElement('ol');
  for (const prediction of predictions.slice(1)) {
    addLine(list, 'li', `${prediction.className} — ${percent(prediction.probability)}`);
  }
  results.appendChild(list);
  addLine(results, 'h3', 'Cat appearance analysis');
  const views = [predictions];
  const firstPass = CatLogic.summarize(predictions);
  if (firstPass.total >= 0.08) {
    setStatus('Checking cat appearance across three views…');
    const image = preview;
    const makeView = (flip, inset) => {
      const canvas = document.createElement('canvas');
      const cropX = Math.round(image.naturalWidth * inset);
      const cropY = Math.round(image.naturalHeight * inset);
      const width = image.naturalWidth - 2 * cropX;
      const height = image.naturalHeight - 2 * cropY;
      const scale = Math.min(1, 384 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      if (flip) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(image, cropX, cropY, width, height, 0, 0, canvas.width, canvas.height);
      return canvas;
    };
    views.push(await classifier.classify(makeView(true, 0), 15));
    views.push(await classifier.classify(makeView(false, 0.08), 15));
  }
  const assessment = CatLogic.assessViews(views);
  if (assessment.verdict === 'appearance-guess') {
    addLine(results, 'p', 'Best appearance guess: ' + assessment.best.label, 'guess');
    addLine(results, 'p', assessment.best.note);
  } else if (assessment.verdict === 'uncertain') {
    addLine(results, 'p', 'Cat appearance unclear — the different views do not agree strongly enough.');
  } else {
    addLine(results, 'p', 'No strong domestic-cat signal in the model labels. This does not rule out a cat.');
  }
  addLine(results, 'p', 'Combined cat-category support: ' + percent(assessment.catSupport) + '. This combines related model labels, not a calibrated probability of being correct.');
  if (assessment.verdict !== 'no-cat-signal') {
    addLine(results, 'p', assessment.best.label + ' score averaged across views: ' + percent(assessment.best.score) + '; leading category in ' + assessment.agreeingViews + ' of ' + assessment.viewCount + ' views.');
    addLine(results, 'p', 'Views come from the same photo, so agreement is not independent evidence. Tabby is a coat pattern, not a breed.', 'disclaimer');
  }
  results.hidden = false;
}

modes.forEach(mode => mode.addEventListener('change', () => {
  clearResults();
  setStatus(readyPhoto ? 'Ready to check your photo.' : 'Choose a photo to begin.');
}));

input.addEventListener('change', () => {
  clearResults();
  readyPhoto = false;
  updateButton();
  preview.hidden = true;
  if (imageUrl) { URL.revokeObjectURL(imageUrl); imageUrl = null; }
  const file = input.files && input.files[0];
  if (!file) { setStatus('Choose a photo to begin.'); return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    setStatus('Please choose a JPG, PNG, or WebP photo under 10 MB.'); return;
  }
  imageUrl = URL.createObjectURL(file);
  preview.onload = () => {
    readyPhoto = true;
    updateButton();
    setStatus('Photo ready! Tap Check photo.');
  };
  preview.onerror = () => { readyPhoto = false; updateButton(); setStatus('Could not read this image. Try another.'); };
  preview.src = imageUrl;
  preview.hidden = false;
});

button.addEventListener('click', async () => {
  if (running || !readyPhoto) return;
  const mode = selectedMode();
  setBusy(true);
  clearResults();
  setStatus(mode === 'cat' ? 'Loading Cat Detective…' : 'Loading the animal identifier…');
  try {
    const model = await getModel(mode);
    setStatus('Looking at your photo…');
    if (mode === 'cat') {
      const detections = await model.detect(preview, 20, 0.3);
      await showCatResult(detections);
    } else {
      const predictions = await model.classify(preview, 15);
      await showGeneralResult(predictions, model);
    }
    setStatus('Done! Try another picture.');
  } catch (error) {
    console.error('Prediction failed', error);
    setStatus('Could not check this photo. Check your internet connection, then try again.');
  } finally {
    setBusy(false);
  }
});