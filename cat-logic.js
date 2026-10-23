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
  return { assess, POSSIBLE_THRESHOLD, STRONG_THRESHOLD };
});