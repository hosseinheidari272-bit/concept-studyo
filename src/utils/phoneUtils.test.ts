import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIranianPhone,
  isValidIranianMobile,
  validateIranianMobileDetailed,
  getIranianMobileOperator,
  isBogusPhoneNumber,
} from './phoneUtils.ts';

test('normalizeIranianPhone converts Persian digits and international prefixes', () => {
  assert.equal(normalizeIranianPhone('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789');
  assert.equal(normalizeIranianPhone('+989123456789'), '09123456789');
  assert.equal(normalizeIranianPhone('00989351234567'), '09351234567');
  assert.equal(normalizeIranianPhone('9123456789'), '09123456789');
  assert.equal(normalizeIranianPhone('0912-345-6789'), '09123456789');
  assert.equal(normalizeIranianPhone('0912 345 6789'), '09123456789');
});

test('validateIranianMobileDetailed rejects bogus numbers like 123456789011', () => {
  // شماره نمونه کاربر: ۱۲۳۴۵۶۷۸۹۰۱۱
  const res1 = validateIranianMobileDetailed('۱۲۳۴۵۶۷۸۹۰۱۱');
  assert.equal(res1.isValid, false);
  assert.ok(res1.error?.includes('09') || res1.error?.includes('۰۹'));

  const res2 = validateIranianMobileDetailed('123456789011');
  assert.equal(res2.isValid, false);

  const res3 = validateIranianMobileDetailed('09111111111');
  assert.equal(res3.isValid, false);

  const res4 = validateIranianMobileDetailed('09000000000');
  assert.equal(res4.isValid, false);
});

test('validateIranianMobileDetailed accepts valid operators and identifies them', () => {
  const mci = validateIranianMobileDetailed('09123456789');
  assert.equal(mci.isValid, true);
  assert.equal(mci.operatorName, 'همراه اول');

  const mtn = validateIranianMobileDetailed('09351234567');
  assert.equal(mtn.isValid, true);
  assert.equal(mtn.operatorName, 'ایرانسل');

  const rightel = validateIranianMobileDetailed('09211234567');
  assert.equal(rightel.isValid, true);
  assert.equal(rightel.operatorName, 'رایتل');
});
