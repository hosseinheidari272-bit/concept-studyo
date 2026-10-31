import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANOMALY_VARIANTS,
  ENTHUSIASM_HOOKS,
  PAIN_OF_INACTION_HOOKS,
  createShuffledAnomalyDeck,
  pickNonRepeatingAnomaly,
  pickInterruptWordIndex,
  computeIrregularDelayMs,
} from './patternInterruptEngine';

test('ANOMALY_VARIANTS has 14 distinct non-habitual pattern interrupt effects', () => {
  assert.equal(ANOMALY_VARIANTS.length, 14);
  const ids = new Set(ANOMALY_VARIANTS.map((v) => v.id));
  assert.equal(ids.size, 14);
});

test('createShuffledAnomalyDeck returns all 14 variants in a shuffled order', () => {
  const deck1 = createShuffledAnomalyDeck(101);
  const deck2 = createShuffledAnomalyDeck(99999);
  assert.equal(deck1.length, 14);
  assert.equal(deck2.length, 14);
  const order1 = deck1.map((d) => d.id).join(',');
  const order2 = deck2.map((d) => d.id).join(',');
  assert.notEqual(order1, order2);
});

test('pickNonRepeatingAnomaly never repeats the immediately previous anomaly ID', () => {
  let prevId = ANOMALY_VARIANTS[0].id;
  for (let i = 1; i <= 50; i++) {
    const next = pickNonRepeatingAnomaly(prevId, i * 7919);
    assert.notEqual(next.id, prevId);
    prevId = next.id;
  }
});

test('pickInterruptWordIndex selects a meaningful word (>= 3 chars) from Persian text', () => {
  const sentence = 'تبدیل تصاویر محصول به آثاری لوکس و متمایز در بازار';
  const words = sentence.split(/\s+/);
  for (let s = 1; s <= 20; s++) {
    const idx = pickInterruptWordIndex(sentence, s * 1337);
    assert.ok(idx >= 0 && idx < words.length);
    const chosen = words[idx].replace(/[،.؛:!؟«»()]/g, '');
    assert.ok(chosen.length >= 3, `Expected word >= 3 chars, got "${chosen}"`);
  }
});

test('computeIrregularDelayMs stays within configured bounds and varies non-habitually', () => {
  const delays = new Set<number>();
  for (let i = 1; i <= 15; i++) {
    const d = computeIrregularDelayMs(i * 4099, 600, 4200);
    assert.ok(d >= 600 && d <= 4200, `Delay ${d} out of range`);
    delays.add(d);
  }
  assert.ok(delays.size > 10);
});

test('persuasion hooks contain high-energy enthusiasm and pain-of-inaction contrasts', () => {
  assert.ok(ENTHUSIASM_HOOKS.length >= 6);
  assert.ok(PAIN_OF_INACTION_HOOKS.length >= 3);
});
