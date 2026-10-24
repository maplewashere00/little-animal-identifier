'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { appearanceId, summarize, assessViews } = require('../cat-logic.js');
const pred = (className, probability) => ({ className, probability });

test('recognizes tabby and tiger cat as one appearance', () => {
  assert.equal(appearanceId('tabby, tabby cat'), 'tabby');
  assert.equal(appearanceId('tiger cat'), 'tabby');
});
test('does not confuse wild cats with domestic cat appearances', () => {
  assert.equal(appearanceId('tiger'), null);
  assert.equal(appearanceId('lion'), null);
});
test('groups tabby and tiger scores without inventing confidence', () => {
  const s = summarize([pred('tabby, tabby cat', .4), pred('tiger cat', .3), pred('Egyptian cat', .1)]);
  assert.ok(Math.abs(s.scores.tabby - .7) < 1e-10);
  assert.ok(Math.abs(s.total - .8) < 1e-10);
});
test('deduplicates identical label outputs', () => {
  const s = summarize([pred('tabby', .5), pred('tabby', .5)]);
  assert.equal(s.total, .5);
});
test('strong cat appearance remains a guess, not verified breed', () => {
  const a = assessViews([[pred('tabby', .72), pred('dog', .1)]]);
  assert.equal(a.verdict, 'appearance-guess');
  assert.equal(a.best.id, 'tabby');
  assert.equal(a.best.score, .72);
});
test('averages rather than adding across views', () => {
  const a = assessViews([[pred('tabby', .72)], [pred('tabby', .48)], [pred('tabby', .60)]]);
  assert.ok(Math.abs(a.best.score - .60) < 1e-10);
  assert.equal(a.agreeingViews, 3);
});
test('disagreeing views produce an uncertain result', () => {
  const a = assessViews([[pred('tabby', .5)], [pred('Siamese cat', .6)], [pred('Persian cat', .6)]]);
  assert.equal(a.verdict, 'uncertain');
});
test('no cat signals do not turn dogs into cats', () => {
  const a = assessViews([[pred('golden retriever', .95)]]);
  assert.equal(a.verdict, 'no-cat-signal');
});
test('rejects missing prediction arrays', () => {
  assert.throws(() => assessViews([]), TypeError);
});
test('rejects invalid scores without crashing', () => {
  const a = assessViews([[pred('tabby', NaN), pred('Siamese cat', 2)]]);
  assert.equal(a.verdict, 'no-cat-signal');
});

test('cat detector filters non-cats and low scores', () => {
  const a = require('../cat-logic.js').assess([
    { class: 'dog', score: .99, bbox: [0, 0, 30, 30] },
    { class: 'cat', score: .3, bbox: [0, 0, 30, 30] },
    { class: 'cat', score: .78, bbox: [1, 2, 40, 30] }
  ]);
  assert.equal(a.verdict, 'detected');
  assert.equal(a.cats.length, 1);
  assert.equal(a.topScore, .78);
});
test('cat detector distinguishes possible and absent cats', () => {
  const { assess } = require('../cat-logic.js');
  assert.equal(assess([{ class: 'cat', score: .5, bbox: [0, 0, 20, 20] }]).verdict, 'possible');
  assert.equal(assess([{ class: 'dog', score: .9, bbox: [0, 0, 20, 20] }]).verdict, 'none');
});
test('optional cropped cat appearance guess is available', () => {
  const { catLook } = require('../cat-logic.js');
  assert.equal(catLook([pred('tabby, tabby cat', .7)]).label, 'Tabby-patterned cat');
  assert.equal(catLook([pred('golden retriever', .8)]), null);
});

test('Egyptian cat has a friendly appearance label but preserves original label', () => {
  const { friendlyCategory } = require('../cat-logic.js');
  const mapped = friendlyCategory('Egyptian cat');
  assert.equal(mapped.display, 'Short-haired domestic cat appearance');
  assert.equal(mapped.original, 'Egyptian cat');
  assert.equal(mapped.isCatAppearance, true);
});
test('unknown animals keep their original model label', () => {
  const { friendlyCategory } = require('../cat-logic.js');
  const mapped = friendlyCategory('golden retriever');
  assert.equal(mapped.display, 'golden retriever');
  assert.equal(mapped.altered, false);
});
test('three views agree when they predict the same cat label', () => {
  const { compareTopViews } = require('../cat-logic.js');
  const r = compareTopViews([[pred('Egyptian cat', .56)], [pred('Egyptian cat', .45)], [pred('Egyptian cat', .61)]]);
  assert.equal(r.allSameLabel, true);
  assert.equal(r.allDomesticCatTop, true);
  assert.equal(r.top[0].score, .56);
});
test('different domestic cat appearances are flagged as disagreement', () => {
  const { compareTopViews } = require('../cat-logic.js');
  const r = compareTopViews([[pred('Egyptian cat', .56)], [pred('tabby, tabby cat', .74)], [pred('Egyptian cat', .60)]]);
  assert.equal(r.allSameLabel, false);
  assert.equal(r.allDomesticCatTop, true);
  assert.match(r.summary, /disagreed/);
});
test('noncat result is not turned into a cat', () => {
  const { compareTopViews } = require('../cat-logic.js');
  const r = compareTopViews([[pred('Egyptian cat', .56)], [pred('golden retriever', .80)]]);
  assert.equal(r.allDomesticCatTop, false);
  assert.equal(r.catTopViews, 1);
});
test('invalid comparison predictions fail closed', () => {
  const { compareTopViews } = require('../cat-logic.js');
  assert.throws(() => compareTopViews([[pred('Egyptian cat', .56)]]), TypeError);
  assert.throws(() => compareTopViews([[pred('Egyptian cat', .56)], [pred('tabby', NaN)]]), TypeError);
});
