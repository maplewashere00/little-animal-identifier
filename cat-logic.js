'use strict';
// Interpret MobileNet's existing ImageNet categories without inflating scores.
// A tabby is a coat pattern; none of these labels verifies a pedigree.
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CatLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : undefined, function () {
  const TYPES = Object.freeze([
    { id: 'tabby', label: 'Tabby-patterned cat', names: ['tabby', 'tabby cat', 'tiger cat'], note: 'Tabby is a coat pattern, not a breed.' },
    { id: 'siamese', label: 'Siamese-like cat', names: ['siamese cat'], note: 'A resemblance, not proof of breed.' },
    { id: 'persian', label: 'Persian-like cat', names: ['persian cat'], note: 'A resemblance, not proof of breed.' },
    { id: 'shorthair', label: 'Short-haired cat appearance', names: ['egyptian cat'], note: 'MobileNet calls this “Egyptian cat”; it does not verify an Egyptian Mau.' }
  ]);
  // Friendly language describes resemblance, NOT an authenticated breed.
  // We preserve MobileNet's unmodified category name and raw score in the UI.
  const FRIENDLY = Object.freeze({
    tabby: 'Tabby-patterned domestic cat',
    siamese: 'Siamese-like domestic cat',
    persian: 'Persian-like domestic cat',
    shorthair: 'Short-haired domestic cat appearance'
  });

  const MIN_CAT_SUPPORT = 0.2;
  const MIN_TYPE_SUPPORT = 0.15;

  function appearanceId(name) {
    if (typeof name !== 'string') return null;
    const aliases = name.toLowerCase().split(',').map(part => part.trim());
    const found = TYPES.find(type => type.names.some(alias => aliases.includes(alias)));
    return found ? found.id : null;
  }

  function friendlyCategory(className) {
    if (typeof className !== 'string') throw new TypeError('Class name must be text');
    const id = appearanceId(className);
    return {
      display: id ? FRIENDLY[id] : className,
      original: className,
      isCatAppearance: Boolean(id),
      appearanceId: id,
      altered: Boolean(id)
    };
  }

  // Compare top-label stability across correlated transformations of ONE photo.
  // There is no model retraining or synthetic increase in the raw scores.
  function compareTopViews(predictionSets) {
    if (!Array.isArray(predictionSets) || predictionSets.length < 2)
      throw new TypeError('At least two views required');
    const top = predictionSets.map(predictions => {
      if (!Array.isArray(predictions) || !predictions.length) throw new TypeError('View has no predictions');
      const prediction = predictions[0];
      if (!prediction || typeof prediction.className !== 'string' ||
          !Number.isFinite(prediction.probability) ||
          prediction.probability < 0 || prediction.probability > 1)
        throw new TypeError('Invalid top prediction');
      return { ...friendlyCategory(prediction.className), score: prediction.probability };
    });
    const allSameLabel = top.every(view => view.original === top[0].original);
    const catTopViews = top.filter(view => view.isCatAppearance).length;
    const allDomesticCatTop = catTopViews === top.length;
    const allSameCatAppearance = allDomesticCatTop &&
      top.every(view => view.appearanceId === top[0].appearanceId);
    let summary;
    if (allSameLabel) {
      summary = 'All views favored the same model label.';
    } else if (allSameCatAppearance) {
      summary = 'All views favored the same kind of domestic-cat appearance, but used different model labels.';
    } else if (allDomesticCatTop) {
      summary = 'All views favored domestic-cat appearances, but disagreed about the type or pattern.';
    } else if (catTopViews > 0) {
      summary = 'Only some views had a domestic-cat appearance as their top guess. The result is sensitive to framing.';
    } else {
      summary = 'Different views gave different top labels. The result is sensitive to framing.';
    }
    return { top, allSameLabel, catTopViews, allDomesticCatTop, allSameCatAppearance, summary };
  }

  function summarize(predictions) {
    if (!Array.isArray(predictions)) throw new TypeError('Predictions must be an array');
    const scores = Object.fromEntries(TYPES.map(type => [type.id, 0]));
    const seen = new Set();
    for (const prediction of predictions) {
      if (!prediction || typeof prediction.className !== 'string' ||
          !Number.isFinite(prediction.probability) ||
          prediction.probability < 0 || prediction.probability > 1) continue;
      const name = prediction.className.toLowerCase().trim();
      if (seen.has(name)) continue;
      seen.add(name);
      const id = appearanceId(name);
      if (id) scores[id] += prediction.probability;
    }
    const ranking = TYPES.map(type => ({ ...type, score: scores[type.id] }))
      .sort((a, b) => b.score - a.score);
    const total = Math.min(1, Object.values(scores).reduce((sum, score) => sum + score, 0));
    return { scores, total, ranking, best: ranking[0] };
  }

  // Different transformations of the same photo are NOT independent evidence.
  // We average the actual model category scores, rather than rescaling them
  // to create an artificially larger "confidence" number.
  function assessViews(predictionSets) {
    if (!Array.isArray(predictionSets) || predictionSets.length === 0) {
      throw new TypeError('At least one set of predictions is required');
    }
    const views = predictionSets.map(summarize);
    const average = Object.fromEntries(TYPES.map(type => [
      type.id,
      views.reduce((sum, view) => sum + view.scores[type.id], 0) / views.length
    ]));
    const ranked = TYPES.map(type => ({ ...type, score: average[type.id] }))
      .sort((a, b) => b.score - a.score);
    const catSupport = Math.min(1, Object.values(average).reduce((sum, score) => sum + score, 0));
    const best = ranked[0];
    const agreeingViews = views.filter(view =>
      view.best.id === best.id && view.best.score >= MIN_TYPE_SUPPORT).length;
    const threshold = predictionSets.length === 1 ? 1 : Math.floor(predictionSets.length / 2) + 1;
    const enoughAgreement = agreeingViews >= threshold;
    const verdict = catSupport < MIN_CAT_SUPPORT
      ? 'no-cat-signal'
      : best.score >= MIN_TYPE_SUPPORT && enoughAgreement
        ? 'appearance-guess'
        : 'uncertain';
    return {
      verdict,
      best,
      alternatives: ranked.slice(1),
      catSupport,
      agreeingViews,
      viewCount: views.length,
      original: views[0],
      views
    };
  }

  // Cat Detective is a separate object detector, not the ImageNet cat-look
  // classifier above. Keep these compatibility helpers with explicit limits.
  const POSSIBLE_THRESHOLD = 0.4;
  const STRONG_THRESHOLD = 0.7;

  function assess(detections) {
    if (!Array.isArray(detections)) throw new TypeError('Detections must be an array');
    const cats = detections.filter(detection =>
      detection && detection.class === 'cat' &&
      Number.isFinite(detection.score) && detection.score >= POSSIBLE_THRESHOLD &&
      detection.score <= 1 &&
      Array.isArray(detection.bbox) && detection.bbox.length === 4 &&
      detection.bbox.every(Number.isFinite) &&
      detection.bbox[2] > 0 && detection.bbox[3] > 0
    ).sort((a, b) => b.score - a.score);
    const topScore = cats.length ? cats[0].score : 0;
    return {
      verdict: !cats.length ? 'none' : topScore >= STRONG_THRESHOLD ? 'detected' : 'possible',
      topScore,
      cats
    };
  }

  function catLook(predictions) {
    const overview = summarize(predictions);
    if (overview.total < MIN_CAT_SUPPORT || overview.best.score < MIN_TYPE_SUPPORT) return null;
    return { label: overview.best.label, note: overview.best.note, score: overview.best.score };
  }

  return { TYPES, appearanceId, friendlyCategory, compareTopViews, summarize, assessViews, assess, catLook,
    MIN_CAT_SUPPORT, MIN_TYPE_SUPPORT, POSSIBLE_THRESHOLD, STRONG_THRESHOLD };
});