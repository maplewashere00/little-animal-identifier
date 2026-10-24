'use strict';
// Transparent, intentionally conservative decision rules. These thresholds
// are starting guesses, NOT calibrated precision or accuracy guarantees.
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CatLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : undefined, function () {
  const POSSIBLE_THRESHOLD = 0.4;
  const STRONG_THRESHOLD = 0.7;

  function assess(detections) {
    if (!Array.isArray(detections)) throw new TypeError('Expected a detection list');
    const cats = detections
      .filter(item => item && item.class === 'cat' &&
        Number.isFinite(item.score) && item.score >= POSSIBLE_THRESHOLD && item.score <= 1 &&
        Array.isArray(item.bbox) && item.bbox.length === 4 &&
        item.bbox.every(Number.isFinite))
      .sort((a, b) => b.score - a.score);
    if (cats.length === 0) return { verdict: 'none', cats, topScore: null };
    return {
      verdict: cats[0].score >= STRONG_THRESHOLD ? 'detected' : 'possible',
      cats,
      topScore: cats[0].score
    };
  }

  // MobileNet's ImageNet classes contain only a few cat looks.
  // These are NOT reliable breed diagnoses (tabby is a coat pattern).
  function catLook(predictions) {
    if (!Array.isArray(predictions)) throw new TypeError('Expected classification predictions');
    const looks = [
      { match: /\btabby\b|\btiger cat\b/, label: 'Tabby-patterned cat', note: 'Tabby is a coat pattern, not a breed.' },
      { match: /\bsiamese cat\b|^siamese\b/, label: 'Siamese-like cat', note: 'This is a resemblance, not breed verification.' },
      { match: /\bpersian cat\b|^persian\b/, label: 'Persian-like cat', note: 'This is a resemblance, not breed verification.' },
      { match: /\begyptian cat\b/, label: 'Short-haired cat appearance', note: 'The model calls this category “Egyptian cat”; it does not verify an Egyptian Mau breed.' }
    ];
    for (const prediction of predictions.slice(0, 5)) {
      if (!prediction || typeof prediction.className !== 'string' ||
          !Number.isFinite(prediction.probability) ||
          prediction.probability < 0.15 || prediction.probability > 1) continue;
      const name = prediction.className.toLowerCase().trim();
      const match = looks.find(look => look.match.test(name));
      if (match) return { label: match.label, note: match.note, score: prediction.probability };
    }
    return null;
  }
  return { assess, catLook, POSSIBLE_THRESHOLD, STRONG_THRESHOLD };
});