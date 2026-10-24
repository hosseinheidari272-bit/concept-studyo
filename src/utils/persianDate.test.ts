import test from 'node:test';
import assert from 'node:assert/strict';
import { toPersianDigits, formatPersianPrice, calculateDiscount } from './persianDate.ts';

test('toPersianDigits converts digits accurately', () => {
  assert.equal(toPersianDigits(1234567890), '۱۲۳۴۵۶۷۸۹۰');
  assert.equal(toPersianDigits('2026'), '۲۰۲۶');
});

test('formatPersianPrice formats price with comma separators and currency suffix', () => {
  assert.equal(formatPersianPrice(2500000), '۲,۵۰۰,۰۰۰ تومان');
  assert.equal(formatPersianPrice(0), '۰ تومان');
});

test('calculateDiscount applies correct percentage discount', () => {
  assert.equal(calculateDiscount(1000000, 20), 800000);
  assert.equal(calculateDiscount(500000, 0), 500000);
});
