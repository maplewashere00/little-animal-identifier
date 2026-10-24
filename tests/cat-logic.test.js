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
