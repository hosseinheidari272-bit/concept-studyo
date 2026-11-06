import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, validateRegistration, generateTrackingCode } from './authUtils.ts';

test('hashPassword and verifyPassword work correctly', () => {
  const password = 'mySecretPassword123';
  const { hash, salt } = hashPassword(password);
  
  assert.equal(verifyPassword(password, hash, salt), true);
  assert.equal(verifyPassword('wrongPassword', hash, salt), false);
});

test('admin password verification matches admin123', () => {
  const adminPass = 'admin123';
  const { hash, salt } = hashPassword(adminPass);
  assert.equal(verifyPassword('admin123', hash, salt), true);
  assert.equal(verifyPassword('admin', hash, salt), false);
});

test('validateRegistration catches invalid entries', () => {
  assert.equal(validateRegistration('ab', '12345', 'Ali', '09123456789').valid, false);
  assert.equal(validateRegistration('user1', '123', 'Ali', '09123456789').valid, false);
  assert.equal(validateRegistration('user1', '123456', '', '09123456789').valid, false);
  assert.equal(validateRegistration('user1', '123456', 'Ali Reza').valid, false);
  assert.equal(validateRegistration('user1', '123456', 'Ali Reza', '123456789011').valid, false);
  assert.equal(validateRegistration('user1', '123456', 'Ali Reza', '09111111111').valid, false);
  assert.equal(validateRegistration('user1', '123456', 'Ali Reza', '09123456789').valid, true);
});

test('generateTrackingCode produces 6-digit numeric string', () => {
  const code = generateTrackingCode();
  assert.equal(code.length, 6);
  assert.equal(/^\d{6}$/.test(code), true);
});
