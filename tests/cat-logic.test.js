'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assess } = require('../cat-logic.js');
const box = [10, 20, 200, 100];
const cat = score => ({ class: 'cat', score, bbox: box });

test('strong cat score gets detected verdict', () => {
  const result = assess([cat(0.98)]);
  assert.equal(result.verdict, 'detected');
  assert.equal(result.topScore, 0.98);
});
test('borderline cat score receives uncertain verdict', () => {
  assert.equal(assess([cat(0.42)]).verdict, 'possible');
  assert.equal(assess([cat(0.69)]).verdict, 'possible');
});
test('boundary scores are deterministic', () => {
  assert.equal(assess([cat(0.4)]).verdict, 'possible');
  assert.equal(assess([cat(0.7)]).verdict, 'detected');
  assert.equal(assess([cat(0.39)]).verdict, 'none');
});
test('non-cat objects are not called cats', () => {
  assert.equal(assess([{ class: 'dog', score: 0.99, bbox: box }]).verdict, 'none');
});
test('empty detections are not proof of cat absence', () => {
  const result = assess([]);
  assert.equal(result.verdict, 'none');
  assert.equal(result.topScore, null);
});
test('multiple cats are ranked by strongest detection', () => {
  const result = assess([cat(0.5), cat(0.9), { class: 'dog', score: 0.99, bbox: box }]);
  assert.equal(result.cats.length, 2);
  assert.equal(result.topScore, 0.9);
});
test('invalid model outputs are excluded', () => {
  const result = assess([null, cat(NaN), cat(2), { class: 'cat', score: 1, bbox: [] }, cat(0.8)]);
  assert.equal(result.cats.length, 1);
  assert.equal(result.verdict, 'detected');
});
test('a non-array argument is an error, not a negative detection', () => {
  assert.throws(() => assess(null), TypeError);
});
