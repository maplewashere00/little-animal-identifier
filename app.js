'use strict';
const input = document.getElementById('photo');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const button = document.getElementById('identify');
const results = document.getElementById('results');
let model = null;
let photoURL = null;
let readyPhoto = false;

function setStatus(message) { status.textContent = message; }
function clearResults() { results.replaceChildren(); results.hidden = true; }
function addLine(parent, tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  parent.appendChild(node);
}

async function loadModel() {
  try {
    if (!window.mobilenet || !window.tf) throw new Error('Model libraries unavailable');
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    setStatus('Model ready. Choose a photo!');
    button.disabled = !readyPhoto;
  } catch (error) {
    setStatus('Could not load the model. Check your internet connection and refresh.');
    console.error('Model loading failed:', error);
  }
}

input.addEventListener('change', () => {
  clearResults();
  readyPhoto = false;
  button.disabled = true;
  preview.hidden = true;
  if (photoURL) { URL.revokeObjectURL(photoURL); photoURL = null; }
  const file = input.files && input.files[0];
  if (!file) { setStatus(model ? 'Choose a photo!' : 'Loading the image model…'); return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    setStatus('Please choose a JPG, PNG, or WebP image under 10 MB.'); return;
  }
  photoURL = URL.createObjectURL(file);
  preview.onload = () => {
    readyPhoto = true;
    button.disabled = !model;
    setStatus(model ? 'Photo ready. Tap Identify animal!' : 'Photo ready; waiting for the model…');
  };
  preview.onerror = () => { readyPhoto = false; button.disabled = true; setStatus('Could not read this image. Please choose another.'); };
  preview.src = photoURL;
  preview.hidden = false;
});

button.addEventListener('click', async () => {
  if (!model || !readyPhoto) return;
  button.disabled = true;
  clearResults();
  setStatus('Looking at your photo…');
  try {
    const predictions = await model.classify(preview, 5);
    if (!predictions.length) throw new Error('No predictions returned');
    const best = predictions[0];
    const pct = (best.probability * 100).toFixed(1);
    addLine(results, 'h2', `Best guess: ${best.className}`, 'guess');
    addLine(results, 'p', `Model score: ${pct}% (not a calibrated certainty)`);
    if (best.probability < 0.35) addLine(results, 'p', 'Low score: the model is unsure. Try a clearer picture.', 'warning');
    addLine(results, 'h3', 'Other possibilities');
    const list = document.createElement('ol');
    for (const prediction of predictions.slice(1)) {
      addLine(list, 'li', `${prediction.className} — ${(prediction.probability * 100).toFixed(1)}%`);
    }
    results.appendChild(list);
    results.hidden = false;
    setStatus('Prediction complete.');
  } catch (error) {
    setStatus('Could not classify this photo. Please try another image.');
    console.error('Classification failed:', error);
  } finally {
    button.disabled = !model || !readyPhoto;
  }
});

loadModel();