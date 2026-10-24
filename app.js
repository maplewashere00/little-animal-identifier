'use strict';
const input = document.getElementById('photo');
const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const button = document.getElementById('identify');
const results = document.getElementById('results');
let imageUrl = null;
let readyPhoto = false;
let running = false;
let model = null;
let loading = null;

function setStatus(message) { statusEl.textContent = message; }
function clearResults() { results.replaceChildren(); results.hidden = true; }
function addLine(parent, tag, message, className) {
  const node = document.createElement(tag);
  node.textContent = message;
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}
function updateButton() { button.disabled = !readyPhoto || running; }
function setBusy(busy) {
  running = busy;
  input.disabled = busy;
  document.getElementById('focus').disabled = busy;
  updateButton();
}
function percent(score) { return `${(score * 100).toFixed(1)}%`; }

async function getModel() {
  if (model) return model;
  if (!loading) {
    loading = (async () => {
      if (!window.tf || !window.mobilenet) throw new Error('MobileNet dependencies unavailable');
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  try { model = await loading; return model; }
  finally { loading = null; }
}

function makeCenterView(image) {
  const inset = 0.14;
  const cropX = Math.round(image.naturalWidth * inset);
  const cropY = Math.round(image.naturalHeight * inset);
  const width = image.naturalWidth - 2 * cropX;
  const height = image.naturalHeight - 2 * cropY;
  if (width < 1 || height < 1) throw new Error('Photo too small for close-up');
  const scale = Math.min(1, 384 / Math.max(width, height));
  const view = document.createElement('canvas');
  view.width = Math.max(1, Math.round(width * scale));
  view.height = Math.max(1, Math.round(height * scale));
  const ctx = view.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(image, cropX, cropY, width, height, 0, 0, view.width, view.height);
  return view;
}

async function showGeneralResult(predictions, classifier, useFocus) {
  if (!Array.isArray(predictions) || predictions.length === 0) throw new Error('No predictions');
  const best = predictions[0];
  addLine(results, 'h2', `Best guess: ${best.className}`, 'guess');
  addLine(results, 'p', `Original photo model score: ${percent(best.probability)}. This is not measured accuracy.`);
  if (best.probability < 0.35) addLine(results, 'p', 'The model is less decisive about this photo.', 'warning');
  addLine(results, 'h3', 'Other possibilities');
  const list = document.createElement('ol');
  for (const prediction of predictions.slice(1, 5)) {
    addLine(list, 'li', `${prediction.className} — ${percent(prediction.probability)}`);
  }
  results.appendChild(list);

  const catSummary = CatLogic.summarize(predictions);
  if (catSummary.total > 0) {
    addLine(results, 'h3', 'Cat appearance clues');
    addLine(results, 'p', `Top domestic-cat appearance: ${catSummary.best.label} — ${percent(catSummary.best.score)} raw grouped category score.`);
    addLine(results, 'p', 'Tabby describes a coat pattern, not a breed. These ImageNet labels cannot reliably determine every cat color or pattern.', 'disclaimer');
  }

  if (useFocus) {
    setStatus('Checking the centered close-up…');
    try {
      const closePredictions = await classifier.classify(makeCenterView(preview), 5);
      if (!closePredictions.length) throw new Error('No close-up predictions');
      const closeBest = closePredictions[0];
      addLine(results, 'h3', 'Centered close-up comparison');
      addLine(results, 'p', `Close-up guess: ${closeBest.className} — ${percent(closeBest.probability)} model score.`);
      addLine(results, 'p', 'This crops 14% from each edge. It may help when the animal is centered, but may cut off animals near the edges. Compare the guesses; a higher score is not automatically a more correct answer.', 'disclaimer');
      if (closeBest.className !== best.className) addLine(results, 'p', 'The two views disagree. Try a clearer picture or a closer photo.', 'warning');
    } catch (error) {
      console.warn('Optional centered close-up failed', error);
      addLine(results, 'p', 'Could not analyze the optional close-up. The original result above is still available.', 'warning');
    }
  }
  results.hidden = false;
}

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
  setBusy(true);
  clearResults();
  setStatus('Loading the animal identifier…');
  try {
    const classifier = await getModel();
    setStatus('Looking at your photo…');
    const predictions = await classifier.classify(preview, 15);
    await showGeneralResult(predictions, classifier, document.getElementById('focus').checked);
    setStatus('Done! Try another picture.');
  } catch (error) {
    console.error('Prediction failed', error);
    setStatus('Could not check this photo. Check your internet connection, then try again.');
  } finally { setBusy(false); }
});
